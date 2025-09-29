module.exports = function(RED) {
    const axios = require('axios'); // Not used directly, but for consistency
    function OpenRouterCostTracker(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        const flowContext = node.context().flow;

        // Parse config rates
        node.inputRate = parseFloat(config.inputRate) || 0;
        node.outputRate = parseFloat(config.outputRate) || 0;
        node.sessionKey = config.sessionKey || 'costs';

        node.on('input', function(msg, send, done) {
            send = send || function() { node.send.apply(node, arguments); };

            if (!msg.response || !msg.response.usage) {
                node.warn('No usage data in msg.response; skipping cost calculation');
                return send([msg, null]);
            }

            const usage = msg.response.usage;
            const promptTokens = usage.prompt_tokens || 0;
            const completionTokens = usage.completion_tokens || 0;

            const thisCost = (promptTokens / 1e6 * node.inputRate) + (completionTokens / 1e6 * node.outputRate);
            let sessionTotal = flowContext.get(node.sessionKey) || 0;
            sessionTotal += thisCost;
            flowContext.set(node.sessionKey, sessionTotal);

            msg.cost = thisCost;
            msg.costLog = {
                sessionTotal: sessionTotal,
                thisCall: thisCost,
                usage: usage
            };

            node.log(`Cost tracked: $${thisCost.toFixed(6)} (session total: $${sessionTotal.toFixed(6)})`);

            send([msg, null]);
            if (done) done();
        });
    }

    RED.nodes.registerType('openrouter-cost-tracker', OpenRouterCostTracker);
};