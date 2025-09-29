module.exports = function(RED) {
    const axios = require('axios');

    function OpenRouterMemory(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const server = RED.nodes.getNode(config.config);

        if (server) {
            node.apiKey = server.credentials.apiKey;
            node.siteUrl = server.credentials.siteUrl || '';
            node.siteName = server.credentials.siteName || '';
        }

        node.bufferSize = parseInt(config.bufferSize) || 10;
        node.sessionKey = config.sessionKey || 'default';
        node.enableSummarization = config.enableSummarization || false;
        node.summaryModel = config.summaryModel || 'openai/gpt-4o-mini';

        // Storage for history: {sessionKey: [{role, content}, ...]}
        node.historyStore = node.context().get('history') || {};

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node, arguments); };
                
            if (!server || !node.apiKey) {
                const err = new Error('OpenRouter config not set for summarization');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send(msg);
            }

            let currentSessionKey = msg[node.sessionKey] || msg.topic || node.sessionKey;
            if (!node.historyStore[currentSessionKey]) {
                node.historyStore[currentSessionKey] = [];
            }
            let history = node.historyStore[currentSessionKey];

            // Assume input has msg.messages as array of {role, content}
            if (!msg.messages || !Array.isArray(msg.messages)) {
                msg.messages = [];
            }

            // Append current messages to history
            history.push(...msg.messages);

            // Limit to buffer size
            if (history.length > node.bufferSize) {
                if (node.enableSummarization) {
                    // Summarize oldest messages
                    let toSummarize = history.splice(0, history.length - node.bufferSize);
                    let summaryPrompt = `Summarize the following conversation history concisely:\n${toSummarize.map(m => `${m.role}: ${m.content}`).join('\n')}`;
                    let summaryMessages = [
                        { role: 'system', content: 'You are a helpful summarizer. Provide a brief summary.' },
                        { role: 'user', content: summaryPrompt }
                    ];

                    const data = {
                        model: node.summaryModel,
                        messages: summaryMessages,
                        max_tokens: 150,
                        temperature: 0.3
                    };

                    const url = 'https://openrouter.ai/api/v1/chat/completions';
                    const headers = {
                        'Authorization': `Bearer ${node.apiKey}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': node.siteUrl,
                        'X-Title': node.siteName
                    };

                    axios.post(url, data, { headers })
                        .then((res) => {
                            if (res.data.choices && res.data.choices[0]) {
                                let summary = res.data.choices[0].message.content.trim();
                                history.unshift({ role: 'system', content: `Summary of previous conversation: ${summary}` });
                            }
                            // Proceed with updated msg
                            injectHistory(msg, history, currentSessionKey);
                            send(msg);
                            if (done) done();
                        })
                        .catch((e) => {
                            node.warn('Summarization failed, keeping full history: ' + e.message);
                            // Fallback: just trim without summary
                            history = history.slice(-node.bufferSize);
                            injectHistory(msg, history, currentSessionKey);
                            send(msg);
                            if (done) done(e);
                        });
                } else {
                    // Simple trim
                    history = history.slice(-node.bufferSize);
                    injectHistory(msg, history, currentSessionKey);
                    send(msg);
                    if (done) done();
                }
            } else {
                injectHistory(msg, history, currentSessionKey);
                send(msg);
                if (done) done();
            }

            // Persist history
            node.context().set('history', node.historyStore);
        });

        function injectHistory(msg, history, sessionKey) {
            // Prepend history to msg.messages, excluding the current ones if needed
            // Assuming msg.messages are the new ones; history already includes them
            msg.messages = [...history.slice(0, -msg.messages.length), ...msg.messages];
            msg.sessionKey = sessionKey;
            msg.historyLength = history.length;
        }
    }

    RED.nodes.registerType('openrouter-memory', OpenRouterMemory);
};
