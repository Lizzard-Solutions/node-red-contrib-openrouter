module.exports = function(RED) {
    const axios = require('axios');
    function OpenRouterOrchestrator(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const server = RED.nodes.getNode(config.config);

        if (server) {
            node.apiKey = server.credentials.apiKey;
            node.siteUrl = server.credentials.siteUrl || '';
            node.siteName = server.credentials.siteName || '';
        }

        // Parse agents config - expect JSON array like [{"type": "chat", "model": "model1", "prompt": "prompt1"}]
        let agents;
        try {
            agents = JSON.parse(config.agents || '[]');
        } catch (e) {
            node.warn('Invalid agents config: ' + e.message);
            agents = [];
        }
        const mode = config.mode || 'sequential'; // sequential or parallel

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node, arguments); };
            
            if (!server || !node.apiKey || agents.length === 0) {
                const err = new Error('OpenRouter config or agents not set');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send([null, msg]);
            }

            let currentMsg = RED.util.cloneMessage(msg); // Deep copy
            console.log(currentMsg)
            const results = [];

            const processAgent = async (agent, index, currentMsg) => {
                const model = agent.model || 'openai/gpt-4o-mini';
                const temperature = agent.temperature !== undefined ? parseFloat(agent.temperature) : 0.7;
                const maxTokens = agent.maxTokens !== undefined ? parseInt(agent.maxTokens) : 1000;
                node.log(typeof currentMsg.payload)
                node.log(typeof currentMsg)
                let messages = [];
                if (Array.isArray(currentMsg.messages)) {
                    messages = currentMsg.messages.slice();
                } else if (Array.isArray(currentMsg.payload)) {
                    messages = currentMsg.payload.slice();
                } else if (typeof currentMsg.messages === 'string') {
                    try {
                        const parsed = JSON.parse(currentMsg.messages);
                        if (Array.isArray(parsed)) {
                            messages = parsed;
                        } else {
                            messages = [{ role: 'user', content: currentMsg.messages }];
                        }
                    } catch (e) {
                        messages = [{ role: 'user', content: currentMsg.messages }];
                    }
                } else if (typeof currentMsg.payload === 'string') {
                    try {
                        const parsed = JSON.parse(currentMsg.payload);
                        if (Array.isArray(parsed)) {
                            messages = parsed;
                        } else {
                            messages = [{ role: 'user', content: currentMsg.payload }];
                        }
                    } catch (e) {
                        messages = [{ role: 'user', content: currentMsg.payload }];
                    }
                } else if (typeof currentMsg.messages === 'object' && currentMsg.messages !== null) {
                    messages = [currentMsg.messages];
                } else if (typeof currentMsg.payload === 'object' && currentMsg.payload !== null) {
                    messages = [currentMsg.payload];
                }
                if (agent.prompt && typeof agent.prompt === 'string') {
                    messages.push({ role: 'system', content: agent.prompt });
                }
                if (!messages.length && currentMsg.payload) {
                    messages = [{ role: 'user', content: typeof currentMsg.payload === 'string' ? currentMsg.payload : JSON.stringify(currentMsg.payload) }];
                }

                const data = {
                    model: model,
                    messages: messages,
                    temperature: temperature,
                    max_tokens: maxTokens
                };

                const url = 'https://openrouter.ai/api/v1/chat/completions';
                const headers = {
                    'Authorization': `Bearer ${node.apiKey}`,
                    'Content-Type': 'application/json'
                };
                if (node.siteUrl) headers['HTTP-Referer'] = node.siteUrl;
                if (node.siteName) headers['X-Title'] = node.siteName;

                try {
                    const res = await axios.post(url, data, { headers });
                    if (res.status >= 200 && res.status < 300) {
                        const content = res.data.choices[0].message.content;
                        results.push({ agent: index, response: content, full: res.data });
                        // Chain: append to messages for next agent
                        messages.push({ role: 'assistant', content: content });
                        currentMsg.messages = messages;
                        currentMsg.payload = content;
                    } else {
                        throw new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
                    }
                } catch (e) {
                    node.error('Agent ' + index + ' error: ' + e.message, msg);
                    results.push({ agent: index, error: e.message });
                }
            };

            const runAgents = async () => {
                if (mode === 'parallel') {
                    await Promise.all(agents.map((agent, index) => processAgent(agent, index, currentMsg)));
                } else { // sequential
                    for (let i = 0; i < agents.length; i++) {
                        await processAgent(agents[i], i ,currentMsg);
                    }
                }
                currentMsg.results = results;
                send([currentMsg, null]);
                if (done) done();
            };

            runAgents().catch(err => {
                node.error(err, msg);
                if (done) done(err);
                send([null, msg]);
            });
        });
    }

    RED.nodes.registerType('openrouter-orchestrator', OpenRouterOrchestrator);
};