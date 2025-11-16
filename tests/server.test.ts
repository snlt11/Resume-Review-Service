import request from 'supertest'
import app from '../server'
import { promises as fs } from 'fs'
import path from 'path'

describe('API Endpoints', () => {
  it('should return a 200 for the health check', async () => {
    const res = await request(app).get('/health')
    expect(res.statusCode).toEqual(200)
    expect(res.body).toHaveProperty('status', 'ok')
  })

  it('should return a 404 for a route that does not exist', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.statusCode).toEqual(404)
    expect(res.body).toHaveProperty('error', 'Route not found')
  })
})
