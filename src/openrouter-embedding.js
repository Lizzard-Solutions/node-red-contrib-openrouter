module.exports = function(RED) {
    const axios = require('axios');

    function OpenRouterEmbedding(config) {
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
                return send(null);
            }

            const model = node.modelFromConfig;
            if (!model) {
                const err = new Error('No model specified. Set a model in the shared config');
                if (done) { done(err); } else { node.error(err, msg); }
                return send(msg);
            }

            let inputText;
            if (msg.payload) {
                if (typeof msg.payload === 'string') {
                    inputText = msg.payload;
                } else if (Array.isArray(msg.payload)) {
                    inputText = msg.payload;
                } else {
                    inputText = JSON.stringify(msg.payload);
                }
            } else {
                const err = new Error('No payload provided');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send(msg);
            }

            const data = {
                model: model,
                input: inputText
            };
            msg.model = model;

            const url = 'https://openrouter.ai/api/v1/embeddings';
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
                        if (Array.isArray(inputText)) {
                            msg.embeddings = res.data.data.map(item => item.embedding);
                        } else {
                            msg.embedding = res.data.data[0].embedding;
                            msg.embeddings = [msg.embedding];
                        }
                        msg.usage = res.data.usage;
                        send(msg);
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
                    let errorMsg = 'Embedding error: ' + e.message;
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

    RED.nodes.registerType('openrouter-embedding', OpenRouterEmbedding);
};
