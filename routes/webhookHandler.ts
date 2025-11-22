import express, { Request, Response, NextFunction } from 'express'
import { processCV } from '../lib/jobs/cvProcessor'

const router = express.Router()

// Middleware to verify the shared secret
const verifySecret = (req: Request, res: Response, next: NextFunction) => {
  const secret = process.env.NODE_SERVICE_SECRET
  if (req.header('X-Internal-Secret') !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

router.post('/process-cv', verifySecret, (req: Request, res: Response) => {
  const { job_id, file_url, user_id, job_description } = req.body
  res.status(200).json({ message: 'Job received, processing in background' })
  processCV(job_id, file_url, user_id, job_description)
})

export default router
