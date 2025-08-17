import dotenv from 'dotenv'
import { DocumentLoader } from '../loaders/documentLoader.js'
import { EmbeddingService } from '../embeddings/embeddingService.js'
import { MemoryStore } from '../vectorStore/memoryStore.js'
import { AnthropicService } from '../llm/anthropicService.js'
import { RAGChain } from '../chains/ragChain.js'

dotenv.config()

const questions = ['Question 1 about the doc...']

async function demo() {
  try {
    const documentLoader = new DocumentLoader()
    const documents = await documentLoader.loadAndSplitDocuments()

    const embeddingService = new EmbeddingService()
    await embeddingService.initialize()

    const memoryStore = new MemoryStore(embeddingService.embeddings)
    await memoryStore.initialize(documents)

    const anthropicService = new AnthropicService()
    await anthropicService.initialize()

    // const retriever = memoryStore.getRetriever()
    // const ragChain = new RAGChain(anthropicService.getLLM(), retriever)
    // await ragChain.initialize()

    // for (const question of questions) {
    //   console.log(`Question: ${question}`)

    //   try {
    //     const response = await ragChain.askWithSources(question)
    //     console.log(`Answer: ${response.answer}`)
    //     console.log(`Sources: ${response.sources.length} documents found`)

    //     if (response.sources.length > 0) {
    //       console.log('Source previews:')
    //       response.sources.forEach((source, index) => {
    //         console.log(`${index + 1}. ${source.content}`)
    //       })
    //     }
    //     console.log('---\n')
    //   } catch (error) {
    //     console.log(error)
    //     console.error(`Error: ${error.message}\n`)
    //   }
    // }
  } catch (error) {
    console.log(error)
    console.error('Demo failed:', error.message)
  }
}

demo()
