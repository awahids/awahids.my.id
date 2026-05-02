import { callSumopodChat, readJsonBody } from './_lib/sumopod.js';
import { CV_FAQ_CONTEXT } from './_lib/cvFaqContext.js';
import {
  createRateLimiter,
  ensureMethod,
  sendNoStore,
  toSafeErrorResponse,
  validateFaqBody,
} from './_lib/requestGuards.js';
import { sendN8nEventSafe } from './_lib/n8n.js';

const FAQ_SYSTEM_PROMPT = `You are the AI FAQ assistant for A Wahid Safhadi portfolio.

- First, try to answer based on the CV context provided below.
- If the question is about Wahid's specific experience, pricing, or personal details not found in the CV context, politely say that you don't have that specific information.
- If the question is a general question (e.g., about technology, programming, tools, or general knowledge), feel free to answer using your own knowledge and research capabilities.
- Keep answers concise and practical (2-5 sentences).
- Write naturally, like a real human conversation, not like CV bullet points.
- Paraphrase facts from CV into flowing sentences, but **always use the exact role titles** (e.g., Senior IT Developer, Backend Developer) when discussing work experience. Do not generalize the titles.
- Use first-person voice ("I" or "saya"/"aku") when relevant (only when talking about Wahid's experience).
- CRITICAL: You must reply in the EXACT same language the user is using in their latest question. If the user asks in Indonesian, your entire reply MUST be in Indonesian. If the user asks in English, reply in English.
- When replying in Indonesian, keep the tone casual, friendly, and professional (santai tapi tetap sopan). Do not be overly formal or stiff. Use everyday professional Indonesian words (e.g., "bisa", "buat", "dipakai", "kalau", "aku") instead of formal ones (like "merupakan", "adalah", "saya").
- Use bullet list only when user explicitly asks for list.
- Do not mix Indonesian and English in one answer unless user does it first.

CV Context:
${CV_FAQ_CONTEXT}`;

const buildFaqPrompt = (question, languageHint = '') => {
  const resolvedLanguageHint =
    languageHint === 'id'
      ? 'Bahasa Indonesia'
      : languageHint === 'en'
        ? 'English'
        : 'same language as the question';

  return `Question:\n${question}\n\nLanguage to use: ${resolvedLanguageHint}\n\nReturn the best answer grounded in the CV context. Make it natural and conversational while staying factual.`;
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return fallback;
};

const FAQ_RATE_WINDOW_MS = toPositiveInt(process.env.AI_FAQ_RATE_WINDOW_MS, 60 * 1000);
const FAQ_RATE_MAX = toPositiveInt(process.env.AI_FAQ_RATE_MAX, 20);
const FAQ_EVENT_QUESTION_PREVIEW_LENGTH = 220;

const truncate = (value, maxLength) => {
  const text = String(value || '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

const limitFaqRequests = createRateLimiter({
  keyPrefix: 'ai-faq',
  windowMs: FAQ_RATE_WINDOW_MS,
  maxRequests: FAQ_RATE_MAX,
});

export default async function handler(req, res) {
  if (!ensureMethod(req, res, 'POST')) return;
  if (!limitFaqRequests(req, res)) return;
  sendNoStore(res);

  const startedAt = Date.now();
  const relayContext = {
    source: '',
    submittedAt: '',
    languageHint: '',
    question: '',
  };

  try {
    const body = readJsonBody(req);
    const { question, history, languageHint, source, submittedAt } = validateFaqBody(body);
    relayContext.source = source;
    relayContext.submittedAt = submittedAt;
    relayContext.languageHint = languageHint;
    relayContext.question = question;

    const apiMessages = [
      {
        role: 'system',
        content: FAQ_SYSTEM_PROMPT,
      },
      ...(history || []),
      {
        role: 'user',
        content: buildFaqPrompt(question, languageHint),
      },
    ];

    const { assistantText, model } = await callSumopodChat({
      messages: apiMessages,
      temperature: 0.2,
      maxTokens: 420,
    });

    await sendN8nEventSafe({
      req,
      route: '/api/ai-faq',
      eventType: 'portfolio.faq.success',
      outcome: 'success',
      payload: {
        source,
        submittedAt,
        languageHint: languageHint || 'auto',
        questionPreview: truncate(question, FAQ_EVENT_QUESTION_PREVIEW_LENGTH),
        questionLength: question.length,
        answerLength: assistantText.length,
        provider: 'sumopod',
        model,
        latencyMs: Date.now() - startedAt,
      },
    });

    return res.status(200).json({
      answer: assistantText,
      meta: {
        provider: 'sumopod',
        model,
      },
    });
  } catch (error) {
    const safeError = toSafeErrorResponse(error);
    await sendN8nEventSafe({
      req,
      route: '/api/ai-faq',
      eventType: 'portfolio.faq.failed',
      outcome: 'error',
      payload: {
        source: relayContext.source,
        submittedAt: relayContext.submittedAt,
        languageHint: relayContext.languageHint || 'auto',
        questionPreview: truncate(relayContext.question, FAQ_EVENT_QUESTION_PREVIEW_LENGTH),
        questionLength: relayContext.question.length,
        errorCode: safeError.body.code,
        errorMessage: safeError.body.error,
        status: safeError.status,
        latencyMs: Date.now() - startedAt,
      },
    });
    return res.status(safeError.status).json(safeError.body);
  }
}
