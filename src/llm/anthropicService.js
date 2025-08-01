import { ChatAnthropic } from '@langchain/anthropic'

export class AnthropicService {
  constructor() {
    this.llm = new ChatAnthropic({
      modelName: 'claude-3-5-sonnet-20241022',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.1,
      maxTokens: 1000
    })
  }

  async initialize() {
    try {
      console.log('Initializing Anthropic LLM...')

      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY environment variable is required')
      }

      // Test the connection with a simple prompt
      await this.llm.invoke('Hello')
      console.log('Anthropic LLM initialized successfully')
    } catch (error) {
      console.error('Error initializing Anthropic LLM:', error.message)
      throw error
    }
  }

  getLLM() {
    return this.llm
  }

  async invoke(prompt) {
    try {
      const response = await this.llm.invoke(prompt)
      return response.content
    } catch (error) {
      console.error('Error invoking LLM:', error.message)
      throw error
    }
  }

  async stream(prompt) {
    try {
      return await this.llm.stream(prompt)
    } catch (error) {
      console.error('Error streaming from LLM:', error.message)
      throw error
    }
  }
}
