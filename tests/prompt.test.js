const { buildPrompt } = require('../lib/prompt')

describe('Prompt Building', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
  })

  afterAll(() => {
    process.env = originalEnv
  })

  test('should include CV improvement suggestions when enabled', () => {
    process.env.CV_IMPROVEMENT_SUGGESTIONS_ENABLED = 'true'
    const prompt = buildPrompt('job desc', 'resume text')
    expect(prompt).toContain('cv_improvement_suggestions')
    expect(prompt).toContain('CV IMPROVEMENT GUIDANCE')
  })

  test('should not include CV improvement suggestions when disabled', () => {
    process.env.CV_IMPROVEMENT_SUGGESTIONS_ENABLED = 'false'
    const prompt = buildPrompt('job desc', 'resume text')
    expect(prompt).not.toContain('cv_improvement_suggestions')
    expect(prompt).not.toContain('CV IMPROVEMENT GUIDANCE')
  })
})
