import dotenv from 'dotenv'

dotenv.config() // Load environment variables

class DocsLM {
  constructor() {
    this.name = 'Docs LM' // Application name
    this.version = '0.1.0' // Current version
  }

  start() {
    // Log startup message
    console.log(`${this.name} v${this.version} starting...`)
  }
}

const app = new DocsLM()
app.start()

export default DocsLM
