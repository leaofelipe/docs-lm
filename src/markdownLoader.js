import { readFile } from 'fs/promises'
import { join, relative, basename, extname, sep } from 'path'
import { glob } from 'glob'
import matter from 'gray-matter'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import { unified } from 'unified'

export class MarkdownLoader {
  constructor(dataPath = process.env.DATA_PATH || 'data/docs') {
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

  async getAbstractSyntaxTree(content) {
    const processor = unified()
      .use(remarkParse)
      .use(remarkFrontmatter)
      .use(remarkGfm)

    return processor.parse(content)
  }

  async loadMarkdownFile(filePath) {
    try {
      const fileContent = await readFile(filePath, 'utf-8')

      const { data: frontmatter, content } = matter(fileContent)
      const relativePath = relative(this.dataPath, filePath)
      const fileName = basename(filePath, extname(filePath))

      const hierarchy = this.extractHierarchyFromPath(relativePath)
      const abstractSyntaxTree = await this.getAbstractSyntaxTree(content)

      return {
        filePath,
        relativePath,
        fileName,
        content: content.trim(),
        frontmatter,
        rawContent: fileContent.trim(),
        hierarchy,
        ast: abstractSyntaxTree
      }
    } catch (error) {
      console.error(`Error on load file ${filePath}:`, error.message)
      throw error
    }
  }

  extractHierarchyFromPath(relativePath) {
    const pathParts = relativePath.split(sep)
    if (pathParts[pathParts.length - 1].endsWith('.md')) {
      const filename = pathParts[pathParts.length - 1].replace('.md', '')
      if (filename !== 'README') {
        pathParts[pathParts.length - 1] = filename
      } else {
        pathParts.pop()
      }
    }

    return pathParts.filter(part => part.length > 0)
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
