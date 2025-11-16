const fs = require('fs')
const path = require('path')

/**
 * Load prompt template from markdown file
 */
function loadPromptTemplate(filename) {
  const filePath = path.join(__dirname, '..', 'prompts', filename)
  return fs.readFileSync(filePath, 'utf-8')
}

const BASE_PROMPT_TEMPLATE = loadPromptTemplate('base-prompt.md')
const CV_IMPROVEMENT_GUIDANCE = loadPromptTemplate('cv-improvement-guidance.md')
const CV_IMPROVEMENT_SCHEMA = loadPromptTemplate('cv-improvement-schema.txt')
const ATS_READINESS_FIELDS = loadPromptTemplate('ats-readiness-fields.txt')

/**
 * Build the complete prompt by injecting job description and resume text
 * @param {string} jobDescription - The job description text
 * @param {string} resumeText - The extracted resume text
 * @returns {string} - Complete prompt ready for LLM
 */
function buildPrompt(jobDescription, resumeText) {
  const includeSuggestions =
    process.env.CV_IMPROVEMENT_SUGGESTIONS_ENABLED === 'true'

  const cvImprovementSection = includeSuggestions ? CV_IMPROVEMENT_SCHEMA : ''
  const atsReadinessFields = includeSuggestions ? ATS_READINESS_FIELDS : ''
  const guidanceSection = includeSuggestions ? CV_IMPROVEMENT_GUIDANCE : ''

  return BASE_PROMPT_TEMPLATE.replace(
    '{{CV_IMPROVEMENT_SECTION}}',
    cvImprovementSection
  )
    .replace('{{ATS_READINESS_FIELDS}}', atsReadinessFields)
    .replace('{{CV_IMPROVEMENT_GUIDANCE}}', guidanceSection)
    .replace('{{JOB_DESCRIPTION}}', jobDescription)
    .replace('{{RESUME_TEXT}}', resumeText)
}

module.exports = {
  buildPrompt,
}
