const axios = require('axios')

/**
 * Call LLM API with the constructed prompt
 * Uses environment variables for endpoint and API key
 * @param {string} prompt - Complete prompt text
 * @returns {Promise<string>} - Raw LLM response text
 * @throws {Error} - If API call fails
 */
async function callLLM(prompt) {
  const endpoint = process.env.GEMINI_ENDPOINT
  const apiKey = process.env.GEMINI_API_KEY

  if (!endpoint || !apiKey) {
    throw new Error(
      'GEMINI_ENDPOINT and GEMINI_API_KEY must be configured in environment'
    )
  }

  const temperature = parseFloat(process.env.LLM_TEMPERATURE || '0.1')
  const maxOutputTokens = parseInt(
    process.env.LLM_MAX_OUTPUT_TOKENS || '16384',
    10
  )
  const timeout = parseInt(process.env.LLM_TIMEOUT_MS || '120000', 10)

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
      candidateCount: 1,
      maxOutputTokens,
    },
  }

  try {
    const urlWithKey = `${endpoint}?key=${apiKey}`

    const response = await axios.post(urlWithKey, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout,
    })

    const responseText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (!responseText) {
      throw new Error('LLM returned empty response')
    }

    return responseText
  } catch (error) {
    if (error.response) {
      const status = error.response.status
      const message =
        error.response.data?.error?.message || error.response.statusText
      throw new Error(`LLM API error (${status}): ${message}`)
    } else if (error.request) {
      throw new Error(`LLM API timeout or network error: ${error.message}`)
    } else {
      throw new Error(`LLM request failed: ${error.message}`)
    }
  }
}

/**
 * Parse LLM response into JSON, handling various response formats
 * Strips code fences and attempts multiple parsing strategies
 * @param {string} rawResponse - Raw text from LLM
 * @returns {Object} - Parsed JSON object
 * @throws {Error} - If parsing fails after all attempts
 */
function parseLLMJson(rawResponse) {
  let cleanedResponse = rawResponse.trim()

  if (cleanedResponse.startsWith('```')) {
    const firstNewline = cleanedResponse.indexOf('\n')
    const closingFence = cleanedResponse.indexOf('```', 3)

    if (firstNewline !== -1) {
      cleanedResponse =
        closingFence > firstNewline
          ? cleanedResponse.substring(firstNewline + 1, closingFence).trim()
          : cleanedResponse.substring(firstNewline + 1).trim()
    }
  }

  try {
    return JSON.parse(cleanedResponse)
  } catch (error) {
    throw new Error(`Failed to parse LLM JSON response: ${error.message}`)
  }
}

/**
 * Validate that parsed JSON contains expected resume review structure
 * @param {Object} parsed - Parsed JSON object
 * @returns {boolean} - True if valid structure
 */
function validateResumeStructure(parsed) {
  const baseRequiredFields = [
    'candidate',
    'evidence',
    'scores',
    'review',
    'suggested_interview_questions',
    'metadata',
  ]

  const includeSuggestions =
    process.env.CV_IMPROVEMENT_SUGGESTIONS_ENABLED === 'true'
  const requiredFields = includeSuggestions
    ? [
        ...baseRequiredFields.slice(0, 4),
        'cv_improvement_suggestions',
        ...baseRequiredFields.slice(4),
      ]
    : baseRequiredFields

  for (const field of requiredFields) {
    if (!(field in parsed)) {
      return false
    }
  }

  if (!parsed.scores || typeof parsed.scores.overall_match !== 'number') {
    return false
  }

  return true
}

module.exports = {
  callLLM,
  parseLLMJson,
  validateResumeStructure,
}
