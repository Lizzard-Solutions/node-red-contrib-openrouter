module.exports = function(RED) {
    const axios = require('axios');

    function OpenRouterRanker(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const server = RED.nodes.getNode(config.config);

        if (server) {
            node.apiKey = server.credentials.apiKey;
            node.siteUrl = server.credentials.siteUrl || '';
            node.siteName = server.credentials.siteName || '';
        }

        node.model = config.model || 'openai/gpt-4o-mini';
        node.temperature = parseFloat(config.temperature) || 0.1;

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

            if (!msg.candidates || !Array.isArray(msg.candidates) || msg.candidates.length === 0) {
                const err = new Error('msg.candidates must be a non-empty array');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send(msg);
            }

            // Build candidates list
            let candidatesList = msg.candidates.map((cand, index) => `${index + 1}. ${cand.text || cand}`).join('\n');
            let systemPrompt = 'You are a response ranker. Rank the following candidate responses from best to worst (1 = best) based on relevance, coherence, and quality. Output ONLY a JSON object: {"ranked": [indices 1-based], "scores": [0-10 for each, best first]}';

            let userPrompt = `Rank these responses:\n${candidatesList}\n\nProvide ranking as JSON.`;

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ];

            const data = {
                model: node.model,
                messages: messages,
                temperature: node.temperature,
                max_tokens: 200
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
                    if (res.status >= 200 && res.status < 300 && res.data.choices && res.data.choices[0]) {
                        let responseText = res.data.choices[0].message.content.trim();
                        try {
                            // Parse JSON from response
                            let parsed = JSON.parse(responseText);
                            msg.ranked = parsed.ranked.map(value => value - 1) ||[];
                            msg.scores = parsed.scores || [];
                            // Top ranked: first in ranked, assuming 1-based indices
                            if (msg.ranked.length > 0 && msg.candidates[msg.ranked[0] ]) {
                                msg.payload = msg.candidates[msg.ranked[0] ];
                                msg.topScore = msg.scores[0] || 0;
                            }
                            msg.usage = res.data.usage;
                        } catch (parseErr) {
                            node.warn('Failed to parse ranking JSON: ' + parseErr.message + '. Raw: ' + responseText);
                            // Fallback: use first candidate
                            msg.payload = msg.candidates[0];
                            msg.scores = [5]; // Default
                        }
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
                    let errorMsg = 'Ranking error: ' + e.message;
                    if (e.response) {
                        errorMsg += '\nStatus: ' + e.response.status;
                        node.error(errorMsg, msg);
                    } else {
                        node.error(errorMsg, msg);
                    }

                    msg.error = {
                        message: e.message,
                        status: e.response ? e.response.status : null
                    };

                    send(msg);
                    if (done) {
                        done(e);
                    }
                });
        });
    }

    RED.nodes.registerType('openrouter-ranker', OpenRouterRanker);
};
