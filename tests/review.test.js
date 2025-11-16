const request = require('supertest')
const express = require('express')
const reviewRouter = require('../routes/review')

// Mock dependencies
jest.mock('../lib/extract', () => ({
  extractTextFromFile: jest.fn().mockResolvedValue('extracted text'),
  safeDeleteFile: jest.fn(),
}))
jest.mock('../lib/llm', () => ({
  callLLM: jest.fn().mockResolvedValue('{"scores": {"overall_match": 95}}'),
  parseLLMJson: jest.fn().mockReturnValue({ scores: { overall_match: 95 } }),
  validateResumeStructure: jest.fn().mockReturnValue(true),
}))

const app = express()
app.use(express.json())
app.use('/api', reviewRouter)

describe('Review API', () => {
  test('should return 200 for successful review', async () => {
    const response = await request(app)
      .post('/api/review-cv')
      .field('job_description', 'test job description')
      .attach('cv', 'tests/fixtures/test.pdf')

    expect(response.status).toBe(200)
    expect(response.body.scores.overall_match).toBe(95)
  })

  test('should return 400 if cv is missing', async () => {
    const response = await request(app)
      .post('/api/review-cv')
      .field('job_description', 'test job description')

    expect(response.status).toBe(400)
  })

  test('should return 400 if job_description is missing', async () => {
    const response = await request(app)
      .post('/api/review-cv')
      .attach('cv', 'tests/fixtures/test.pdf')

    expect(response.status).toBe(400)
  })
})
