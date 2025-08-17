import { DocumentLoader } from '../loaders/documentLoader.js'
import { EmbeddingService } from '../embeddings/embeddingService.js'
import { ChromaStore } from '../vectorStore/chromaStore.js'
import { MemoryStore } from '../vectorStore/memoryStore.js'
import fs from 'fs'
import path from 'path'

export class DocumentProcessor {
  constructor() {
    this.documentLoader = new DocumentLoader()
    this.embeddingService = new EmbeddingService()
    this.chromaStore = null
    this.memoryStore = null // Keep for backward compatibility
    this.currentStore = null
    this.useChromaDB = process.env.USE_CHROMADB !== 'false' // Default to ChromaDB
    this.persistent = process.env.USE_PERSISTENT_STORAGE === 'true'
    this.processedFiles = new Map() // Track processed files for incremental updates
  }

  async initialize(persistent = null) {
    try {
      console.log('Initializing DocumentProcessor...')

      // Override persistent setting if provided
      if (persistent !== null) {
        this.persistent = persistent
      }

      // Initialize embedding service
      await this.embeddingService.initialize()

      // Initialize vector store based on configuration
      if (this.useChromaDB) {
        await this.initializeChromaStore()
      } else {
        await this.initializeMemoryStore()
      }

      console.log('DocumentProcessor initialized successfully')
      return this
    } catch (error) {
      console.error('Error initializing DocumentProcessor:', error.message)
      throw error
    }
  }

  async initializeChromaStore() {
    try {
      this.chromaStore = new ChromaStore(this.embeddingService.embeddings)
      await this.chromaStore.initialize(this.persistent)
      this.currentStore = this.chromaStore
      console.log(
        `ChromaStore initialized in ${
          this.persistent ? 'persistent' : 'memory'
        } mode`
      )
    } catch (error) {
      console.error('Error initializing ChromaStore:', error.message)
      throw error
    }
  }

  async initializeMemoryStore() {
    try {
      this.memoryStore = new MemoryStore(this.embeddingService.embeddings)
      // Initialize with empty documents - will be populated by processAllDocuments
      await this.memoryStore.initialize([])
      this.currentStore = this.memoryStore
      console.log('MemoryStore initialized')
    } catch (error) {
      console.error('Error initializing MemoryStore:', error.message)
      throw error
    }
  }

  async processAllDocuments() {
    try {
      console.log('Starting document processing...')

      // Load and split documents
      const documents = await this.documentLoader.loadAndSplitDocuments()

      if (documents.length === 0) {
        console.log('No documents found to process')
        return { processed: 0, added: 0, skipped: 0 }
      }

      // Process documents with incremental detection
      const result = await this.processDocuments(documents)

      console.log(`Document processing completed: ${JSON.stringify(result)}`)
      return result
    } catch (error) {
      console.error('Error processing all documents:', error.message)
      throw error
    }
  }

  async processDocuments(documents) {
    const stats = { processed: 0, added: 0, skipped: 0 }

    try {
      const newDocuments = []

      for (const doc of documents) {
        const fileStats = fs.statSync(doc.metadata.source)
        const fileKey = `${doc.metadata.source}_${fileStats.mtime.getTime()}`

        if (this.processedFiles.has(fileKey)) {
          stats.skipped++
          continue
        }

        newDocuments.push(doc)
        this.processedFiles.set(fileKey, {
          processedAt: new Date().toISOString(),
          size: fileStats.size,
          mtime: fileStats.mtime
        })
        stats.processed++
      }

      if (newDocuments.length > 0) {
        // Add documents to vector store
        if (this.useChromaDB && this.chromaStore) {
          await this.chromaStore.addDocuments(newDocuments)
        } else if (this.memoryStore) {
          await this.memoryStore.addDocuments(newDocuments)
        }
        stats.added = newDocuments.length
        console.log(
          `Added ${newDocuments.length} new documents to vector store`
        )
      }

      return stats
    } catch (error) {
      console.error('Error processing documents:', error.message)
      throw error
    }
  }

  async processDocumentByPath(filePath) {
    try {
      console.log(`Processing single document: ${filePath}`)

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`)
      }

      // Create a temporary document loader for this specific file
      const tempLoader = new DocumentLoader(path.dirname(filePath))
      const documents = await tempLoader.loadDocuments()

      // Filter to only the requested file
      const targetDoc = documents.find(
        doc => path.resolve(doc.metadata.source) === path.resolve(filePath)
      )

      if (!targetDoc) {
        throw new Error(`Document not loaded from path: ${filePath}`)
      }

      // Split the document
      const splitDocs = await this.documentLoader.splitDocuments([targetDoc])

      // Process the documents
      const result = await this.processDocuments(splitDocs)

      console.log(
        `Single document processing completed: ${JSON.stringify(result)}`
      )
      return result
    } catch (error) {
      console.error('Error processing document by path:', error.message)
      throw error
    }
  }

  async refreshDatabase() {
    try {
      console.log('Refreshing database...')

      // Clear processed files tracking
      this.processedFiles.clear()

      // Clear vector store
      if (this.useChromaDB && this.chromaStore) {
        await this.chromaStore.clearCollection()
      } else if (this.memoryStore) {
        // Reinitialize memory store
        await this.initializeMemoryStore()
      }

      // Reprocess all documents
      const result = await this.processAllDocuments()

      console.log('Database refresh completed')
      return result
    } catch (error) {
      console.error('Error refreshing database:', error.message)
      throw error
    }
  }

  async getProcessingStatus() {
    try {
      const status = {
        initialized: this.currentStore !== null,
        vectorStore: this.useChromaDB ? 'ChromaDB' : 'MemoryStore',
        persistent: this.persistent,
        processedFiles: this.processedFiles.size,
        documentCount: 0
      }

      if (this.currentStore) {
        if (this.useChromaDB && this.chromaStore) {
          status.documentCount = await this.chromaStore.getDocumentCount()
        } else {
          // For memory store, we don't have a direct count method
          status.documentCount = 'unknown'
        }
      }

      return status
    } catch (error) {
      console.error('Error getting processing status:', error.message)
      throw error
    }
  }

  async switchToPersistent() {
    try {
      if (!this.useChromaDB) {
        throw new Error('ChromaDB must be enabled to use persistent storage')
      }

      if (this.persistent) {
        console.log('Already using persistent storage')
        return
      }

      console.log('Switching to persistent storage...')
      await this.chromaStore.switchToPersistent()
      this.persistent = true
      console.log('Switched to persistent storage successfully')
    } catch (error) {
      console.error('Error switching to persistent storage:', error.message)
      throw error
    }
  }

  async switchToMemory() {
    try {
      if (!this.useChromaDB) {
        console.log('Already using memory storage (MemoryStore)')
        return
      }

      if (!this.persistent) {
        console.log('Already using memory storage')
        return
      }

      console.log('Switching to memory storage...')
      await this.chromaStore.switchToMemory()
      this.persistent = false
      console.log('Switched to memory storage successfully')
    } catch (error) {
      console.error('Error switching to memory storage:', error.message)
      throw error
    }
  }

  async switchToChromaDB(persistent = false) {
    try {
      if (this.useChromaDB) {
        console.log('Already using ChromaDB')
        return
      }

      console.log('Switching to ChromaDB...')

      // Export data from memory store if available
      let exportedData = null
      if (this.memoryStore && this.memoryStore.vectorStore) {
        try {
          // Get all documents from memory store
          const docs = await this.memoryStore.vectorStore.similaritySearch(
            '',
            1000
          )
          exportedData = docs
          console.log(`Exported ${docs.length} documents from MemoryStore`)
        } catch (error) {
          console.warn('Could not export data from MemoryStore:', error.message)
        }
      }

      // Initialize ChromaDB
      this.useChromaDB = true
      this.persistent = persistent
      await this.initializeChromaStore()

      // Import data if available
      if (exportedData && exportedData.length > 0) {
        await this.chromaStore.addDocuments(exportedData)
        console.log(`Imported ${exportedData.length} documents to ChromaDB`)
      }

      console.log('Successfully switched to ChromaDB')
    } catch (error) {
      console.error('Error switching to ChromaDB:', error.message)
      throw error
    }
  }

  async switchToMemoryStore() {
    try {
      if (!this.useChromaDB) {
        console.log('Already using MemoryStore')
        return
      }

      console.log('Switching to MemoryStore...')

      // Export data from ChromaDB if available
      let exportedData = null
      if (this.chromaStore) {
        try {
          const chromaData = await this.chromaStore.exportData()
          if (chromaData.data && chromaData.data.documents) {
            exportedData = chromaData.data.documents.map((doc, index) => ({
              pageContent: doc,
              metadata: chromaData.data.metadatas[index] || {}
            }))
          }
          console.log(
            `Exported ${exportedData?.length || 0} documents from ChromaDB`
          )
        } catch (error) {
          console.warn('Could not export data from ChromaDB:', error.message)
        }
      }

      // Initialize MemoryStore
      this.useChromaDB = false
      await this.initializeMemoryStore()

      // Import data if available
      if (exportedData && exportedData.length > 0) {
        await this.memoryStore.addDocuments(exportedData)
        console.log(`Imported ${exportedData.length} documents to MemoryStore`)
      }

      console.log('Successfully switched to MemoryStore')
    } catch (error) {
      console.error('Error switching to MemoryStore:', error.message)
      throw error
    }
  }

  // Getter for backward compatibility
  get vectorStore() {
    return this.currentStore
  }

  // Get retriever for integration with chains
  getRetriever(options = {}) {
    if (!this.currentStore) {
      throw new Error('DocumentProcessor not initialized')
    }
    return this.currentStore.getRetriever(options)
  }

  // Check if incremental updates are needed
  async checkForUpdates() {
    try {
      const documents = await this.documentLoader.loadDocuments()
      const updatesNeeded = []

      for (const doc of documents) {
        const fileStats = fs.statSync(doc.metadata.source)
        const fileKey = `${doc.metadata.source}_${fileStats.mtime.getTime()}`

        if (!this.processedFiles.has(fileKey)) {
          updatesNeeded.push(doc.metadata.source)
        }
      }

      return {
        hasUpdates: updatesNeeded.length > 0,
        filesToUpdate: updatesNeeded,
        totalFiles: documents.length,
        processedFiles: this.processedFiles.size
      }
    } catch (error) {
      console.error('Error checking for updates:', error.message)
      throw error
    }
  }

  // Get ChromaStore instance for sharing with other services
  getChromaStore() {
    if (this.useChromaDB && this.chromaStore) {
      return this.chromaStore
    }
    throw new Error(
      'ChromaStore not available. Ensure useChromaDB is true and service is initialized.'
    )
  }

  // Get current vector store (ChromaStore or MemoryStore)
  getCurrentStore() {
    return this.currentStore
  }
}
