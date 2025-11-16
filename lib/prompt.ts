import { readFileSync } from 'fs'
import path from 'path'

function loadPromptTemplate(filename: string): string {
  try {
    return readFileSync(path.join(__dirname, '../prompts/', filename), 'utf-8')
  } catch (error: any) {
    throw new Error(`Failed to load prompt template: ${error.message}`)
  }
}

const basePrompt = loadPromptTemplate('base-prompt.md')
const cvImprovementGuidance = loadPromptTemplate('cv-improvement-guidance.md')
const cvImprovementSchema = loadPromptTemplate('cv-improvement-schema.txt')
const atsReadinessFields = readFileSync(
  path.join(__dirname, '../prompts/ats-readiness-fields.txt'),
  'utf-8'
)

/**
 * Build the complete prompt by injecting job description and resume text
 * @param {string} jobDescription - The job description text
 * @param {string} resumeText - The extracted resume text
 * @returns {string} - Complete prompt ready for LLM
 */
function buildPrompt(jobDescription: string, resumeText: string): string {
  let prompt = basePrompt
    .replace('{{JOB_DESCRIPTION}}', jobDescription)
    .replace('{{RESUME_TEXT}}', resumeText)

  const includeSuggestions =
    process.env.CV_IMPROVEMENT_SUGGESTIONS_ENABLED === 'true'

  if (includeSuggestions) {
    prompt = prompt
      .replace('{{CV_IMPROVEMENT_GUIDANCE}}', cvImprovementGuidance)
      .replace('{{CV_IMPROVEMENT_SECTION}}', cvImprovementSchema)
  } else {
    prompt = prompt
      .replace('{{CV_IMPROVEMENT_GUIDANCE}}', '')
      .replace('{{CV_IMPROVEMENT_SECTION}}', '')
  }

  prompt = prompt.replace('{{ATS_READINESS_FIELDS}}', atsReadinessFields)

  return prompt
}

export { buildPrompt }
