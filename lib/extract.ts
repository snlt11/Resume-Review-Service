import { promises as fs } from 'fs'
import path from 'path'
import { PDFExtract } from 'pdf.js-extract'
import mammoth from 'mammoth'
import axios from 'axios'

export async function extractTextFromUrl(fileUrl: string): Promise<string> {
  const response = await axios.get(fileUrl, { responseType: 'arraybuffer' })
  const buffer = Buffer.from(response.data)
  const ext = path.extname(fileUrl).toLowerCase()
  const tempFilePath = path.join(
    __dirname,
    '..',
    'uploads',
    `${Date.now()}${ext}`
  )
  await fs.writeFile(tempFilePath, buffer)
  const text = await extractTextFromFile(tempFilePath)
  await fs.unlink(tempFilePath)
  return text
}

/**
 * Extract text content from uploaded file based on file type
 * @param {string} filePath - Absolute path to the uploaded file
 * @returns {Promise<string>} - Extracted text content
 * @throws {Error} - If extraction fails or file type is unsupported
 */
async function extractTextFromFile(filePath: string): Promise<string> {
  const ext = path.extname(filePath).toLowerCase()

  switch (ext) {
    case '.pdf':
      return await extractFromPDF(filePath)

    case '.docx': {
      const { value } = await mammoth.extractRawText({ path: filePath })
      if (!value || value.trim().length === 0) {
        throw new Error('DOCX file is empty or contains no text')
      }
      return value.trim()
    }

    case '.txt':
      return await extractFromTXT(filePath)

    default:
      throw new Error(`Unsupported file type: ${ext}`)
  }
}

/**
 * Extract text from PDF file using pdf-parse v2.x
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromPDF(filePath: string): Promise<string> {
  const pdfExtract = new PDFExtract()
  const data = await pdfExtract.extract(filePath, {})
  return data.pages
    .map((page: any) => page.content.map((item: any) => item.str).join(' '))
    .join('\n')
}

/**
 * Extracts text from a .txt file
 * @param {string} filePath - Path to the .txt file
 * @returns {Promise<string>} - Extracted text content
 */
async function extractFromTXT(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8')

  if (!content || content.trim().length === 0) {
    throw new Error('Text file is empty')
  }

  return content.trim()
}

/**
 * Safely delete file, suppressing errors if file doesn't exist
 * @param {string} filePath - Path to file to delete
 */
async function safeDeleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath)
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      throw error
    }
  }
}

export { extractTextFromFile, safeDeleteFile }
