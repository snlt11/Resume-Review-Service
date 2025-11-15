const fs = require("fs").promises;
const path = require("path");
const { PDFParse } = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extract text content from uploaded file based on file type
 * @param {string} filePath - Absolute path to the uploaded file
 * @returns {Promise<string>} - Extracted text content
 * @throws {Error} - If extraction fails or file type is unsupported
 */
async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".pdf":
      return await extractFromPDF(filePath);

    case ".docx":
      return await extractFromDOCX(filePath);

    case ".txt":
      return await extractFromTXT(filePath);

    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

/**
 * Extract text from PDF file using pdf-parse v2.x
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromPDF(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const parser = new PDFParse({ data: dataBuffer });
  const result = await parser.getText();
  await parser.destroy();

  if (!result.text || result.text.trim().length === 0) {
    throw new Error("PDF appears to be empty or contains only images");
  }

  return result.text.trim();
}

/**
 * Extract text from DOCX file using mammoth
 * @param {string} filePath - Path to DOCX file
 * @returns {Promise<string>} - Extracted text
 */
async function extractFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });

  if (!result.value || result.value.trim().length === 0) {
    throw new Error("DOCX file appears to be empty");
  }

  return result.value.trim();
}

/**
 * Extract text from plain text file
 * @param {string} filePath - Path to TXT file
 * @returns {Promise<string>} - File contents
 */
async function extractFromTXT(filePath) {
  const content = await fs.readFile(filePath, "utf-8");

  if (!content || content.trim().length === 0) {
    throw new Error("Text file is empty");
  }

  return content.trim();
}

/**
 * Safely delete file, suppressing errors if file doesn't exist
 * @param {string} filePath - Path to file to delete
 */
async function safeDeleteFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

module.exports = {
  extractTextFromFile,
  safeDeleteFile,
};
