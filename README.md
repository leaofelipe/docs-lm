# Docs LM

![Node.js Version](https://img.shields.io/badge/node.js-20.10.0+-green?style=flat-square&logo=node.js&logoColor=white)
![Code Style](https://img.shields.io/badge/code%20style-standard-green?style=flat-square&logo=javascript&logoColor=white)
![Package Manager](https://img.shields.io/badge/yarn-4.6.0-green?style=flat-square&logo=yarn&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square&logoColor=white)

## About

Centralize documentation for seamless LLM integration.

### Next Steps

- [ ] Add support for more LLM services (Gemini, OpenAI)
- [ ] Separate services between file processing and storage, data retrieval
- [ ] Add MCP support for external integration
- [ ] Add RAG for searching specific Confluence pages (direct RAG or processing to Database?)

## Project Structure

```
docs-lm/
├── src/
│   ├── main.js                    # Main entry point (TODO)
│   ├── chains/
│   │   └── ragChain.js           # RAG chain implementation
│   ├── demos/
│   │   └── demo.js               # Demo script for testing
│   ├── embeddings/
│   │   └── embeddingService.js   # HuggingFace embedding service
│   ├── llm/
│   │   └── anthropicService.js   # Anthropic Claude LLM service
│   ├── loaders/
│   │   └── documentLoader.js     # Markdown document loading utilities
│   └── vectorStore/
│       └── chromaStore.js        # ChromaDB vector storage (memory or persistent)
├── data/
│   ├── docs/                     # Documentation files (markdown)
│   └── testing/                  # Test data
├── package.json                  # Project configuration
├── yarn.lock                     # Dependency lock file
└── README.md                     # Project documentation
```
