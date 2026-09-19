import { callSumopodChat, readJsonBody } from './_lib/sumopod.js';
import { createRateLimiter, ensureMethod, sendNoStore, toSafeErrorResponse } from './_lib/requestGuards.js';
import { hasInjectionAttempt } from './_lib/assistantScope.js';
import {
  PRD_QUESTIONS_SYSTEM_PROMPT,
  buildQuestionsUserMessage,
  parsePrdQuestions,
  sanitizePrdRequest,
} from './_lib/prdAssistant.js';
import { consumePrdQuota } from './_lib/prdQuota.js';

const limitRequests = createRateLimiter({
  keyPrefix: 'prd-questions',
  windowMs: 60_000,
  maxRequests: 5,
});

export default async function handler(req, res) {
  if (!ensureMethod(req, res, 'POST')) return;
  if (!limitRequests(req, res)) return;
  sendNoStore(res);

  try {
    const { description, projectName } = sanitizePrdRequest(readJsonBody(req));

    if (hasInjectionAttempt(description)) {
      return res.status(400).json({ error: 'Deskripsi tidak bisa diproses', code: 'INVALID_INPUT' });
    }

    const quota = await consumePrdQuota(req);
    if (!quota.allowed) {
      return res.status(429).json({
        error: 'Jatah generate hari ini sudah habis, coba lagi besok',
        code: 'QUOTA_EXCEEDED',
      });
    }

    const { assistantText, model } = await callSumopodChat({
      messages: [
        { role: 'system', content: PRD_QUESTIONS_SYSTEM_PROMPT },
        { role: 'user', content: buildQuestionsUserMessage({ description, projectName }) },
      ],
      temperature: 0.4,
      maxTokens: 500,
    });

    return res.status(200).json({
      ...parsePrdQuestions(assistantText),
      meta: { provider: 'sumopod', model, remaining: quota.remaining },
    });
  } catch (error) {
    const safeError = toSafeErrorResponse(error);
    return res.status(safeError.status).json(safeError.body);
  }
}
