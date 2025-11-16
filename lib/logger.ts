import { promises as fs } from 'fs'
import path from 'path'

const logsDir = path.join(__dirname, '..', 'logs')

async function initialize() {
  try {
    await fs.mkdir(logsDir, { recursive: true })
  } catch (error) {
    console.error('Failed to create log directory:', error)
  }
}

interface LogData {
  type: string
  ip?: string
  userAgent?: string
  model?: string
  usage?: unknown
  error?: unknown
  [key: string]: any
}

async function logger(data: LogData): Promise<void> {
  const date = new Date().toISOString().split('T')[0]
  const logFile = path.join(logsDir, `${date}.log`)
  const logEntry = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...data,
  })

  try {
    await fs.appendFile(logFile, logEntry + '\n')
  } catch (error) {
    console.error('Failed to write to log file:', error)
  }
}

initialize()

export { logger }
