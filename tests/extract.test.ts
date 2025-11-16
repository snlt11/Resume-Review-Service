import { extractTextFromFile } from '../lib/extract'
import path from 'path'

describe('File Extraction', () => {
  it('should extract text from a TXT file', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'test.txt')
    const text = await extractTextFromFile(filePath)
    expect(text).toBe('This is a test file.')
  })

  it('should extract text from a PDF file', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'test.pdf')
    const text = await extractTextFromFile(filePath)
    expect(text).toContain('Sample PDF content for testing')
  })

  it('should extract text from a DOCX file', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'test.docx')
    const text = await extractTextFromFile(filePath)
    expect(text).toBe('Sample DOCX content for testing')
  })

  it('should throw an error for an unsupported file type', async () => {
    const filePath = path.join(__dirname, 'fixtures', 'test.md')
    await expect(extractTextFromFile(filePath)).rejects.toThrow(
      'Unsupported file type: .md'
    )
  })
})
