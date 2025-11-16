const fs = require('fs').promises
const path = require('path')

const logsDir = path.join(__dirname, '..', 'logs')

async function initialize() {
  try {
    await fs.mkdir(logsDir, { recursive: true })
  } catch (error) {
    console.error('Failed to create log directory:', error)
  }
}

async function logger(data) {
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

module.exports = { logger }
