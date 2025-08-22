import dotenv from 'dotenv'
import { DocumentProcessor } from '../services/documentProcessor.js'
import { RAGService } from '../services/ragService.js'

dotenv.config()

/**
 * Orchestrated Demo - Phase 2 Complete
 *
 * This demo demonstrates the complete orchestrated approach using:
 * 1. DocumentProcessor - Orchestrates document processing (Phase 1)
 * 2. RAGService - Orchestrates RAG queries and operations (Phase 2)
 *
 * Both services use ChromaDB exclusively (no LangChain vector stores)
 */
async function orchestratedDemo() {
  try {
    console.log('=== Orchestrated Demo - Phase 2 Complete ===\n')

    // Phase 1: Process documents using DocumentProcessor
    console.log('PHASE 1: Document Processing')
    console.log('1. Processing documents with DocumentProcessor...')
    const processor = new DocumentProcessor()
    await processor.initialize(false) // Memory mode for demo
    await processor.processAllDocuments()

    console.log('\n2. Getting processing status...')
    const status = await processor.getProcessingStatus()
    console.log(`Documents processed: ${status.documentsProcessed}`)
    console.log(`Total chunks: ${status.totalChunks}`)
    console.log(`Processing time: ${status.processingTime}ms`)

    // Phase 2: RAG queries using RAGService
    console.log('\n\nPHASE 2: RAG Service Operations')
    console.log('3. Initializing RAG Service...')
    const rag = new RAGService()

    // Use the same ChromaStore instance from DocumentProcessor
    await rag.initialize(false, processor.getChromaStore()) // Memory mode with existing store

    const ragStatus = await rag.getStatus()
    console.log(`RAG Service ready with ${ragStatus.documentCount} documents`)

    console.log('\n4. Testing basic question answering...')
    const question1 = 'What are player events?'
    console.log(`Question: ${question1}`)

    const response1 = await rag.ask(question1)
    console.log(`Answer: ${response1.answer}`)
    console.log(`Source documents: ${response1.metadata.documentsRetrieved}`)

    console.log('\n5. Testing question with detailed sources...')
    const question2 = 'How do Clappr events work?'
    console.log(`Question: ${question2}`)

    const response2 = await rag.askWithSources(question2)
    console.log(`Answer: ${response2.answer}`)
    console.log(`Sources found: ${response2.metadata.sourcesCount}`)
    if (response2.sources.length > 0) {
      console.log('Source details:')
      response2.sources.forEach((source, index) => {
        console.log(`  ${index + 1}. ${source.metadata.source}`)
        console.log(`     Content preview: ${source.content}`)
      })
    }

    console.log('\n6. Testing similarity search...')
    const searchQuery = 'event handling'
    console.log(`Search query: ${searchQuery}`)

    const similarDocs = await rag.similaritySearch(searchQuery, 3)
    console.log(`Found ${similarDocs.length} similar documents:`)
    similarDocs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.metadata.source}`)
      console.log(`     Preview: ${doc.pageContent.substring(0, 100)}...`)
    })

    console.log('\n7. Testing chat history and follow-up questions...')
    const followUp = 'Can you give me more details about the events mentioned?'
    console.log(`Follow-up question: ${followUp}`)

    const response3 = await rag.ask(followUp)
    console.log(`Answer: ${response3.answer}`)

    const history = await rag.getHistory()
    console.log(`Chat history now contains ${history.length} messages`)

    console.log(
      '\n8. Testing mode switching (DocumentProcessor to Persistent)...'
    )
    await processor.switchToPersistent()
    console.log('DocumentProcessor switched to persistent storage')

    console.log('\n9. Testing mode switching (RAGService to Persistent)...')
    await rag.switchToPersistent()
    console.log('RAGService switched to persistent storage')

    const finalProcessorStatus = await processor.getProcessingStatus()
    const finalRagStatus = await rag.getStatus()

    console.log('\n10. Final service status...')
    console.log('DocumentProcessor:', {
      persistent: finalProcessorStatus.persistent,
      documentsProcessed: finalProcessorStatus.documentsProcessed
    })
    console.log('RAGService:', {
      persistent: finalRagStatus.persistent,
      documentCount: finalRagStatus.documentCount,
      cacheSize: finalRagStatus.cacheSize
    })

    console.log('\n=== Phase 2 Implementation Successful! ===')
    console.log('\nKey advantages of the orchestrated approach:')
    console.log('✓ Simple API: Only 2 main services to use')
    console.log(
      '✓ ChromaDB exclusive: Better performance, no LangChain overhead'
    )
    console.log('✓ Flexible storage: Memory (dev) or persistent (prod) modes')
    console.log('✓ MCP ready: Clean interfaces for external integration')
    console.log('✓ Cache support: Intelligent query caching for performance')
    console.log('✓ Status monitoring: Detailed service health information')
    console.log(
      '\nNext: Phase 3 - ChromaStore optimization and LangChain removal'
    )
  } catch (error) {
    console.error('Orchestrated demo failed:', error.message)
    console.error('Stack trace:', error.stack)
  }
}

orchestratedDemo()
