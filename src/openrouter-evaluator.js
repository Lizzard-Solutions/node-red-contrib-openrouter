module.exports = function(RED) {
    const axios = require('axios');
    function OpenRouterEvaluator(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const server = RED.nodes.getNode(config.config);

        if (server) {
            node.apiKey = server.credentials.apiKey;
            node.siteUrl = server.credentials.siteUrl || '';
            node.siteName = server.credentials.siteName || '';
            node.modelFromConfig = server.model || '';
        } else {
            node.modelFromConfig = '';
        }
        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node, arguments); };
            
            if (!server || !node.apiKey) {
                const err = new Error('OpenRouter config not set');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send([null, msg]);
            }
            const model = node.modelFromConfig;
            if (!model) {
                const err = new Error('No model specified. Set a model in the shared config');
                if (done) { done(err); } else { node.error(err, msg); }
                return send([null, msg]);
            }
            let temperature = msg.temperature !== undefined ? msg.temperature : (config.temperature !== undefined ? config.temperature : 0.1);
            let maxTokens = msg.maxTokens !== undefined ? msg.maxTokens : (config.maxTokens || 200);

            temperature = parseFloat(temperature);
            maxTokens = parseInt(maxTokens);

            const criteria = config.criteria || 'Evaluate the input on quality and relevance. Score from 0-10.';
            const scaleType = config.scaleType || 'numeric';

            if (!msg.payload) {
                const err = new Error('No payload to evaluate');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send([null, msg]);
            }

            const content = typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload);
            const messages = [
                { role: 'system', content: criteria },
                { role: 'user', content: `Evaluate this: ${content}` }
            ];

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

            axios.post(url, data, { headers })
                .then((res) => {
                    if (res.status >= 200 && res.status < 300) {
                        const responseText = res.data.choices[0].message.content;
                        msg.response = res.data;
                        msg.evaluation = responseText;

                        let score, validated;
                        if (scaleType === 'numeric') {
                            const scoreMatch = responseText.match(/(\d+(?:\.\d+)?)/);
                            score = scoreMatch ? parseFloat(scoreMatch[1]) : null;
                            msg.score = score;
                        } else if (scaleType === 'binary') {
                            validated = responseText.toLowerCase().includes('pass') || responseText.toLowerCase().includes('yes');
                            msg.validated = validated;
                        } else if (scaleType === 'json') {
                            try {
                                const parsed = JSON.parse(responseText);
                                msg.evaluationResult = parsed;
                            } catch (e) {
                                node.warn('Failed to parse JSON response: ' + e.message);
                            }
                        }
                        send([msg, null]);
                    } else {
                        const err = new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
                        if (done) done(err); else node.error(err, msg);
                        send([null, msg]);
                    }
                    if (done) done();
                })
                .catch((e) => {
                    let errorMsg = 'Request error: ' + e.message;
                    if (e.response) {
                        errorMsg += '\nStatus: ' + e.response.status;
                        errorMsg += '\nResponse: ' + JSON.stringify(e.response.data);
                        node.error(errorMsg, msg);
                    } else {
                        node.error(errorMsg, msg);
                    }
                    const err = new Error(errorMsg);
                    msg.error = { message: e.message, status: e.response ? e.response.status : null, data: e.response ? e.response.data : null };
                    if (done) done(err);
                    send([null, msg]);
                });
        });
    }

    RED.nodes.registerType('openrouter-evaluator', OpenRouterEvaluator);
};