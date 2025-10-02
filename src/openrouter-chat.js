module.exports = function(RED) {
    const axios = require('axios');
    function OpenRouterChat(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const server = RED.nodes.getNode(config.config);

        if (server) {
            node.apiKey = server.credentials.apiKey;
            node.siteUrl = server.credentials.siteUrl || '';
            node.siteName = server.credentials.siteName || '';
            node.modelFromConfig = server.model || '';
        } 

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node, arguments); };
            if (!server || !node.apiKey || !server.model) {
                const err = new Error('OpenRouter config not set');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send([null, msg]);
            }
            let model =  node.modelFromConfig 
          
            let temperature = msg.temperature !== undefined ? msg.temperature : (config.temperature !== undefined ? config.temperature : 0.7);
            let maxTokens = msg.maxTokens !== undefined ? msg.maxTokens : (config.maxTokens || 1000);
            let topP = msg.topP !== undefined ? msg.topP : (config.topP !== undefined ? config.topP : 1);

            // Ensure numeric values are actually numbers
            temperature = parseFloat(temperature);
            maxTokens = parseInt(maxTokens);
            topP = parseFloat(topP);

            let messages;
            if (msg.messages && Array.isArray(msg.messages)) {
                messages = msg.messages;
            } else if (msg.payload) {
                // Convert payload to string if it isn't already
                const prompt = typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload);
                messages = [{ role: 'user', content: prompt }];
            } else {
                const err = new Error('No prompt or messages provided');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send([null, msg]);
            }

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

            // Only add optional headers if they have values
            if (node.siteUrl) {
                headers['HTTP-Referer'] = node.siteUrl;
            }
            if (node.siteName) {
                headers['X-Title'] = node.siteName;
            }

            axios.post(url, data, { headers })
                .then((res) => {
                    if (res.status >= 200 && res.status < 300) {
                        msg.payload = res.data.choices[0].message.content;
                        msg.response = res.data;
                        msg.model = model;
                        send([msg, null]);
                    } else {
                        const err = new Error(`HTTP ${res.status}: ${JSON.stringify(res.data)}`);
                        if (done) {
                            done(err);
                        } else {
                            node.error(err, msg);
                        }
                        send([null, msg]);
                    }
                    if (done) done();
                })
                .catch((e) => {
                    // Log detailed error information
                    let errorMsg = 'Request error: ' + e.message;
                    if (e.response) {
                        errorMsg += '\nStatus: ' + e.response.status;
                        errorMsg += '\nResponse: ' + JSON.stringify(e.response.data);
                        node.error(errorMsg, msg);
                    } else {
                        node.error(errorMsg, msg);
                    }
                    
                    const err = new Error(errorMsg);
                    msg.error = {
                        message: e.message,
                        status: e.response ? e.response.status : null,
                        data: e.response ? e.response.data : null
                    };
                    
                    if (done) {
                        done(err);
                    }
                    send([null, msg]);
                });
        });
    }

    RED.nodes.registerType('openrouter-chat', OpenRouterChat);
};
