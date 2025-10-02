module.exports = function(RED) {
    const marked = require('marked');
    const yaml = require('js-yaml');

    function OpenRouterFormatter(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node, arguments); };

            if (!msg.payload) {
                node.warn('No payload to format');
                return send([msg, null]);
            }

            let formatted;
            const formatType = msg.format || config.formatType || 'raw';
            const customTemplate = config.customTemplate || '';

            try {
                switch (formatType) {
                    case 'json':
                        formatted = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
                        formatted = JSON.stringify(formatted, null, 2);
                        break;
                    case 'markdown':
                        formatted = marked(msg.payload.toString());
                        break;
                    case 'yaml':
                        const yamlObj = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload;
                        formatted = yaml.dump(yamlObj);
                        break;
                    case 'html':
                        // Simple HTML escape or template
                        if (customTemplate) {
                            formatted = customTemplate.replace('{{payload}}', msg.payload.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
                        } else {
                            formatted = `<pre>${msg.payload.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
                        }
                        break;
                    case 'custom':
                        formatted = customTemplate.replace('{{payload}}', msg.payload.toString());
                        break;
                    default: // raw
                        formatted = msg.payload;
                }
                msg.formatted = formatted;
                node.log(`Formatted payload as ${formatType}`);
                send([msg, null]);
            } catch (e) {
                node.error('Formatting error: ' + e.message, msg);
                send([null, msg]);
            }

            if (done) done();
        });
    }

    RED.nodes.registerType('openrouter-formatter', OpenRouterFormatter);
};