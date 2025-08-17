# Docs LM

![Node.js Version](https://img.shields.io/badge/node.js-20.10.0+-green?style=flat-square&logo=node.js&logoColor=white)
![Code Style](https://img.shields.io/badge/code%20style-standard-green?style=flat-square&logo=javascript&logoColor=white)
![Package Manager](https://img.shields.io/badge/yarn-4.6.0-green?style=flat-square&logo=yarn&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square&logoColor=white)

## About

Centralize documentation for seamless LLM integration.

### Next Steps

[ ] Replace the in-memory Vector Database with ChromaDB in embedded mode (serverless)
[ ] Add support for more LLM services (Gemini, OpenAI)
[ ] Separate services between file processing and storage, data retrieval
[ ] Add MCP support for external integration
[ ] Add RAG for searching specific Confluence pages (direct RAG or processing to Database?)

## Project Structure

```
docs-lm/
├── src/
│   ├── main.js                    # Main entry point (TODO)
│   ├── chains/
│   │   └── ragChain.js           # RAG chain implementation
│   ├── embeddings/
│   │   └── embeddingService.js   # Text embedding service
│   ├── llm/
│   │   └── anthropicService.js   # Anthropic LLM service
│   ├── loaders/
│   │   └── documentLoader.js     # Document loading utilities
│   └── vectorStore/
│       └── memoryStore.js        # In-memory vector storage
├── data/
│   ├── docs/                     # Documentation files
│   └── testing/                  # Test data
├── demo.js                       # Demo script
└── package.json                  # Project configuration
```
