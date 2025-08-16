import dotenv from 'dotenv'
import { DocumentLoader } from './src/loaders/documentLoader.js'
import { EmbeddingService } from './src/embeddings/embeddingService.js'
import { MemoryStore } from './src/vectorStore/memoryStore.js'
import { AnthropicService } from './src/llm/anthropicService.js'
import { RAGChain } from './src/chains/ragChain.js'

dotenv.config()

async function demo() {
  try {
    console.log('🔧 Setting up DocsLM RAG system...\n')

    // 1. Load and process documents
    console.log('📚 Loading documents...')
    const documentLoader = new DocumentLoader()
    const documents = await documentLoader.loadAndSplitDocuments()

    if (documents.length === 0) {
      console.log('❌ No documents found in data/docs directory')
      console.log('💡 Add some .md files to data/docs/ and try again')
      return
    }

    // 2. Initialize embeddings
    console.log('🧠 Initializing embeddings...')
    const embeddingService = new EmbeddingService()
    await embeddingService.initialize()

    // 3. Create vector store
    console.log('🗃️  Creating vector store...')
    const memoryStore = new MemoryStore(embeddingService.getEmbeddings())
    await memoryStore.createFromDocuments(documents)

    // 4. Initialize LLM
    console.log('🤖 Initializing Claude...')
    const anthropicService = new AnthropicService()
    await anthropicService.initialize()

    // 5. Create RAG chain
    console.log('🔗 Setting up RAG chain...')
    const retriever = memoryStore.getRetriever({ k: 3 })
    const ragChain = new RAGChain(anthropicService.getLLM(), retriever)
    await ragChain.initialize()

    console.log('✅ System ready!\n')

    // Demo questions
    const questions = [
      // 'O que são eventos no Clappr?'
      'Quais são os principais eventos do player?'
      // 'Como usar os eventos em uma aplicação?'
    ]

    for (const question of questions) {
      console.log(`❓ Question: ${question}`)

      try {
        const response = await ragChain.askWithSources(question)
        console.log('HERE')
        console.log(`🤖 Answer: ${response.answer}`)
        console.log(`📄 Sources: ${response.sources.length} documents found`)

        if (response.sources.length > 0) {
          console.log('📚 Source previews:')
          response.sources.forEach((source, index) => {
            console.log(`   ${index + 1}. ${source.content}`)
          })
        }
        console.log('---\n')
      } catch (error) {
        console.log(error)
        console.error(`❌ Error: ${error.message}\n`)
      }
    }

    // Test similarity search
    console.log('🔍 Testing similarity search...')
    const searchResults = await memoryStore.similaritySearch('player events', 2)
    console.log(`Found ${searchResults.length} similar documents:`)
    searchResults.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.pageContent.substring(0, 100)}...`)
    })
  } catch (error) {
    console.error('❌ Demo failed:', error.message)

    if (error.message.includes('ANTHROPIC_API_KEY')) {
      console.log('\n💡 Setup instructions:')
      console.log('1. Copy .env.example to .env')
      console.log('2. Add your Anthropic API key to .env')
      console.log('3. Make sure you have markdown files in data/docs/')
    }
  }
}

demo()
