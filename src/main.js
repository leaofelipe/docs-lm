import dotenv from 'dotenv'
import { DocumentLoader } from './loaders/documentLoader.js'
import { EmbeddingService } from './embeddings/embeddingService.js'
import { MemoryStore } from './vectorStore/memoryStore.js'
import { AnthropicService } from './llm/anthropicService.js'
import { RAGChain } from './chains/ragChain.js'

dotenv.config()

class DocsLM {
  constructor() {
    this.documentLoader = new DocumentLoader()
    this.embeddingService = new EmbeddingService()
    this.memoryStore = null
    this.anthropicService = new AnthropicService()
    this.ragChain = null
    this.isInitialized = false
  }

  async initialize() {
    try {
      console.log('Initializing DocsLM...')

      // Initialize embedding service
      await this.embeddingService.initialize()

      // Initialize Anthropic LLM
      await this.anthropicService.initialize()

      // Load and split documents
      const documents = await this.documentLoader.loadAndSplitDocuments()

      if (documents.length === 0) {
        throw new Error('No documents found to process')
      }

      // Create vector store
      this.memoryStore = new MemoryStore(this.embeddingService.getEmbeddings())
      await this.memoryStore.createFromDocuments(documents)

      // Create RAG chain
      const retriever = this.memoryStore.getRetriever({ k: 4 })
      this.ragChain = new RAGChain(this.anthropicService.getLLM(), retriever)
      await this.ragChain.initialize()

      this.isInitialized = true
      console.log('DocsLM initialized successfully!')

      return true
    } catch (error) {
      console.error('Error initializing DocsLM:', error.message)
      throw error
    }
  }

  async ask(question) {
    if (!this.isInitialized) {
      throw new Error('DocsLM not initialized. Call initialize() first.')
    }

    try {
      return await this.ragChain.askWithSources(question)
    } catch (error) {
      console.error('Error processing question:', error.message)
      throw error
    }
  }

  async searchDocuments(query, k = 4) {
    if (!this.isInitialized) {
      throw new Error('DocsLM not initialized. Call initialize() first.')
    }

    try {
      return await this.memoryStore.similaritySearch(query, k)
    } catch (error) {
      console.error('Error searching documents:', error.message)
      throw error
    }
  }

  clearChatHistory() {
    if (this.ragChain) {
      this.ragChain.clearMemory()
    }
  }

  async start() {
    try {
      await this.initialize()

      // Example usage
      console.log('Testing the system...')
      const testQuestion = 'O que é este projeto?'
      const response = await this.ask(testQuestion)

      console.log('Question:', testQuestion)
      console.log('Answer:', response.answer)
      console.log('Sources found:', response.sources.length)

      if (response.sources.length > 0) {
        console.log('Source previews:')
        response.sources.forEach((source, index) => {
          console.log(`  ${index + 1}. ${source.content}`)
        })
      }
    } catch (error) {
      console.error('Error starting DocsLM:', error.message)
    }
  }
}

const app = new DocsLM()
app.start()

export default DocsLM
