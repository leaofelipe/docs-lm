import { MemoryVectorStore } from 'langchain/vectorstores/memory'

export class MemoryStore {
  get vectorStore() {
    return this._vectorStore
  }

  constructor(embeddings) {
    this.embeddings = embeddings
    this._vectorStore = null
  }

  verifyInitialization() {
    if (!this._vectorStore) throw new Error('Vector store not initialized.')
  }

  async initialize(documents = []) {
    console.log('Creating vector store')
    try {
      this._vectorStore = await MemoryVectorStore.fromDocuments(
        documents,
        this.embeddings
      )
      console.log(`Vector store created with ${documents.length} documents`)
      return this._vectorStore
    } catch (error) {
      console.error('Error creating vector store:', error.message)
      throw error
    }
  }

  async addDocuments(documents) {
    if (!this._vectorStore) throw new Error('Vector store not initialized.')
    try {
      console.log(`Adding ${documents.length} documents to vector store`)
      await this._vectorStore.addDocuments(documents)
      console.log('Documents added successfully')
    } catch (error) {
      console.error('Error adding documents to vector store:', error.message)
      throw error
    }
  }

  async similaritySearch(query, k = 4) {
    this.verifyInitialization()
    try {
      return await this._vectorStore.similaritySearch(query, k)
    } catch (error) {
      console.error('Error performing similarity search:', error.message)
      throw error
    }
  }

  getRetriever(options = {}) {
    this.verifyInitialization()
    const defaultOptions = { k: 4, searchType: 'similarity' }
    return this._vectorStore.asRetriever({
      ...defaultOptions,
      ...options
    })
  }
}
