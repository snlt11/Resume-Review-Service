import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cvRouter from './routes/cv'
import webhookRouter from './routes/webhookHandler'

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.use('/api', cvRouter)
app.use('/api/webhook', webhookRouter)

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' })
})

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // In production, avoid exposing internal error details
  const errorResponse: { error: string; stack?: string } = {
    error: err.message || 'Internal server error',
  }

  // Only include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack
  }

  const statusCode = err.statusCode || 500
  res.status(statusCode).json(errorResponse)
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Resume Review Service running on port ${PORT}`)
})

export default app
