import { readFile, stat } from 'fs/promises'
import { join, relative, basename, extname } from 'path'
import { glob } from 'glob'

export class MarkdownLoader {
  constructor(dataPath = process.env.DATA_PATH || 'data') {
    this.dataPath = dataPath
  }

  async findMarkdownFiles(pattern = '**/*.md') {
    try {
      const searchPattern = join(this.dataPath, pattern)
      const files = await glob(searchPattern, {
        ignore: ['**/node_modules/**', '**/.git/**'],
        absolute: true
      })
      return files
    } catch (error) {
      console.error('Error on find markdown files:', error.message)
      throw error
    }
  }

  async loadMarkdownFile(filePath) {
    try {
      const [content, stats] = await Promise.all([
        readFile(filePath, 'utf-8'),
        stat(filePath)
      ])

      const relativePath = relative(this.dataPath, filePath)
      const fileName = basename(filePath, extname(filePath))

      return {
        filePath,
        relativePath,
        fileName,
        content: content.trim(),
        size: stats.size,
        lastModified: stats.mtime,
        created: stats.birthtime
      }
    } catch (error) {
      console.error(`Error on load file ${filePath}:`, error.message)
      throw error
    }
  }

  async loadAllMarkdownFiles(pattern = '**/*.md') {
    try {
      const files = await this.findMarkdownFiles(pattern)

      if (files.length === 0) {
        console.warn('No markdown files found matching pattern:', pattern)
        return []
      }

      const loadPromises = files.map(file => this.loadMarkdownFile(file))
      const loadedFiles = await Promise.all(loadPromises)
      return loadedFiles
    } catch (error) {
      console.error('Error on load markdown files:', error.message)
      throw error
    }
  }
}
