module.exports = function(RED) {
    const axios = require('axios');

    function OpenRouterVectorStore(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const server = RED.nodes.getNode(config.config);

        if (server) {
            node.apiKey = server.credentials.apiKey;
            node.siteUrl = server.credentials.siteUrl || '';
            node.siteName = server.credentials.siteName || '';
        }

        node.store = []; // In-memory: [{id, embedding: [], text, metadata}]
        node.embeddingModel = config.embeddingModel || 'openai/text-embedding-ada-002';
        node.threshold = parseFloat(config.threshold) || 0.8;
        node.topK = parseInt(config.topK) || 5;
        node.storeType = config.storeType || 'memory';

        // Cosine similarity helper
        const cosineSimilarity = (vecA, vecB) => {
            const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
            const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
            const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
            return dot / (magA * magB);
        };

        const embed = async (text) => {
            if (!node.apiKey) throw new Error('No API key');
            const url = 'https://openrouter.ai/api/v1/embeddings';
            const data = { model: node.embeddingModel, input: text };
            const headers = {
                'Authorization': `Bearer ${node.apiKey}`,
                'Content-Type': 'application/json'
            };
            if (node.siteUrl) headers['HTTP-Referer'] = node.siteUrl;
            if (node.siteName) headers['X-Title'] = node.siteName;

            const res = await axios.post(url, data, { headers });
            if (res.status >= 200 && res.status < 300) {
                return res.data.data[0].embedding;
            } else {
                throw new Error(`Embed HTTP ${res.status}: ${JSON.stringify(res.data)}`);
            }
        };

        node.on('input', async function(msg, send, done) {
            send = send || function() { node.send.apply(node, arguments); };

            if (!server || !node.apiKey) {
                const err = new Error('OpenRouter config not set');
                if (done) done(err); else node.error(err, msg);
                return send([null, msg]);
            }

            const action = msg.action || (msg.payload ? 'retrieve' : 'store'); // Default based on input
            let results = [];

            try {
                if (action === 'store') {
                    const text = msg.payload;
                    if (!text) throw new Error('No text to store');
                    const metadata = msg.metadata || {};
                    const id = Date.now() + '_' + Math.random().toString(36).substr(2, 9); // Simple ID
                    const embedding = await embed(text.toString());
                    node.store.push({ id, embedding, text: text.toString(), metadata });
                    node.log(`Stored vector ${id}`);
                    msg.stored = { id, text };
                    send([msg, null]);
                } else if (action === 'retrieve' || action === 'search') {
                    const query = msg.payload || msg.query;
                    if (!query) throw new Error('No query for retrieval');
                    const queryEmbedding = await embed(query.toString());
                    const scores = node.store.map(item => ({
                        ...item,
                        score: cosineSimilarity(queryEmbedding, item.embedding)
                    })).filter(item => item.score >= node.threshold)
                      .sort((a, b) => b.score - a.score)
                      .slice(0, node.topK);
                    msg.results = scores;
                    node.log(`Retrieved ${scores.length} vectors`);
                    send([msg, null]);
                } else if (action === 'clear') {
                    node.store = [];
                    msg.cleared = true;
                    send([msg, null]);
                } else {
                    throw new Error(`Unknown action: ${action}`);
                }
            } catch (e) {
                node.error('Vector store error: ' + e.message, msg);
                send([null, msg]);
            }

            if (done) done();
        });
    }

    RED.nodes.registerType('openrouter-vector-store', OpenRouterVectorStore);
};