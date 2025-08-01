# DocsLM - RAG Usage Instructions

## Quick Start

1. **Configure environment variables**:

   ```bash
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   ```

2. **Install dependencies**:

   ```bash
   yarn install
   ```

3. **Add your markdown documents** to the `data/docs/` directory

4. **Run the application**:
   ```bash
   yarn start
   ```

## Usage Examples

### Basic Usage

```javascript
import DocsLM from './src/main.js'

const docsLM = new DocsLM()

// Initialize the system
await docsLM.initialize()

// Ask questions about your documents
const response = await docsLM.ask('Como usar esta ferramenta?')
console.log(response.answer)
console.log(response.sources)
```

### Advanced Usage

```javascript
// Search for specific documents
const documents = await docsLM.searchDocuments('eventos', 3)

// Clear chat history
docsLM.clearChatHistory()

// Ask follow-up questions
const followUp = await docsLM.ask('Me dê mais detalhes sobre isso')
```

## Configuration

### Environment Variables

- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)
- `DATA_PATH`: Path to your markdown documents (default: `data/docs`)

### Embedding Models

The system uses HuggingFace embeddings. You can modify the model in `src/embeddings/embeddingService.js`:

- `sentence-transformers/all-MiniLM-L6-v2` (default) - Fast and efficient
- `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` - Better for Portuguese
- `intfloat/multilingual-e5-base` - High quality multilingual

## Architecture

```
📁 src/
├── 📁 loaders/
│   └── documentLoader.js     # DirectoryLoader + MarkdownTextSplitter
├── 📁 embeddings/
│   └── embeddingService.js   # HuggingFaceEmbeddings
├── 📁 vectorStore/
│   └── memoryStore.js        # MemoryVectorStore
├── 📁 llm/
│   └── anthropicService.js   # ChatAnthropic
├── 📁 chains/
│   └── ragChain.js           # ConversationalRetrievalQAChain
└── main.js                   # Main orchestration
```

## Features

✅ **Document Loading**: Automatic loading of markdown files from directory  
✅ **Text Splitting**: Intelligent markdown-aware text chunking  
✅ **Embeddings**: Local HuggingFace embeddings (free)  
✅ **Vector Storage**: In-memory vector store for development  
✅ **LLM**: Claude integration via Anthropic API  
✅ **RAG Chain**: Conversational retrieval with memory  
✅ **Source Citations**: Returns source documents with answers

## Troubleshooting

### Common Issues

1. **Missing API Key**: Make sure `ANTHROPIC_API_KEY` is set in your `.env` file
2. **No documents found**: Check that your markdown files are in the `DATA_PATH` directory
3. **Embedding model download**: First run may take time to download the embedding model

### Performance Tips

- For large document sets, consider using a persistent vector store
- Adjust chunk size in `documentLoader.js` based on your document structure
- Use smaller embedding models for faster initialization
