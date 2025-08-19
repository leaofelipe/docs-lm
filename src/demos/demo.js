import dotenv from 'dotenv'
import { DocumentProcessor } from '../services/documentProcessor.js'
import { RAGService } from '../services/ragService.js'

dotenv.config()

async function demo() {
  try {
    console.log('=== Demo: Orchestrators with ChromaDB only ===')

    const usePersistent = process.env.USE_PERSISTENT_STORAGE === 'true'

    // 1) Process documents using DocumentProcessor (ChromaDB only)
    const processor = new DocumentProcessor()
    await processor.initialize(usePersistent)
    await processor.processAllDocuments()
    const procStatus = await processor.getProcessingStatus()
    console.log('DocumentProcessor status:', procStatus)

    // 2) Ask using RAGService backed by the same ChromaStore
    const rag = new RAGService()
    await rag.initialize(usePersistent, processor.getChromaStore())

    const question = 'Liste todos os eventos do player'
    console.log(`Question: ${question}`)
    const response = await rag.ask(question)
    console.log(`Answer: ${response.answer}`)
    console.log(
      `Sources: ${response?.sourceDocuments?.length || 0} documents found`
    )

    if (response?.sourceDocuments?.length) {
      console.log('Source documents:')
      response.sourceDocuments.forEach((doc, index) => {
        console.log(`${index + 1}. ${doc.metadata?.source || 'unknown'}`)
        console.log(`   Content: ${doc.pageContent || ''}`)
      })
    }

    console.log('=== Demo finished ===')
  } catch (error) {
    console.error('Demo failed:', error.message)
  }
}

demo()
