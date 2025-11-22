import axios from 'axios';
import { extractTextFromUrl } from '../extract';
import { buildPrompt } from '../prompt';
import { callLLM, parseLLMJson, validateResumeStructure } from '../llm';
import { logger } from '../logger';

async function processCV(job_id: string, file_url: string, user_id: string, job_description: string) {
    try {
        logger({ type: 'info', message: `Starting AI processing for Job ${job_id}` });
        const extractedText = await extractTextFromUrl(file_url);
        const prompt = buildPrompt(job_description, extractedText);
        const llmResponse = await callLLM(prompt, {} as any);
        const parsedResponse = await parseLLMJson(llmResponse);
        validateResumeStructure(parsedResponse);
        logger({ type: 'info', message: `AI processing completed for Job ${job_id}` });
        sendWebhookToService(job_id, parsedResponse, 'completed');
    } catch (err: any) {
        logger({ type: 'error', message: `AI Failed for Job ${job_id}`, error: err.message });
        sendWebhookToService(job_id, { error: err.message }, 'failed');
    }
}

async function sendWebhookToService(jobId: string, data: any, status: string) {
    try {
        await axios.post(process.env.WEBHOOK_URL || '', {
            job_id: jobId,
            result: data,
            status: status
        }, {
            headers: {
                'X-Internal-Secret': process.env.NODE_SERVICE_SECRET
            }
        });
        logger({ type: 'info', message: `Webhook sent for Job ${jobId}` });
    } catch (error: any) {
        logger({ type: 'error', message: "Failed to send webhook", error: error.message });
    }
}

export { processCV };
