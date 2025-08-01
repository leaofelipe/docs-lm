import dotenv from 'dotenv'
import { MarkdownLoader } from './markdownLoader.js'

dotenv.config()
class DocsLM {
  constructor() {
    this._markdownLoader = new MarkdownLoader()
  }

  async start() {
    try {
      const files = await this._markdownLoader.loadAllMarkdownFiles()
      files.forEach(file => {
        console.log(file)
      })
    } catch (error) {
      console.error('Error on initialization', error.message)
    }
  }
}

const app = new DocsLM()
app.start()

export default DocsLM
