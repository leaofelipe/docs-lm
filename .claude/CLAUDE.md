# Claude Configuration

## Project Overview

- **Name**: docs-lm
- **Type**: RAG (Retrieval-Augmented Generation) system with LangChain
- **Package Manager**: Yarn 4.6.0
- **Node Version**: >=20.0.0
- **Purpose**: Centralize documentation for seamless LLM integration

## Development Commands

```bash
# Start main application
yarn start

# Run demo script
yarn demo

# Install dependencies
yarn install

# Lint code
yarn lint

# Lint and fix code
yarn lint:fix
```

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
│       └── memoryStore.js        # In-memory vector storage
├── data/
│   ├── docs/                     # Documentation files (markdown)
│   └── testing/                  # Test data
├── .env.example                  # Environment variables template
├── package.json                  # Project configuration
├── yarn.lock                     # Dependency lock file
└── README.md                     # Project documentation
```

## Key Dependencies

- **LangChain**: Core framework for LLM applications
  - `@langchain/anthropic`: Anthropic Claude integration
  - `@langchain/community`: Community embeddings and utilities
  - `@langchain/core`: Core LangChain functionality
  - `@langchain/textsplitters`: Text splitting utilities
- **HuggingFace**: Embedding models via Inference API
- **dotenv**: Environment variable management
- **commitizen**: Conventional commit formatting
- **standard**: JavaScript Standard Style linting

## Environment Variables

Required environment variables (see .env.example):

- `DATA_PATH`: Path to documentation files
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude
- `HUGGINGFACE_API_KEY`: HuggingFace API key for embeddings
- `EMBEDDING_MODEL`: HuggingFace embedding model name
- `EMBEDDING_PROVIDER`: Provider for embeddings (hf-inference)

## System Components

- **Document Loader**: Loads and splits markdown files into chunks
- **Embedding Service**: Creates vector embeddings using HuggingFace models
- **Vector Store**: In-memory storage for document embeddings
- **LLM Service**: Anthropic Claude integration for text generation
- **RAG Chain**: Combines retrieval and generation for context-aware responses

## Coding Standards

- Use ES modules (type: "module")
- Follow conventional commit format
- Use JavaScript Standard Style for code quality
- Node.js version 20 or higher required
- Async/await for asynchronous operations

## Environment Setup

- Ensure Node.js >=20.0.0 is installed
- Use Yarn 4.6.0 as package manager
- Configure environment variables in .env file (see .env.example)
- Set up API keys for Anthropic and HuggingFace services
