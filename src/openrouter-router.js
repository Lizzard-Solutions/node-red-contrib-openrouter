module.exports = function(RED) {
    const axios = require('axios');

    function OpenRouterRouter(config) {
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

        // Parse routes from config
        node.outputs = [];
        if (config.routes) {
            if (typeof config.routes === 'string') {
                try {
                    node.outputs = JSON.parse(config.routes);
                } catch (parseErr) {
                    // Fallback: try splitting comma-separated string
                    try {
                        node.outputs = config.routes.split(',').map(route => route.trim()).filter(route => route.length > 0);
                        console.log('Parsed routes as comma-separated:', node.outputs);
                    } catch (splitErr) {
                        console.log('Failed to parse routes as comma-separated:', splitErr);
                        node.outputs = [];
                    }
                }
            } else if (Array.isArray(config.routes)) {
                node.outputs = config.routes;
            }
        }
        if (node.outputs.length === 0) {
            node.warn('No routes defined');
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
                return send(null);
            }

            if (node.outputs.length === 0) {
                const err = new Error('No routes defined');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send(msg);
            }

            let model = node.modelFromConfig;
            if (!model) {
                const err = new Error('No model specified. Set a model in the shared config');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send(msg);
            }
            let temperature = msg.temperature !== undefined ? msg.temperature : (config.temperature !== undefined ? config.temperature : 0.1);
            let maxTokens = msg.maxTokens !== undefined ? msg.maxTokens : (config.maxTokens || 50);
            let topP = msg.topP !== undefined ? msg.topP : (config.topP !== undefined ? config.topP : 1);

            temperature = parseFloat(temperature);
            maxTokens = parseInt(maxTokens);
            topP = parseFloat(topP);

            // Get input text
            let inputText;
            if (msg.payload) {
                inputText = typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload);
            } else {
                const err = new Error('No payload provided');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send(msg);
            }
           
            // Build classification prompt
            console.log(node.outputs)
            let routeDescriptions = node.outputs.map((prompt, index) => `${index + 1}. ${prompt}`).join('\n');
            let systemMessage = `You are a classifier. Classify the following user message into exactly one of the routes below. Respond with ONLY the route number (1-${node.outputs.length}).

Routes:
${routeDescriptions}

User message: ${inputText}`;

            const messages = [
                { role: 'system', content: systemMessage },
                { role: 'user', content: inputText }
            ];

            const data = {
                model: model,
                messages: messages,
                temperature: temperature,
                max_tokens: maxTokens,
                top_p: topP
            };

            const url = 'https://openrouter.ai/api/v1/chat/completions';
            const headers = {
                'Authorization': `Bearer ${node.apiKey}`,
                'Content-Type': 'application/json'
            };
            if (node.siteUrl) {
                headers['HTTP-Referer'] = node.siteUrl;
            }
            if (node.siteName) {
                headers['X-Title'] = node.siteName;
            }

            axios.post(url, data, { headers })
                .then((res) => {
                    if (res.status >= 200 && res.status < 300) {
                        let responseText = res.data.choices[0].message.content.trim();
                        let match = responseText.match(/(\d+)/);
                        let routeIndex = match ? parseInt(match[1]) - 1 : 0; // Default to 0
                        routeIndex = Math.max(0, Math.min(routeIndex, node.outputs.length - 1));

                        msg.route = routeIndex;
                        msg.classification = responseText;

                        let outputs = new Array(node.outputs.length).fill(null);
                        outputs[routeIndex] = msg;
                        send(outputs);

                        if (done) done();
                    } else {
                        const err = new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
                        if (done) {
                            done(err);
                        } else {
                            node.error(err, msg);
                        }
                        send(msg);
                        if (done) done();
                    }
                })
                .catch((e) => {
                    let errorMsg = 'Classification error: ' + e.message;
                    if (e.response) {
                        errorMsg += '\nStatus: ' + e.response.status;
                        errorMsg += '\nResponse: ' + JSON.stringify(e.response.data);
                        node.error(errorMsg, msg);
                    } else {
                        node.error(errorMsg, msg);
                    }

                    msg.error = {
                        message: e.message,
                        status: e.response ? e.response.status : null,
                        data: e.response ? e.response.data : null
                    };

                    send(msg);
                    if (done) {
                        done(e);
                    }
                });
        });
    }

    RED.nodes.registerType('openrouter-router', OpenRouterRouter);
};
