import { ChatAnthropic } from '@langchain/anthropic'

export class AnthropicService {
  get llm() {
    return this._llm
  }

  constructor() {
    this._llm = new ChatAnthropic({
      modelName: 'claude-3-5-sonnet-20241022',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.1,
      maxTokens: 2000
    })
  }

  async checkConfig() {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
  }

  async initialize() {
    try {
      console.log('Initializing Anthropic LLM...')
      this.checkConfig()
      await this._llm.invoke('Hello')
      console.log('Anthropic LLM initialized successfully')
    } catch (error) {
      console.error('Error initializing Anthropic LLM:', error.message)
      throw error
    }
  }

  async invoke(prompt) {
    try {
      const response = await this._llm.invoke(prompt)
      return response.content
    } catch (error) {
      console.error('Error invoking LLM:', error.message)
      throw error
    }
  }

  async stream(prompt) {
    try {
      return await this._llm.stream(prompt)
    } catch (error) {
      console.error('Error streaming from LLM:', error.message)
      throw error
    }
  }
}
