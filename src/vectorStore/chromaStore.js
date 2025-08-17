import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'
import path from 'path'
import { BaseRetriever } from '@langchain/core/retrievers'

/**
 * Custom retriever class that extends LangChain's BaseRetriever
 */
class ChromaRetriever extends BaseRetriever {
  static lc_name() {
    return 'ChromaRetriever'
  }

  constructor(chromaStore, options = {}) {
    super()
    this.chromaStore = chromaStore
    this.k = options.k || 4
    this.filter = options.filter || {}
    this.searchType = options.searchType || 'similarity'

    // Required LangChain properties
    this.lc_namespace = ['docs-lm', 'chromastore', 'retrievers']
  }

  async _getRelevantDocuments(query) {
    try {
      console.log(`ChromaRetriever: Getting relevant documents for: "${query}"`)
      const results = await this.chromaStore.similaritySearch(
        query,
        this.k,
        this.filter
      )

      console.log(`ChromaRetriever: Found ${results.length} relevant documents`)

      // Ensure each document has the correct structure
      const validatedResults = results.map(doc => ({
        pageContent: doc.pageContent || '',
        metadata: doc.metadata || {}
      }))

      return validatedResults
    } catch (error) {
      console.error(
        'ChromaRetriever: Error getting relevant documents:',
        error.message
      )
      return []
    }
  }
}

/**
 * ChromaStore implementation using simple in-memory storage
 * This is a custom implementation that provides ChromaDB-like interface
 * without requiring an external ChromaDB server
 */
export class ChromaStore {
  constructor(embeddingFunction) {
    this.embeddingFunction = embeddingFunction
    this.documents = []
    this.embeddings = []
    this.metadatas = []
    this.ids = []
    this.isPersistent = false
    this.collectionName =
      process.env.CHROMA_COLLECTION_NAME || 'docs_collection'
    this.persistPath =
      process.env.CHROMA_PERSIST_PATH || './database/chromadb/persist'
    this.persistFile = path.join(
      this.persistPath,
      `${this.collectionName}.json`
    )
  }

  async initialize(persistent = false, collectionName = null) {
    try {
      this.isPersistent = persistent
      if (collectionName) {
        this.collectionName = collectionName
        this.persistFile = path.join(
          this.persistPath,
          `${this.collectionName}.json`
        )
      }

      console.log(
        `Initializing ChromaStore in ${
          persistent ? 'persistent' : 'memory'
        } mode`
      )

      if (persistent) {
        await this.loadFromDisk()
      } else {
        // Start with empty arrays for memory mode
        this.documents = []
        this.embeddings = []
        this.metadatas = []
        this.ids = []
      }

      console.log(
        `ChromaStore initialized successfully with collection: ${this.collectionName}`
      )
      return this
    } catch (error) {
      console.error('Error initializing ChromaStore:', error.message)
      throw error
    }
  }

  async loadFromDisk() {
    try {
      // Create persist directory if it doesn't exist
      const persistDir = path.dirname(this.persistFile)
      if (!fs.existsSync(persistDir)) {
        fs.mkdirSync(persistDir, { recursive: true })
      }

      if (fs.existsSync(this.persistFile)) {
        const data = JSON.parse(fs.readFileSync(this.persistFile, 'utf8'))
        this.documents = data.documents || []
        this.embeddings = data.embeddings || []
        this.metadatas = data.metadatas || []
        this.ids = data.ids || []
        console.log(`Loaded ${this.documents.length} documents from disk`)
      } else {
        // Initialize empty arrays
        this.documents = []
        this.embeddings = []
        this.metadatas = []
        this.ids = []
        console.log('Starting with empty collection')
      }
    } catch (error) {
      console.error('Error loading from disk:', error.message)
      throw error
    }
  }

  async saveToDisk() {
    if (!this.isPersistent) return

    try {
      const data = {
        collectionName: this.collectionName,
        documents: this.documents,
        embeddings: this.embeddings,
        metadatas: this.metadatas,
        ids: this.ids,
        savedAt: new Date().toISOString()
      }

      fs.writeFileSync(this.persistFile, JSON.stringify(data, null, 2))
      console.log(`Saved ${this.documents.length} documents to disk`)
    } catch (error) {
      console.error('Error saving to disk:', error.message)
      throw error
    }
  }

  async createOrGetCollection() {
    // Collection is just our internal storage, no external API needed
    console.log(`Collection ${this.collectionName} ready`)
  }

  async addDocuments(documents) {
    this.verifyInitialization()

    if (!documents || documents.length === 0) {
      console.log('No documents to add')
      return
    }

    try {
      console.log(`Adding ${documents.length} documents to ChromaStore`)

      const newIds = []
      const newMetadatas = []
      const newDocumentTexts = []

      for (const doc of documents) {
        const id = uuidv4()
        newIds.push(id)
        newDocumentTexts.push(doc.pageContent)

        // Prepare metadata
        const metadata = {
          source: doc.metadata?.source || 'unknown',
          ...doc.metadata
        }
        newMetadatas.push(metadata)
      }

      // Generate embeddings using the embedding function
      const newEmbeddings = await this.generateEmbeddings(newDocumentTexts)

      // Add to our storage
      this.ids.push(...newIds)
      this.documents.push(...newDocumentTexts)
      this.embeddings.push(...newEmbeddings)
      this.metadatas.push(...newMetadatas)

      // Save to disk if persistent
      await this.saveToDisk()

      console.log(
        `Successfully added ${documents.length} documents to ChromaStore`
      )
    } catch (error) {
      console.error('Error adding documents to ChromaStore:', error.message)
      throw error
    }
  }

  async generateEmbeddings(texts) {
    try {
      if (typeof this.embeddingFunction.embedDocuments === 'function') {
        return await this.embeddingFunction.embedDocuments(texts)
      } else if (typeof this.embeddingFunction.embedQuery === 'function') {
        // Fallback to single embeddings
        const embeddings = []
        for (const text of texts) {
          const embedding = await this.embeddingFunction.embedQuery(text)
          embeddings.push(embedding)
        }
        return embeddings
      } else {
        throw new Error('Embedding function does not support required methods')
      }
    } catch (error) {
      console.error('Error generating embeddings:', error.message)
      throw error
    }
  }

  // Calculate cosine similarity between two vectors
  cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length')
    }

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  async similaritySearch(query, k = 4, filter = {}) {
    this.verifyInitialization()

    try {
      console.log(`ChromaStore: Starting similarity search for: "${query}"`)
      console.log(
        `ChromaStore: Document count: ${
          this.documents ? this.documents.length : 'undefined'
        }`
      )

      if (this.documents.length === 0) {
        console.log(
          'ChromaStore: No documents available, returning empty array'
        )
        return []
      }

      console.log('ChromaStore: Generating query embedding...')
      const queryEmbedding = await this.embeddingFunction.embedQuery(query)
      console.log(
        `ChromaStore: Query embedding generated, length: ${
          queryEmbedding ? queryEmbedding.length : 'undefined'
        }`
      )

      // Calculate similarities and create scored results
      const scoredResults = []
      for (let i = 0; i < this.documents.length; i++) {
        // Apply filter if provided
        if (Object.keys(filter).length > 0) {
          let matchesFilter = true
          for (const [key, value] of Object.entries(filter)) {
            if (this.metadatas[i][key] !== value) {
              matchesFilter = false
              break
            }
          }
          if (!matchesFilter) continue
        }

        const similarity = this.cosineSimilarity(
          queryEmbedding,
          this.embeddings[i]
        )
        scoredResults.push({
          document: {
            pageContent: this.documents[i],
            metadata: this.metadatas[i] || {}
          },
          score: similarity,
          index: i
        })
      }

      // Sort by similarity score (highest first) and take top k
      scoredResults.sort((a, b) => b.score - a.score)
      const topResults = scoredResults.slice(0, k)

      console.log(
        `ChromaStore: Found ${topResults.length} results after filtering and scoring`
      )

      // Return documents in LangChain-compatible format
      const documents = topResults.map(result => result.document)
      console.log(`ChromaStore: Returning ${documents.length} documents`)

      return documents
    } catch (error) {
      console.error(
        'ChromaStore: Error performing similarity search:',
        error.message
      )
      console.error('ChromaStore: Stack trace:', error.stack)
      return [] // Always return an array, even on error
    }
  }

  async searchWithScores(query, k = 4, filter = {}) {
    this.verifyInitialization()

    try {
      if (this.documents.length === 0) {
        return []
      }

      const queryEmbedding = await this.embeddingFunction.embedQuery(query)

      // Calculate similarities and create scored results
      const scoredResults = []
      for (let i = 0; i < this.documents.length; i++) {
        // Apply filter if provided
        if (Object.keys(filter).length > 0) {
          let matchesFilter = true
          for (const [key, value] of Object.entries(filter)) {
            if (this.metadatas[i][key] !== value) {
              matchesFilter = false
              break
            }
          }
          if (!matchesFilter) continue
        }

        const similarity = this.cosineSimilarity(
          queryEmbedding,
          this.embeddings[i]
        )
        scoredResults.push([
          {
            pageContent: this.documents[i],
            metadata: this.metadatas[i] || {}
          },
          similarity
        ])
      }

      // Sort by similarity score (highest first) and take top k
      scoredResults.sort((a, b) => b[1] - a[1])
      return scoredResults.slice(0, k)
    } catch (error) {
      console.error('Error performing search with scores:', error.message)
      throw error
    }
  }

  async deleteDocuments(ids) {
    this.verifyInitialization()

    try {
      // Find and remove documents by ID
      const indicesToRemove = []
      for (let i = 0; i < this.ids.length; i++) {
        if (ids.includes(this.ids[i])) {
          indicesToRemove.push(i)
        }
      }

      // Remove in reverse order to maintain indices
      indicesToRemove.reverse().forEach(index => {
        this.ids.splice(index, 1)
        this.documents.splice(index, 1)
        this.embeddings.splice(index, 1)
        this.metadatas.splice(index, 1)
      })

      await this.saveToDisk()
      console.log(`Deleted ${indicesToRemove.length} documents`)
    } catch (error) {
      console.error('Error deleting documents:', error.message)
      throw error
    }
  }

  async getDocumentCount() {
    this.verifyInitialization()
    return this.documents.length
  }

  async listCollections() {
    // In our simple implementation, we only have one collection
    return [this.collectionName]
  }

  async exportData() {
    this.verifyInitialization()

    try {
      return {
        collectionName: this.collectionName,
        data: {
          ids: this.ids,
          documents: this.documents,
          embeddings: this.embeddings,
          metadatas: this.metadatas
        },
        exportedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error exporting data:', error.message)
      throw error
    }
  }

  async importData(data) {
    this.verifyInitialization()

    try {
      if (data.data && data.data.ids && data.data.ids.length > 0) {
        this.ids.push(...data.data.ids)
        this.documents.push(...data.data.documents)
        this.embeddings.push(...data.data.embeddings)
        this.metadatas.push(...data.data.metadatas)

        await this.saveToDisk()
        console.log(`Imported ${data.data.ids.length} documents`)
      }
    } catch (error) {
      console.error('Error importing data:', error.message)
      throw error
    }
  }

  async switchMode(persistent, preserveData = true) {
    let exportedData = null

    if (preserveData && this.documents.length > 0) {
      try {
        exportedData = await this.exportData()
        console.log('Data exported for migration')
      } catch (error) {
        console.warn('Could not export data for migration:', error.message)
      }
    }

    // Reinitialize in new mode
    await this.initialize(persistent, this.collectionName)

    // Import data if preserved
    if (exportedData && preserveData) {
      try {
        // Clear current data first
        this.ids = []
        this.documents = []
        this.embeddings = []
        this.metadatas = []

        await this.importData(exportedData)
        console.log('Data migration completed successfully')
      } catch (error) {
        console.error('Error during data migration:', error.message)
        throw error
      }
    }
  }

  async switchToPersistent() {
    return await this.switchMode(true, true)
  }

  async switchToMemory() {
    return await this.switchMode(false, true)
  }

  getRetriever(options = {}) {
    this.verifyInitialization()

    const defaultOptions = { k: 4, searchType: 'similarity' }
    const searchOptions = { ...defaultOptions, ...options }

    // Return a proper LangChain retriever using our custom class
    return new ChromaRetriever(this, searchOptions)
  }

  verifyInitialization() {
    if (this.documents === null || this.documents === undefined) {
      throw new Error('ChromaStore not initialized. Call initialize() first.')
    }
  }

  async clearCollection() {
    this.verifyInitialization()

    try {
      this.ids = []
      this.documents = []
      this.embeddings = []
      this.metadatas = []

      await this.saveToDisk()
      console.log(`Collection ${this.collectionName} cleared`)
    } catch (error) {
      console.error('Error clearing collection:', error.message)
      throw error
    }
  }
}
