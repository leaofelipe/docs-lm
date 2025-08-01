import { ConversationalRetrievalQAChain } from 'langchain/chains'
import { BufferMemory } from 'langchain/memory'

export class RAGChain {
  constructor(llm, retriever) {
    this.llm = llm
    this.retriever = retriever
    this.memory = new BufferMemory({
      memoryKey: 'chat_history',
      returnMessages: true
    })
    this.chain = null
  }

  async initialize() {
    try {
      console.log('Initializing RAG chain...')

      this.chain = ConversationalRetrievalQAChain.fromLLM(
        this.llm,
        this.retriever,
        {
          memory: this.memory,
          returnSourceDocuments: true,
          verbose: false
        }
      )

      console.log('RAG chain initialized successfully')
    } catch (error) {
      console.error('Error initializing RAG chain:', error.message)
      throw error
    }
  }

  async ask(question) {
    if (!this.chain) {
      throw new Error('RAG chain not initialized. Call initialize() first.')
    }

    try {
      console.log(`Processing question: ${question}`)

      const response = await this.chain.call({
        question: question
      })

      return {
        answer: response.text,
        sourceDocuments: response.sourceDocuments,
        chatHistory: await this.memory.chatHistory.getMessages()
      }
    } catch (error) {
      console.error('Error processing question:', error.message)
      throw error
    }
  }

  async askWithSources(question) {
    const result = await this.ask(question)

    return {
      answer: result.answer,
      sources: result.sourceDocuments.map(doc => ({
        content: doc.pageContent.substring(0, 200) + '...',
        metadata: doc.metadata
      })),
      chatHistory: result.chatHistory
    }
  }

  clearMemory() {
    this.memory.clear()
    console.log('Chat memory cleared')
  }

  getMemory() {
    return this.memory
  }

  getChain() {
    return this.chain
  }
}
