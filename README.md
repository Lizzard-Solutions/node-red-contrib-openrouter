# node-red-contrib-openrouter

A collection of Node-RED nodes for working with the OpenRouter API. This package centralizes model selection via a shared config node and provides chat, routing, ranking, evaluation, embeddings, memory, formatting, tools orchestration, and a simple in-memory vector store.

## Features
- Shared config node (`openrouter-config`) is the single source of truth for model and API key
- Chat completions (`openrouter-chat`)
- Embeddings (`openrouter-embedding`)
- Router/classifier (`openrouter-router`)
- Ranker (`openrouter-ranker`)
- Evaluator/LLM-based scoring (`openrouter-evaluator`)
- Conversation memory with optional summarization (`openrouter-memory`)
- Cost tracker (`openrouter-cost-tracker`)
- Prompt templating (`openrouter-prompt`) and content formatter (`openrouter-formatter`)
- Multi-agent orchestrator (`openrouter-orchestrator`)
- Basic vector-store node (`openrouter-vector-store`) for demos
- Utilities (`openrouter-tools`)

All nodes use the shared `openrouter-config` for the model. Per-node model inputs and defaults have been removed.

## Installation

```bash
cd ~/.node-red
npm install node-red-contrib-openrouter
```

Restart Node-RED after install. The nodes will appear under the "OpenRouter" category.

## Repository layout

```
node-red-contrib-openrouter/
├─ src/                      # All Node-RED nodes (html/js pairs)
│  ├─ openrouter-config.*    # Shared config node (keep model/API key here)
│  ├─ openrouter-chat.*
│  ├─ openrouter-embedding.*
│  ├─ openrouter-router.*
│  ├─ openrouter-ranker.*
│  ├─ openrouter-evaluator.*
│  ├─ openrouter-memory.*
│  ├─ openrouter-orchestrator.*
│  ├─ openrouter-cost-tracker.*
│  ├─ openrouter-formatter.*
│  ├─ openrouter-prompt.*
│  ├─ openrouter-tools.*
│  └─ openrouter-vector-store.*
├─ examples/
│  └─ example_flow.json      # Importable Node-RED flow
├─ package.json
└─ README.md
```

## Configure the shared config node
1. Drag `openrouter-config` into your workspace (or open it from any node that references it).
2. Enter your OpenRouter API key.
3. Set the model (e.g., `openai/gpt-4o-mini`).
4. Optionally set `siteUrl` and `siteName` headers for OpenRouter attribution.

If the model is not set in `openrouter-config`, runtime nodes will error with:

> "No model specified. Set a model in the shared config"

## Node overview

- `openrouter-chat`: Chat completion. Input: `msg.payload` (string) or `msg.messages` (array). Output: `msg.payload` text, `msg.response` raw.
- `openrouter-embedding`: Embeddings for a string or array. Output: `msg.embedding` (single) or `msg.embeddings` (array), plus `msg.usage`.
- `openrouter-router`: Classifies `msg.payload` into one of N routes -> dynamic outputs based on descriptions you define.
- `openrouter-ranker`: Ranks candidate responses in `msg.candidates` and selects the best into `msg.payload`.
- `openrouter-evaluator`: Evaluates `msg.payload` with criteria prompt and returns score/validation/JSON.
- `openrouter-memory`: Maintains per-session history buffer; optional summarization via shared model.
- `openrouter-orchestrator`: Chains/parallelizes multiple agent steps using the shared model.
- `openrouter-cost-tracker`: Estimates cost based on token usage; adjustable rates.
- `openrouter-prompt`: Simple templating helper.
- `openrouter-formatter`: Convert markdown to HTML, etc.
- `openrouter-tools`: Misc utilities used by other nodes.
- `openrouter-vector-store`: In-memory demo store with `store`, `retrieve`, and `clear` actions.

## Example flow

See `examples/example_flow.json` and import it via Node-RED:
- Menu → Import → Clipboard → paste the JSON → Import
- Update the `openrouter-config` node with your API key and desired model

## Breaking changes in this version
- Removed per-node “Model” fields from all nodes. The shared `openrouter-config` node is now the only place to set the model.
- Nodes validate at runtime and will error if the shared model is missing.

## Environment variables
You can set the OpenRouter API key via Node-RED credentials UI on `openrouter-config`. If you prefer environment variables, wire that into the config UI using Node-RED’s built-in env usage patterns.

## Development
- All node sources are in `src/`. Each node has a `.html` editor file and a `.js` runtime file.
- After making changes, run Node-RED in development and reload the editor.
- Linting/formatting should follow repository settings.

## Contributing
PRs welcome! Please include:
- Clear description and rationale
- Tests or flows showing the behavior
- Avoid reintroducing per-node model configuration

## License
MIT