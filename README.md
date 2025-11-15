# Resume Review Service

AI-powered resume analysis service that evaluates candidate resumes against job descriptions using Gemini AI.

## Features

- **Multi-format support**: PDF, DOCX, and TXT files (up to 10MB)
- **Structured analysis**: Returns JSON with detailed scores, evidence, strengths/weaknesses, and tailored interview questions
- **Gemini 2.5 Pro integration**: Uses latest Gemini AI model for intelligent resume evaluation
- **Robust parsing**: Handles various response formats with automatic code fence removal
- **Production-ready**: Complete error handling, input validation, and security best practices
- **Development-friendly**: Nodemon integration for hot-reload during development

## Tech Stack

- **Runtime**: Node.js 20.x+ (CommonJS)
- **Framework**: Express 5.1.0
- **File Processing**:
  - `pdf-parse` 2.4.5 - PDF text extraction
  - `mammoth` 1.8.0 - DOCX text extraction
  - `multer` 2.0.2 - File upload handling
- **HTTP Client**: `axios` 1.7.9 - LLM API calls
- **Environment**: `dotenv` 17.2.3 - Environment variable management
- **AI Model**: Google Gemini 2.5 Pro
- **Testing**: Jest 29.7.0
- **Development**: Nodemon 3.1.11 - Auto-reload on file changes

## Prerequisites

- Node.js 20.x or higher (recommended)
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and add your credentials:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
PORT=3000
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent
GEMINI_API_KEY=your_actual_api_key_here
MAX_FILE_SIZE_MB=10
NODE_ENV=development
```

**Important**: Keep your `GEMINI_API_KEY` secure. Never commit it to version control.

### 3. Start the Server

**Production:**

```bash
npm start
```

**Development (with auto-reload using nodemon):**

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Usage

### Endpoint

```
POST /api/review-cv
```

### Request Format

- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `cv` (file, required): Resume file (.pdf, .docx, or .txt, max 10MB)
  - `job_description` (text, required): Job description text

### Example with cURL

```bash
curl -X POST http://localhost:3000/api/review-cv \
  -F "cv=@./path/to/resume.pdf" \
  -F "job_description=We are seeking a Senior Backend Engineer with 5+ years of Node.js experience..."
```

### Example with JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append("cv", fileInput.files[0]);
formData.append("job_description", jobDescriptionText);

const response = await fetch("http://localhost:3000/api/review-cv", {
  method: "POST",
  body: formData,
});

const result = await response.json();
console.log("Overall Match:", result.scores.overall_match);
```

### Response Format

**Success (200)**:

```json
{
  "candidate": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-0100",
    "location": "San Francisco, CA",
    "linkedin": "linkedin.com/in/johndoe",
    "github": "github.com/johndoe",
    "website": "johndoe.dev"
  },
  "evidence": {
    "skills_found": ["Node.js", "Express", "PostgreSQL", "Docker"],
    "experience_highlights": [
      "5 years backend development",
      "Led team of 4 engineers"
    ],
    "education_details": ["B.S. Computer Science, Stanford University"],
    "certifications": ["AWS Certified Solutions Architect"]
  },
  "scores": {
    "technical_match": 85,
    "experience_match": 78,
    "education_match": 90,
    "overall_match": 82
  },
  "review": {
    "strengths": [
      "Strong technical skills matching job requirements",
      "Proven leadership experience",
      "Excellent educational background"
    ],
    "weaknesses": [
      "Limited experience with Kubernetes",
      "No mention of microservices architecture"
    ],
    "summary": "Strong candidate with solid technical background and relevant experience. Some gaps in modern cloud-native technologies."
  },
  "suggested_interview_questions": [
    "Can you describe your experience scaling Node.js applications?",
    "How have you handled database optimization in production?",
    "Tell me about a time you led a technical decision that didn't go as planned."
  ],
  "metadata": {
    "flags": ["employment_gap"],
    "recommendation": "yes",
    "parser_version": "1.0.0",
    "processing_time_ms": 3542
  }
}
```

**Error Responses**:

- `400 Bad Request`: Missing or invalid input (file type, missing fields)
- `422 Unprocessable Entity`: Can't extract text from resume (corrupted file, scanned PDF without OCR)
- `502 Bad Gateway`: LLM API failure or invalid JSON response
- `500 Internal Server Error`: Unexpected server error

## Scoring System

The service uses a weighted scoring model:

- **Technical Match (45%)**: Skills, tools, technologies alignment
- **Experience Match (35%)**: Years of experience, role relevance, domain knowledge
- **Education Match (10%)**: Degree requirements, field of study
- **Overall Match (10%)**: Culture fit, soft skills, career trajectory

All scores are integers from 0-100.

## Running Tests

```bash
npm test
```

For watch mode during development:

```bash
npm run test:watch
```

## Project Structure

```
.
├── server.js                 # Express app entry point
├── routes/
│   └── review.js            # Main review endpoint
├── lib/
│   ├── extract.js           # Text extraction (PDF, DOCX, TXT)
│   ├── prompt.js            # LLM prompt template
│   └── llm.js               # LLM API calls and JSON parsing
├── tests/
│   ├── extract.test.js      # Text extraction tests
│   └── parse.test.js        # JSON parsing tests
├── uploads/                 # Temporary file storage (auto-cleaned)
├── package.json
├── .env.example
└── README.md
```

## Configuration Notes

### Gemini API Configuration

The service uses Gemini 2.5 Pro with the following settings:

- **Temperature**: 0.0 (deterministic output for consistent parsing)
- **Max Output Tokens**: 8192
- **Timeout**: 60 seconds
- **Authentication**: API key as query parameter

To use a different Gemini model, update `GEMINI_ENDPOINT` in `.env`:

```env
# For Gemini 2.0 Flash (faster, cheaper)
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent

# For Gemini 2.5 Pro (more accurate)
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent
```

### Token Limits

- Current configuration: 8192 max output tokens (sufficient for detailed resume analysis)
- Input context: Handles resumes up to 5-7 pages comfortably
- If you encounter truncation with very long resumes, consider implementing chunking or summarization

### File Size Limits

Default: 10MB per file. Adjust in `.env`:

```env
MAX_FILE_SIZE_MB=20
```

## Security & Privacy Considerations

### API Key Security

- Store `GEMINI_API_KEY` in environment variables, never in code
- Use secret management services (AWS Secrets Manager, Azure Key Vault) in production
- Rotate keys regularly

### PII Handling

Resumes contain Personally Identifiable Information (PII):

- **Logging**: Current implementation logs only file metadata, not content
- **Storage**: Files are deleted immediately after processing
- **Compliance**: Ensure GDPR/CCPA compliance if storing results
- **Redaction**: Consider redacting PII before logging errors in production

### Input Validation

- File type restrictions prevent code execution
- File size limits prevent DoS attacks
- Content validation prevents injection attacks

## Production Deployment Recommendations

### Scalability

For high-volume usage, consider:

1. **Queue System**: Use Redis/RabbitMQ to queue requests
2. **Worker Processes**: Separate API and processing workers
3. **Caching**: Cache LLM responses for identical inputs (with TTL)
4. **Rate Limiting**: Implement per-user/IP rate limits

### Monitoring

Add observability:

- Request/response logging (without PII)
- Performance metrics (processing time, file size)
- Error tracking (Sentry, Datadog)
- LLM API usage monitoring

### Error Recovery

- Implement retry logic for transient LLM API failures
- Use exponential backoff for rate-limited requests
- Store failed requests for manual review

### Cost Optimization

- Set token limits based on use case
- Consider cheaper models for initial screening
- Batch processing for non-urgent reviews

## Troubleshooting

### "LLM API call failed"

- Check `GEMINI_ENDPOINT` is correct
- Verify `GEMINI_API_KEY` is valid
- Ensure network connectivity to API endpoint
- Check API quota/rate limits

### "Failed to extract text from resume"

- PDF may be scanned image without OCR
- File may be corrupted
- Try converting file to different format

### "Failed to parse LLM response"

- LLM may not be following JSON schema consistently
- Try adjusting temperature (currently 0.0)
- Check `llm_raw` field in error response for debugging
- Consider refining prompt template

## License

MIT

## Support

For issues or questions, please check:

- API endpoint documentation for your LLM provider
- Node.js and package documentation
- Error messages in response body (development mode)
