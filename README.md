# Node-RED Contrib OpenRouter

This package provides Node-RED nodes for interacting with the OpenRouter AI API, enabling chat completions, embeddings, tool calling, evaluation, orchestration, cost tracking, formatting, and vector storage.

## Installation

Install via Node-RED palette manager or run:

```
npm install node-red-contrib-openrouter
```

## Nodes

- **OpenRouter Config**: Set API key and site details.
- **OpenRouter Chat**: Basic chat completions.
- **OpenRouter Tools**: Chat with function/tool calling.
- **OpenRouter Evaluator**: Score/classify outputs based on criteria.
- **OpenRouter Orchestrator**: Run multiple agents sequentially or in parallel.
- **OpenRouter Cost Tracker**: Track API usage costs.
- **OpenRouter Formatter**: Format responses (JSON, MD, YAML, HTML).
- **OpenRouter Vector Store**: In-memory vector database for embeddings.

## Usage

1. Add an OpenRouter Config node with your API key.
2. Wire it to other nodes.
3. Input `msg.payload` as prompt; output to `msg.payload` or specific fields.

See node help panels for details. For tools/evaluator/orchestrator, use JSON configs.

## Dependencies

- axios, marked, js-yaml

## Testing

Run `npm test` for Mocha tests.

## License

MIT