import { HuggingFaceInferenceEmbeddings } from '@langchain/community/embeddings/hf'

export class EmbeddingService {
  get embeddings() {
    return this._embeddings
  }

  constructor() {
    this._embeddings = new HuggingFaceInferenceEmbeddings({
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: process.env.EMBEDDING_MODEL,
      provider: process.env.EMBEDDING_PROVIDER
    })
  }

  async checkConfig() {
    if (!process.env.HUGGINGFACE_API_KEY) {
      throw new Error('HUGGINGFACE_API_KEY environment variable is required')
    }
    if (!process.env.EMBEDDING_MODEL) {
      throw new Error('EMBEDDING_MODEL environment variable is required')
    }
  }

  async checkConnection() {
    try {
      await this._embeddings.embedQuery('testing')
    } catch (error) {
      if (error.message.includes('401')) {
        throw new Error('Invalid HuggingFace API key')
      }
      if (error.message.includes('404')) {
        throw new Error(`Model ${process.env.EMBEDDING_MODEL} not found`)
      }
      throw new Error(`Connection validation failed: ${error.message}`)
    }
  }

  async initialize() {
    try {
      console.log(
        `Initializing embedding. Model: ${process.env.EMBEDDING_MODEL}`
      )
      await this.checkConfig()
      await this.checkConnection()
      console.log('Embedding model initialized successfully')
    } catch (error) {
      console.error('Error initializing embedding model:', error.message)
      throw error
    }
  }

  async embedText(text) {
    try {
      return await this._embeddings.embedQuery(text)
    } catch (error) {
      console.error('Error embedding text:', error.message)
      throw error
    }
  }

  async embedDocuments(texts) {
    try {
      return await this._embeddings.embedDocuments(texts)
    } catch (error) {
      console.error('Error embedding documents:', error.message)
      throw error
    }
  }
}
