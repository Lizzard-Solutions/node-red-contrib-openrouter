module.exports = function(RED) {
    function OpenRouterPrompt(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.template = config.template || '';

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node, arguments); };

            if (!node.template) {
                const err = new Error('No template defined');
                if (done) {
                    done(err);
                } else {
                    node.error(err, msg);
                }
                return send(msg);
            }

            let formatted = node.template;
            if (msg.payload && typeof msg.payload === 'object') {
                for (let key in msg.payload) {
                    const placeholder = `{{${key}}}`;
                    const value = msg.payload[key] || '';
                    formatted = formatted.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&'), 'g'), value);
                }
            }

            msg.payload = formatted;

            send(msg);
            if (done) done();
        });
    }

    RED.nodes.registerType('openrouter-prompt', OpenRouterPrompt);
};
