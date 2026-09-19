import { callSumopodChat, readJsonBody } from './_lib/sumopod.js';
import { createRateLimiter, ensureMethod, sendNoStore, toSafeErrorResponse } from './_lib/requestGuards.js';
import { hasInjectionAttempt } from './_lib/assistantScope.js';
import {
  PRD_DRAFT_SYSTEM_PROMPT,
  buildDraftUserMessage,
  parsePrdDraft,
  sanitizePrdRequest,
} from './_lib/prdAssistant.js';
import { consumePrdQuota } from './_lib/prdQuota.js';

// Tighter than prd-questions: this is the only expensive call in the feature.
const limitRequests = createRateLimiter({
  keyPrefix: 'prd-draft',
  windowMs: 60_000,
  maxRequests: 3,
});

export default async function handler(req, res) {
  if (!ensureMethod(req, res, 'POST')) return;
  if (!limitRequests(req, res)) return;
  sendNoStore(res);

  try {
    const { description, projectName, answers } = sanitizePrdRequest(readJsonBody(req));

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
        { role: 'system', content: PRD_DRAFT_SYSTEM_PROMPT },
        { role: 'user', content: buildDraftUserMessage({ description, projectName, answers }) },
      ],
      temperature: 0.3,
      maxTokens: 3500,
    });

    return res.status(200).json({
      content: parsePrdDraft(assistantText),
      meta: { provider: 'sumopod', model, remaining: quota.remaining },
    });
  } catch (error) {
    const safeError = toSafeErrorResponse(error);
    return res.status(safeError.status).json(safeError.body);
  }
}
