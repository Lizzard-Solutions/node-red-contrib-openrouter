module.exports = function(RED) {
function OpenRouterConfig(config) {
    RED.nodes.createNode(this, config);
    this.model = config.model || '';

    // Validation
    if (!this.credentials || !this.credentials.apiKey || this.credentials.apiKey.trim() === '') {
        this.error('API key is required in the OpenRouter config node.');
        throw new Error('OpenRouter config invalid: API key is required');
    }
    if (!this.model || this.model.trim() === '') {
        this.error('Model must be selected in the OpenRouter config node.');
        throw new Error('OpenRouter config invalid: Model must be selected');
    }
}
    
    RED.nodes.registerType('openrouter-config', OpenRouterConfig, {
        credentials: {
            apiKey: {type: 'password'},
            siteUrl: {type: 'text'},
            siteName: {type: 'text'}
        }
    });
};