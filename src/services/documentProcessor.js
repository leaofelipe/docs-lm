import { DocumentLoader } from '../loaders/documentLoader.js'
import { EmbeddingService } from '../embeddings/embeddingService.js'
import { ChromaStore } from '../vectorStore/chromaStore.js'

import fs from 'fs'
import path from 'path'

export class DocumentProcessor {
  constructor() {
    this.documentLoader = new DocumentLoader()
    this.embeddingService = new EmbeddingService()
    this.chromaStore = null
    // MemoryStore removed: using only ChromaStore
    this.currentStore = null
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

      // Always initialize ChromaStore
      await this.initializeChromaStore()

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
        // Add documents to ChromaStore
        if (this.chromaStore) {
          await this.chromaStore.addDocuments(newDocuments)
        }
        stats.added = newDocuments.length
        console.log(`Added ${newDocuments.length} new documents to ChromaStore`)
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

      // Clear ChromaStore
      if (this.chromaStore) {
        await this.chromaStore.clearCollection()
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
        vectorStore: 'ChromaDB',
        persistent: this.persistent,
        processedFiles: this.processedFiles.size,
        documentCount: 0
      }

      if (this.chromaStore) {
        status.documentCount = await this.chromaStore.getDocumentCount()
      }

      return status
    } catch (error) {
      console.error('Error getting processing status:', error.message)
      throw error
    }
  }

  // Get retriever for integration with chains
  getRetriever(options = {}) {
    if (!this.chromaStore) {
      throw new Error('DocumentProcessor not initialized')
    }
    return this.chromaStore.getRetriever(options)
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
}
