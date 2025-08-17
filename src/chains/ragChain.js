import { createRetrievalChain } from 'langchain/chains/retrieval'
import { createStuffDocumentsChain } from 'langchain/chains/combine_documents'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableWithMessageHistory } from '@langchain/core/runnables'
import { ChatMessageHistory } from 'langchain/stores/message/in_memory'
import SYSTEM_PROMPT from './systemPrompt'

export class RAGChain {
  constructor(llm, retriever) {
    this.llm = llm
    this.retriever = retriever
    this.messageHistory = new ChatMessageHistory()
    this.chain = null
    this.chainWithHistory = null
  }

  checkInitialization() {
    if (!this.chain) {
      throw new Error('RAG chain not initialized. Call initialize() first.')
    }
  }

  async initialize() {
    try {
      console.log('Initializing RAG chain...')
      const prompt = ChatPromptTemplate.fromTemplate(SYSTEM_PROMPT)
      const documentChain = await createStuffDocumentsChain({
        llm: this.llm,
        prompt
      })

      this.chain = await createRetrievalChain({
        retriever: this.retriever,
        combineDocsChain: documentChain
      })

      this.chainWithHistory = new RunnableWithMessageHistory({
        runnable: this.chain,
        getMessageHistory: () => this.messageHistory,
        inputMessagesKey: 'input',
        historyMessagesKey: 'chat_history',
        outputMessagesKey: 'answer'
      })

      console.log('RAG chain initialized successfully')
    } catch (error) {
      console.error('Error initializing RAG chain:', error.message)
      throw error
    }
  }

  async ask(question) {
    this.checkInitialization()
    try {
      console.log(`Processing question: ${question}`)
      const response = await this.chainWithHistory.invoke(
        { input: question },
        { configurable: { sessionId: 'default' } }
      )

      return {
        answer: response.answer,
        sourceDocuments: response.context,
        chatHistory: await this.messageHistory.getMessages()
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
    this.messageHistory.clear()
    console.log('Chat memory cleared')
  }

  getMemory() {
    return this.messageHistory
  }

  getChain() {
    return this.chain
  }
}
