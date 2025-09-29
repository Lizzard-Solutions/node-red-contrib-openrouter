const helper = require('node-red-node-test-helper');
const nodeUnderTest = require('../openrouter-tools.js');
const axios = require('axios');

helper.init(require('node-red'));

jest.mock('axios');

describe('OpenRouter Tools Node', function() {
    afterEach(function(done) {
        helper.unload();
        helper.init(require('node-red'));
        done();
    });

    it('should handle tool calls in response', function(done) {
        const flow = [
            { id: 'config1', type: 'openrouter-config', apiKey: 'testkey' },
            { id: 'n1', type: 'openrouter-tools', config: 'config1', tools: '[]', wires: [['n2']] },
            { id: 'n2', type: 'helper' }
        ];
        const mockResponse = {
            status: 200,
            data: {
                choices: [{
                    message: {
                        tool_calls: [{
                            id: 'call1',
                            type: 'function',
                            function: { name: 'test', arguments: '{"param":"value"}' }
                        }],
                        content: null
                    }
                }]
            }
        };
        axios.post.mockResolvedValue(mockResponse);

        helper.load(nodeUnderTest, flow, function() {
            const n1 = helper.getNode('n1');
            const n2 = helper.getNode('n2');
            n2.on('input', function(msg) {
                msg.toolCalls.should.be.an('array').with.length(1);
                msg.toolCalls[0].function.name.should.eql('test');
                done();
            });
            n1.receive({ payload: 'Test with tools' });
        });
    });
});