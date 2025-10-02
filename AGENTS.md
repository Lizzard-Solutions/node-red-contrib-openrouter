# AGENTS.md

This file provides guidelines for agentic coding agents working in this Node-RED contrib repository for OpenRouter API integration.

## Build, Lint, and Test Commands

- **Install dependencies**: `npm install`
- **Run all tests**: `npm test` (runs `mocha test/*.js` using node-red-node-test-helper and should for assertions)
- **Run a single test**: `mocha test/openrouter-chat-test.js` (replace with specific test file; no npx needed as mocha is dev dep)
- **No build step**: Plain JavaScript; no compilation or bundling required.
- **Linting**: None configured (no ESLint); maintain consistent style manually.
- **Type checking**: Not applicable (vanilla JS, no TypeScript).

## Code Style Guidelines

- **Modules**: Use CommonJS (`require`/`module.exports`). Avoid ES modules.
- **Node-RED Patterns**: Nodes defined as `function(RED) { ... }`; register with `RED.nodes.registerType('kebab-node', Constructor)`.
- **Naming Conventions**:
  - Node types: kebab-case (e.g., 'openrouter-chat').
  - Functions/variables: camelCase (e.g., `handleInput`, `apiKey`).
  - Files: kebab-case for paired .js and .html (e.g., openrouter-config.js/html).
- **Formatting**: 4-space indentation; semicolons optional but consistent within files; single quotes for strings.
- **Error Handling**: Use `node.error(msg, sendMsg)` for errors; `node.warn()` or `node.log()` for logs. Handle async with promises/callbacks.
- **Dependencies**: Require at file top (e.g., `const axios = require('axios');`). Use existing: axios for HTTP, marked for Markdown, js-yaml for YAML.
- **HTML Files**: Pair with .js; use Node-RED UI patterns (<label>, <input type='text' data-i18n='...'>).
- **Credentials**: Secure fields like API keys with `{credentials: {apiKey: {type: 'password'}}}` in registerType.
- **Async Handling**: Prefer promises (e.g., axios); ensure `done()` called in callbacks.
- **Security**: Never hardcode secrets; always use credentials node. Validate inputs to prevent injection.

## Additional Notes

- Keep changes compatible with Node-RED runtime (v3+).
- For new nodes, add to package.json 'node-red' > 'nodes' section.
- Tests: Use node-red-node-test-helper; assert with `should`; load nodes via `helper.load([nodeFile])`.
- No comments unless requested; code should be self-explanatory.

(Last updated: Analyzed package.json, openrouter-chat.js, and directory structure)