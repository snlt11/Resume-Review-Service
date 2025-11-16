import request from 'supertest'
import app from '../server'
import path from 'path'

describe('Review API', () => {
  it('should return a 400 if no CV is provided', async () => {
    const res = await request(app)
      .post('/api/review-cv')
      .field('job_description', 'A test job description')
    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty('error', 'Missing required file: cv')
  })

  it('should return a 400 if no job description is provided', async () => {
    const cvPath = path.join(__dirname, 'fixtures', 'test.txt')
    const res = await request(app).post('/api/review-cv').attach('cv', cvPath)
    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty(
      'error',
      'Missing required field: job_description'
    )
  })

  it('should return a 400 for an unsupported file type', async () => {
    const cvPath = path.join(__dirname, 'fixtures', 'test.md')
    const res = await request(app)
      .post('/api/review-cv')
      .attach('cv', cvPath)
      .field('job_description', 'A test job description')
    expect(res.statusCode).toEqual(400)
    expect(res.body).toHaveProperty('error', 'Invalid file type')
  })
})
