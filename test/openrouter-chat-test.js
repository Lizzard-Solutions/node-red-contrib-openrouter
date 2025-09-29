const helper = require('node-red-node-test-helper');
const nodeUnderTest = require('../openrouter-chat.js');
const axios = require('axios');

helper.init(require('node-red'));

// Mock axios
jest.mock('axios');

describe('OpenRouter Chat Node', function() {
    afterEach(function(done) {
        helper.unload();
        helper.init(require('node-red'));
        done();
    });

    it('should handle successful chat completion', function(done) {
        const flow = [
            { id: 'config1', type: 'openrouter-config', apiKey: 'testkey' },
            { id: 'n1', type: 'openrouter-chat', config: 'config1', wires: [['n2']] },
            { id: 'n2', type: 'helper' }
        ];
        const mockResponse = {
            status: 200,
            data: {
                choices: [{ message: { content: 'Hello!' } }]
            }
        };
        axios.post.mockResolvedValue(mockResponse);

        helper.load(nodeUnderTest, flow, function() {
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