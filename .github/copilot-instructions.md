# GitHub Copilot Instructions

## Project Context

This is a Node.js ESM project called "docs-lm" - a RAG (Retrieval-Augmented Generation) system built with LangChain for centralized documentation and seamless LLM integration. Uses Yarn 4.6.0 as package manager.

## Development Guidelines

### Code Standards

- Use ES modules syntax (import/export)
- Follow conventional commit format with commitizen
- Use JavaScript Standard Style for code linting
- Target Node.js version 20 or higher
- Use async/await for asynchronous operations

### Project Structure

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
├── package.json                  # Project configuration
├── yarn.lock                     # Dependency lock file
└── README.md                     # Project documentation
```

### Available Scripts

- `yarn start` - Start main application
- `yarn demo` - Run demo script for testing RAG functionality
- `yarn install` - Install dependencies
- `yarn lint` - Lint code with JavaScript Standard Style
- `yarn lint:fix` - Lint and fix code automatically

### Key Dependencies

- **LangChain Ecosystem**: Core framework for LLM applications
  - `@langchain/anthropic`: Anthropic Claude integration
  - `@langchain/community`: Community embeddings and utilities
  - `@langchain/core`: Core LangChain functionality
  - `@langchain/textsplitters`: Text splitting utilities
  - `langchain`: Main LangChain package
- **AI/ML Services**:
  - `@huggingface/inference`: HuggingFace Inference API for embeddings
  - `@xenova/transformers`: Local transformer models
- **Utilities**:
  - `dotenv`: Environment variable management
  - `commitizen`: Conventional commit formatting
  - `standard`: JavaScript Standard Style linting
  - `gray-matter`: YAML front matter parsing
  - `remark`: Markdown processing
  - `glob`: File pattern matching

### System Architecture

The project implements a complete RAG pipeline:

1. **Document Processing**: Load and split markdown files into chunks
2. **Embedding Generation**: Create vector embeddings using HuggingFace models
3. **Vector Storage**: Store embeddings in memory for retrieval
4. **Question Answering**: Use Anthropic Claude with retrieved context
5. **Chain Management**: LangChain orchestrates the entire pipeline

### Environment Variables

Required environment variables (see .env.example):

- `DATA_PATH`: Path to documentation files
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude
- `HUGGINGFACE_API_KEY`: HuggingFace API key for embeddings
- `EMBEDDING_MODEL`: HuggingFace embedding model name
- `EMBEDDING_PROVIDER`: Provider for embeddings (hf-inference)

### Coding Preferences

1. Always use ES module syntax (import/export, not require)
2. Use async/await for asynchronous operations
3. Follow conventional commit message format
4. Ensure code passes JavaScript Standard Style checks
5. Use environment variables via dotenv for configuration
6. Maintain compatibility with Node.js 20+
7. Implement proper error handling and logging
8. Use LangChain patterns for AI/ML operations
9. Structure code in service-oriented architecture

### File Naming

- Use kebab-case for files and directories
- Use .js extension for JavaScript files
- Place main application code in src/ directory
- Organize by functionality (chains/, embeddings/, llm/, etc.)
- Use descriptive names that reflect the service purpose

### Environment Setup

- Load environment variables using dotenv
- Ensure Node.js >=20.0.0 compatibility
- Use Yarn 4.6.0 for package management
- Configure API keys for Anthropic and HuggingFace services
- Set up proper data directory structure for documents

### Development Patterns

- **Service Classes**: Encapsulate functionality in ES6 classes
- **Initialization Methods**: Use async initialize() methods for service setup
- **Error Handling**: Implement comprehensive try-catch with meaningful messages
- **Configuration Validation**: Check required environment variables
- **Logging**: Use console logging for debugging and monitoring
- **Chain Composition**: Use LangChain patterns for AI workflow composition

### Documentation

- All code should be documented in English
- Do not add code documentation like JSDoc or similar
- Do not add new Readme files without asking
- Focus on clear, self-documenting code structure
- Use meaningful variable and function names
- Include error messages that help with debugging
