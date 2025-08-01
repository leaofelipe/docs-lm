import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers'

export class EmbeddingService {
  constructor() {
    this.embeddings = new HuggingFaceTransformersEmbeddings({
      model: 'Xenova/all-MiniLM-L6-v2'
      // Alternativas para português:
      // model: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
      // model: 'intfloat/multilingual-e5-base'
    })
  }

  async initialize() {
    try {
      console.log('Initializing embedding model...')
      // Test embedding to ensure model is loaded
      await this.embeddings.embedQuery('test')
      console.log('Embedding model initialized successfully')
    } catch (error) {
      console.error('Error initializing embedding model:', error.message)
      throw error
    }
  }

  getEmbeddings() {
    return this.embeddings
  }

  async embedText(text) {
    try {
      return await this.embeddings.embedQuery(text)
    } catch (error) {
      console.error('Error embedding text:', error.message)
      throw error
    }
  }

  async embedDocuments(texts) {
    try {
      return await this.embeddings.embedDocuments(texts)
    } catch (error) {
      console.error('Error embedding documents:', error.message)
      throw error
    }
  }
}
