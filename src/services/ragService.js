import { AnthropicService } from '../llm/anthropicService.js'
import { ChromaStore } from '../vectorStore/chromaStore.js'
import { EmbeddingService } from '../embeddings/embeddingService.js'
import { RAGChain } from '../chains/ragChain.js'

export class RAGService {
  constructor(existingChromaStore = null) {
    this.anthropicService = new AnthropicService()
    this.embeddingService = new EmbeddingService()
    this.chromaStore = existingChromaStore
    this.ragChain = null
    this.isInitialized = false
    this.isPersistent = false
    this.queryCache = new Map()
    this.cacheEnabled = process.env.RAG_CACHE_ENABLED === 'true'
    this.maxCacheSize = parseInt(process.env.RAG_CACHE_SIZE) || 100
  }

  async initialize(persistent = false, existingChromaStore = null) {
    try {
      console.log('Initializing RAG Service...')
      this.isPersistent = persistent

      // Use existing ChromaStore if provided, otherwise create new one
      if (existingChromaStore) {
        console.log('Using existing ChromaStore instance')
        this.chromaStore = existingChromaStore
        this.embeddingService = new EmbeddingService()
        await this.embeddingService.initialize()
      } else if (this.chromaStore) {
        console.log('Using ChromaStore instance from constructor')
        this.embeddingService = new EmbeddingService()
        await this.embeddingService.initialize()
      } else {
        // Initialize embedding service first
        await this.embeddingService.initialize()
        console.log('Embedding service initialized')

        // Initialize ChromaStore with embedding function
        this.chromaStore = new ChromaStore(this.embeddingService.embeddings)
        await this.chromaStore.initialize(persistent)
        console.log(
          `ChromaStore initialized in ${
            persistent ? 'persistent' : 'memory'
          } mode`
        )
      }

      // Initialize Anthropic LLM
      await this.anthropicService.initialize()
      console.log('Anthropic service initialized')

      // Create retriever from ChromaStore
      const retriever = this.chromaStore.getRetriever({ k: 4 })

      // Initialize RAG chain
      this.ragChain = new RAGChain(this.anthropicService.llm, retriever)
      await this.ragChain.initialize()
      console.log('RAG chain initialized')

      this.isInitialized = true
      console.log('RAG Service initialization completed successfully')

      // Log current state
      const docCount = await this.chromaStore.getDocumentCount()
      console.log(`Ready for queries. Document count: ${docCount}`)
    } catch (error) {
      console.error('Error initializing RAG Service:', error.message)
      this.isInitialized = false
      throw error
    }
  }

  async ask(question, options = {}) {
    this.verifyInitialization()

    const { k = 4, filter = {}, useCache = this.cacheEnabled } = options

    try {
      // Check cache first if enabled
      if (useCache && this.queryCache.has(question)) {
        console.log('Returning cached response for question')
        return this.queryCache.get(question)
      }

      console.log(`Processing question: "${question}"`)

      // Update retriever if custom parameters provided
      if (k !== 4 || Object.keys(filter).length > 0) {
        const customRetriever = this.chromaStore.getRetriever({ k, filter })
        this.ragChain.retriever = customRetriever
      }

      // Delegate to RAGChain for processing
      const result = await this.ragChain.ask(question)

      // Cache the result if enabled
      if (useCache) {
        this.cacheResult(question, result)
      }

      console.log('Question processed successfully')
      return {
        answer: result.answer,
        sourceDocuments: result.sourceDocuments,
        chatHistory: result.chatHistory,
        metadata: {
          documentsRetrieved: result.sourceDocuments?.length || 0,
          questionLength: question.length,
          cached: false
        }
      }
    } catch (error) {
      console.error('Error processing question:', error.message)
      throw error
    }
  }

  async askWithSources(question, options = {}) {
    this.verifyInitialization()

    try {
      console.log(`Processing question with sources: "${question}"`)

      // Use RAGChain's askWithSources method
      const result = await this.ragChain.askWithSources(question)

      return {
        answer: result.answer,
        sources: result.sources,
        chatHistory: result.chatHistory,
        metadata: {
          sourcesCount: result.sources?.length || 0,
          questionLength: question.length,
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      console.error('Error processing question with sources:', error.message)
      throw error
    }
  }

  async similaritySearch(query, k = 4, filter = {}) {
    this.verifyInitialization()

    try {
      console.log(`Performing similarity search for: "${query}"`)
      const documents = await this.chromaStore.similaritySearch(
        query,
        k,
        filter
      )
      console.log(`Found ${documents.length} relevant documents`)
      return documents
    } catch (error) {
      console.error('Error performing similarity search:', error.message)
      throw error
    }
  }

  clearHistory() {
    this.verifyInitialization()

    try {
      this.ragChain.clearMemory()
      this.queryCache.clear()
      console.log('Chat history and query cache cleared')
    } catch (error) {
      console.error('Error clearing history:', error.message)
      throw error
    }
  }

  async getHistory() {
    this.verifyInitialization()

    try {
      const memory = this.ragChain.getMemory()
      return await memory.getMessages()
    } catch (error) {
      console.error('Error getting history:', error.message)
      throw error
    }
  }

  async switchToPersistent(preserveData = true) {
    this.verifyInitialization()

    try {
      console.log('Switching RAG Service to persistent mode...')
      await this.chromaStore.switchToPersistent()
      this.isPersistent = true

      // Update retriever reference in RAG chain
      const retriever = this.chromaStore.getRetriever({ k: 4 })
      this.ragChain.retriever = retriever

      console.log('Successfully switched to persistent mode')
    } catch (error) {
      console.error('Error switching to persistent mode:', error.message)
      throw error
    }
  }

  async switchToMemory(preserveData = true) {
    this.verifyInitialization()

    try {
      console.log('Switching RAG Service to memory mode...')
      await this.chromaStore.switchToMemory()
      this.isPersistent = false

      // Update retriever reference in RAG chain
      const retriever = this.chromaStore.getRetriever({ k: 4 })
      this.ragChain.retriever = retriever

      console.log('Successfully switched to memory mode')
    } catch (error) {
      console.error('Error switching to memory mode:', error.message)
      throw error
    }
  }

  async getStatus() {
    try {
      const isInitialized = this.isInitialized
      let documentCount = 0
      let cacheSize = 0

      if (isInitialized) {
        documentCount = await this.chromaStore.getDocumentCount()
        cacheSize = this.queryCache.size
      }

      return {
        initialized: isInitialized,
        persistent: this.isPersistent,
        documentCount,
        cacheSize,
        cacheEnabled: this.cacheEnabled,
        services: {
          anthropic: this.anthropicService ? true : false,
          embedding: this.embeddingService ? true : false,
          chromaStore: this.chromaStore ? true : false,
          ragChain: this.ragChain ? true : false
        }
      }
    } catch (error) {
      console.error('Error getting status:', error.message)
      return {
        initialized: false,
        error: error.message
      }
    }
  }

  cacheResult(question, result) {
    if (this.queryCache.size >= this.maxCacheSize) {
      // Remove oldest entry (FIFO)
      const firstKey = this.queryCache.keys().next().value
      this.queryCache.delete(firstKey)
    }

    this.queryCache.set(question, {
      ...result,
      metadata: {
        ...result.metadata,
        cached: true,
        cachedAt: new Date().toISOString()
      }
    })
  }

  verifyInitialization() {
    if (!this.isInitialized) {
      throw new Error('RAG Service not initialized. Call initialize() first.')
    }

    if (!this.chromaStore) {
      throw new Error(
        'ChromaStore not available. Ensure proper initialization.'
      )
    }

    if (!this.ragChain) {
      throw new Error('RAG Chain not available. Ensure proper initialization.')
    }
  }

  getChromaStore() {
    this.verifyInitialization()
    return this.chromaStore
  }

  getRagChain() {
    this.verifyInitialization()
    return this.ragChain
  }

  getAnthropicService() {
    this.verifyInitialization()
    return this.anthropicService
  }
}
