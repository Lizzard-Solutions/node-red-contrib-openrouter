module.exports = function(RED) {
    function OpenRouterConfig(config) {
        RED.nodes.createNode(this, config);
        this.model = config.model || '';
    }
    
    RED.nodes.registerType('openrouter-config', OpenRouterConfig, {
        credentials: {
            apiKey: {type: 'password'},
            siteUrl: {type: 'text'},
            siteName: {type: 'text'}
        }
    });
};