import express, { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import path from 'path'
import { extractTextFromFile, safeDeleteFile } from '../lib/extract'
import { buildPrompt } from '../lib/prompt'
import { callLLM, parseLLMJson, validateResumeStructure } from '../lib/llm'

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

// File filter to accept only specific types
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['.pdf', '.docx', '.txt']
  const ext = path.extname(file.originalname).toLowerCase()

  if (allowedTypes.includes(ext)) {
    cb(null, true)
  } else {
    cb(
      new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`)
    )
  }
}

// Configure multer with size limit
const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024,
  },
})

/**
 * POST /api/review-cv
 * Main endpoint for resume review
 *
 * Request:
 * - multipart/form-data
 * - cv: file (.pdf, .docx, .txt, max 10MB)
 * - job_description: text
 *
 * Response:
 * - 200: Successful analysis with JSON structure
 * - 400: Bad request (missing fields or invalid input)
 * - 422: Unprocessable entity (can't extract text from CV)
 * - 502: Bad gateway (LLM parse failure)
 * - 500: Internal server error
 */
router.post(
  '/review-cv',
  upload.single('cv'),
  async (req: Request, res: Response) => {
    const startTime = Date.now()
    let uploadedFilePath: string | null = null

    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Missing required file: cv',
          details: 'Please upload a resume file (.pdf, .docx, or .txt)',
        })
      }

      if (
        !req.body.job_description ||
        req.body.job_description.trim().length === 0
      ) {
        await safeDeleteFile(req.file.path)
        return res.status(400).json({
          error: 'Missing required field: job_description',
          details: 'Please provide a job description text',
        })
      }

      uploadedFilePath = req.file.path
      const jobDescription = (req.body as any).job_description.trim()

      let resumeText: string
      try {
        resumeText = await extractTextFromFile(uploadedFilePath)
      } catch (extractError: any) {
        await safeDeleteFile(uploadedFilePath)
        return res.status(422).json({
          error: 'Failed to extract text from resume',
          details: extractError.message,
          suggestion:
            'Please ensure the file is not corrupted and contains readable text',
        })
      }

      const prompt = buildPrompt(jobDescription, resumeText)

      let rawLLMResponse: string
      try {
        rawLLMResponse = await callLLM(prompt, req)
      } catch (llmError: any) {
        await safeDeleteFile(uploadedFilePath)
        return res.status(502).json({
          error: 'LLM API call failed',
          details: llmError.message,
          suggestion:
            'Please check your GEMINI_ENDPOINT and GEMINI_API_KEY configuration',
        })
      }

      let parsedResult: any
      try {
        parsedResult = parseLLMJson(rawLLMResponse)
      } catch (parseError: any) {
        await safeDeleteFile(uploadedFilePath)

        // Return truncated raw response for debugging (limit to 1000 chars)
        const truncatedRaw =
          rawLLMResponse.substring(0, 1000) +
          (rawLLMResponse.length > 1000 ? '...' : '')

        return res.status(502).json({
          error: 'Failed to parse LLM response as JSON',
          details: parseError.message,
          llm_raw: truncatedRaw,
          suggestion:
            'The LLM did not return valid JSON. This may be a prompt or model configuration issue.',
        })
      }

      if (!validateResumeStructure(parsedResult)) {
        await safeDeleteFile(uploadedFilePath)
        return res.status(502).json({
          error: 'LLM returned invalid resume structure',
          details: 'Response is missing required fields',
          suggestion:
            'The model may need prompt refinement or different temperature settings',
        })
      }

      const processingTime = Date.now() - startTime
      parsedResult.metadata = {
        ...parsedResult.metadata,
        parser_version: '1.0.0',
        processing_time_ms: processingTime,
      }

      await safeDeleteFile(uploadedFilePath)

      return res.status(200).json(parsedResult)
    } catch (error: any) {
      if (uploadedFilePath) {
        await safeDeleteFile(uploadedFilePath)
      }

      return res.status(500).json({
        error: 'Internal server error',
        details:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'An unexpected error occurred',
      })
    }
  }
)

// Handle multer errors (file size, type, etc.)
router.use((error: any, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        details: `Maximum file size is ${maxFileSizeMB}MB`,
      })
    }
    return res.status(400).json({
      error: 'File upload error',
      details: error.message,
    })
  }

  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      error: 'Invalid file type',
      details: error.message,
    })
  }

  next(error)
})

export default router
