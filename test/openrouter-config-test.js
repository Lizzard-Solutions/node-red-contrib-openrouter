const helper = require('node-red-node-test-helper');
const nodeUnderTest = require('../openrouter-config.js');

helper.init(require('node-red'));

describe('OpenRouter Config Node', function() {
    afterEach(function(done) {
        helper.unload();
        helper.init(require('node-red'));
        done();
    });

    it('should be loaded', function(done) {
        const flow = [{ id: 'n1', type: 'openrouter-config', name: 'test config' }];
        helper.load(nodeUnderTest, flow, function() {
            const n1 = helper.getNode('n1');
            n1.should.have.property('name', 'test config');
            done();
        });
    });
});