const axios = require('axios')
const { callLLM, parseLLMJson, validateResumeStructure } = require('../lib/llm')

jest.mock('axios')

describe('LLM Interaction', () => {
  const originalEnv = process.env

  beforeAll(() => {
    process.env.GEMINI_ENDPOINT = 'http://fake-gemini-endpoint.com'
    process.env.GEMINI_API_KEY = 'fake-api-key'
  })

  afterAll(() => {
    process.env = originalEnv
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should call LLM and return response text', async () => {
    const mockResponse = {
      data: {
        candidates: [
          {
            content: {
              parts: [{ text: '{"message": "success"}' }],
            },
          },
        ],
      },
    }
    axios.post.mockResolvedValue(mockResponse)

    const responseText = await callLLM('test prompt')
    expect(responseText).toBe('{"message": "success"}')
  })

  test('should handle LLM API errors', async () => {
    const mockError = {
      response: {
        status: 500,
        statusText: 'Internal Server Error',
        data: { error: 'Server error' },
      },
    }
    axios.post.mockRejectedValue(mockError)

    await expect(callLLM('test prompt')).rejects.toThrow(
      'LLM API error (500): Internal Server Error'
    )
  })

  test('should parse valid JSON from LLM response', () => {
    const rawResponse = '{"key": "value"}'
    const parsed = parseLLMJson(rawResponse)
    expect(parsed).toEqual({ key: 'value' })
  })

  test('should handle JSON parsing errors', () => {
    const rawResponse = 'invalid json {{'
    expect(() => parseLLMJson(rawResponse)).toThrow()
  })

  describe('validateResumeStructure', () => {
    const baseValidStructure = {
      candidate: {},
      evidence: {},
      scores: { overall_match: 90 },
      review: {},
      suggested_interview_questions: [],
      metadata: {},
    }

    beforeEach(() => {
      // Reset modules to reload prompt.js with new env variables
      jest.resetModules()
      process.env = { ...originalEnv, ...process.env }
    })

    test('should validate correct structure when suggestions are disabled', () => {
      process.env.CV_IMPROVEMENT_SUGGESTIONS_ENABLED = 'false'
      const { validateResumeStructure } = require('../lib/llm')
      expect(validateResumeStructure(baseValidStructure)).toBe(true)
    })

    test('should validate correct structure when suggestions are enabled', () => {
      process.env.CV_IMPROVEMENT_SUGGESTIONS_ENABLED = 'true'
      const { validateResumeStructure } = require('../lib/llm')
      const structureWithSuggestions = {
        ...baseValidStructure,
        cv_improvement_suggestions: {},
      }
      expect(validateResumeStructure(structureWithSuggestions)).toBe(true)
    })

    test('should invalidate if cv_improvement_suggestions is missing when enabled', () => {
      process.env.CV_IMPROVEMENT_SUGGESTIONS_ENABLED = 'true'
      const { validateResumeStructure } = require('../lib/llm')
      expect(validateResumeStructure(baseValidStructure)).toBe(false)
    })

    test('should invalidate if a base field is missing', () => {
      process.env.CV_IMPROVEMENT_SUGGESTIONS_ENABLED = 'false'
      const { validateResumeStructure } = require('../lib/llm')
      const { review, ...invalidStructure } = baseValidStructure
      expect(validateResumeStructure(invalidStructure)).toBe(false)
    })
  })
})
