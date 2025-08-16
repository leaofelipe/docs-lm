import { DirectoryLoader } from 'langchain/document_loaders/fs/directory'
import { TextLoader } from 'langchain/document_loaders/fs/text'
import { MarkdownTextSplitter } from '@langchain/textsplitters'

export class DocumentLoader {
  constructor(dataPath = process.env.DATA_PATH) {
    this.dataPath = dataPath
    this.splitter = new MarkdownTextSplitter({
      chunkSize: 1200,
      chunkOverlap: 200,
      separators: ['\n## ', '\n### ', '\n#### ', '\n\n', '\n', ' ', '']
    })
  }

  async loadDocuments() {
    console.log(`Loading documents from: ${this.dataPath}`)
    const isRecursive = true
    try {
      const loader = new DirectoryLoader(
        this.dataPath,
        { '.md': path => new TextLoader(path) },
        isRecursive
      )
      const documents = await loader.load()
      console.log(`Loaded ${documents.length} documents`)
      return documents
    } catch (error) {
      console.error('Error loading documents:', error.message)
      throw error
    }
  }

  async splitDocuments(documents) {
    try {
      console.log('Splitting documents into chunks...')
      const chunks = await this.splitter.splitDocuments(documents)
      console.log(
        `Created ${chunks.length} chunks from ${documents.length} documents`
      )
      return chunks
    } catch (error) {
      console.error('Error splitting documents:', error.message)
      throw error
    }
  }

  async loadAndSplitDocuments() {
    const documents = await this.loadDocuments()
    return await this.splitDocuments(documents)
  }
}
