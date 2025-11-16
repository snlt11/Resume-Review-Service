const fs = require('fs').promises
const mammoth = require('mammoth')
const { extractTextFromFile } = require('../lib/extract')

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}))

jest.mock('pdf-parse', () => {
  return {
    PDFParse: jest.fn(),
  }
})
jest.mock('mammoth', () => ({
  extractRawText: jest.fn(),
}))

const { PDFParse } = require('pdf-parse')

describe('File Extraction', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should extract text from PDF', async () => {
    const mockPdfText = 'This is a test PDF'
    const mockGetText = jest.fn().mockResolvedValue({ text: mockPdfText })
    const mockDestroy = jest.fn().mockResolvedValue()
    PDFParse.mockImplementation(() => ({
      getText: mockGetText,
      destroy: mockDestroy,
    }))
    fs.readFile.mockResolvedValue(Buffer.from('test pdf content'))

    const text = await extractTextFromFile('test.pdf')
    expect(text).toBe(mockPdfText)
    expect(mockDestroy).toHaveBeenCalled()
  })

  test('should extract text from DOCX', async () => {
    const mockDocxText = 'This is a test DOCX'
    mammoth.extractRawText.mockResolvedValue({ value: mockDocxText })

    const text = await extractTextFromFile('test.docx')
    expect(text).toBe(mockDocxText)
  })

  test('should extract text from TXT', async () => {
    const mockTxtText = 'This is a test TXT'
    fs.readFile.mockResolvedValue(mockTxtText)

    const text = await extractTextFromFile('test.txt')
    expect(text).toBe(mockTxtText)
  })

  test('should throw error for unsupported file type', async () => {
    await expect(extractTextFromFile('test.unsupported')).rejects.toThrow(
      'Unsupported file type: .unsupported'
    )
  })

  test('should handle PDF extraction errors', async () => {
    const mockGetText = jest.fn().mockRejectedValue(new Error('PDF error'))
    const mockDestroy = jest.fn().mockResolvedValue()
    PDFParse.mockImplementation(() => ({
      getText: mockGetText,
      destroy: mockDestroy,
    }))
    fs.readFile.mockResolvedValue(Buffer.from('test pdf content'))

    await expect(extractTextFromFile('test.pdf')).rejects.toThrow('PDF error')
  })
})
