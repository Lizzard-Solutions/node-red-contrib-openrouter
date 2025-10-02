const helper = require('node-red-node-test-helper');
const nodeUnderTest = require('../openrouter-chat.js');
const axios = require('axios');

helper.init(require('node-red'));\n\ndescribe('OpenRouter Chat Node', function() {
    afterEach(function(done) {
        helper.unload();
        helper.init(require('node-red'));
        done();
    });

    it('should handle successful chat completion', function(done) {
        const flow = [
            { id: 'config1', type: 'openrouter-config', credentials: { apiKey: 'testkey' } },
            { id: 'n1', type: 'openrouter-chat', config: 'config1', wires: [['n2']] },
            { id: 'n2', type: 'helper' }
        ];
        const mockResponse = {\n            status: 200,\n            data: {\n                choices: [{ message: { content: 'Hello!' } }]\n            }\n        };\n        // Simple mock for axios.post\n        const originalPost = axios.post;\n        axios.post = function() {\n            return Promise.resolve(mockResponse);\n        };

        // Restore axios after load if needed, but for test it's fine\n        helper.load(nodeUnderTest, flow, function() {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                msg.payload.should.eql('Hello!');
                done();
            });
            n1.receive({ payload: 'Hi' });
        });
    });
});