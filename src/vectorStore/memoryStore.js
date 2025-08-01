import { MemoryVectorStore } from 'langchain/vectorstores/memory'

export class MemoryStore {
  constructor(embeddings) {
    this.embeddings = embeddings
    this.vectorStore = null
  }

  async createFromDocuments(documents) {
    try {
      console.log('Creating vector store from documents...')
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        documents,
        this.embeddings
      )
      console.log(`Vector store created with ${documents.length} documents`)
      return this.vectorStore
    } catch (error) {
      console.error('Error creating vector store:', error.message)
      throw error
    }
  }

  async addDocuments(documents) {
    if (!this.vectorStore) {
      throw new Error(
        'Vector store not initialized. Call createFromDocuments first.'
      )
    }

    try {
      console.log(`Adding ${documents.length} documents to vector store...`)
      await this.vectorStore.addDocuments(documents)
      console.log('Documents added successfully')
    } catch (error) {
      console.error('Error adding documents to vector store:', error.message)
      throw error
    }
  }

  async similaritySearch(query, k = 4) {
    if (!this.vectorStore) {
      throw new Error(
        'Vector store not initialized. Call createFromDocuments first.'
      )
    }

    try {
      return await this.vectorStore.similaritySearch(query, k)
    } catch (error) {
      console.error('Error performing similarity search:', error.message)
      throw error
    }
  }

  getRetriever(options = {}) {
    if (!this.vectorStore) {
      throw new Error(
        'Vector store not initialized. Call createFromDocuments first.'
      )
    }

    const defaultOptions = {
      k: 4,
      searchType: 'similarity'
    }

    return this.vectorStore.asRetriever({
      ...defaultOptions,
      ...options
    })
  }

  getVectorStore() {
    return this.vectorStore
  }
}
