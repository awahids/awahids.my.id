/**
 * AI Assistant API - Hermes Integration
 * Endpoint: /api/ai-assistant
 * 
 * Routes chat requests to Hermes via n8n webhook
 * Falls back to SumoPod if Hermes is unavailable
 */

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

const getHermesConfig = () => {
  const timeoutMs = parseInt(process.env.HERMES_TIMEOUT_MS || '30000', 10);

  return {
    enabled: process.env.HERMES_WEBHOOK_ENABLED !== 'false',
    webhookUrl: process.env.HERMES_WEBHOOK_URL || '',
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 30000,
    allowSumopodFallback: process.env.AI_ASSISTANT_ALLOW_SUMOPOD_FALLBACK === 'true',
  };
};

const createAssistantError = ({
  status = 500,
  code = 'AI_ASSISTANT_ERROR',
  message,
  publicMessage,
  cause,
}) =>
  Object.assign(new Error(message, cause ? { cause } : undefined), {
    status,
    code,
    publicMessage: publicMessage || message,
  });

// System prompt for Hermes
const HERMES_SYSTEM_PROMPT = `Kamu adalah AI Assistant untuk portfolio website A Wahid Safhadi (awahids.my.id).
Kamu membantu menjawab pertanyaan tentang background, pengalaman, dan skills Wahid.

## INSTRUKSI PENTING:
1. Jawab berdasarkan data CV di bawah ini
2. Jika informasi tidak ada, katakan "Maaf, saya tidak memiliki informasi tersebut"
3. Gunakan bahasa sesuai pertanyaan user (Indonesia/English)
4. Tone: professional, helpful, friendly
5. Jawaban singkat dan to the point (2-5 kalimat)

## DATA PROFIL:
${CV_FAQ_CONTEXT}`;

// Rate limiter
const ASSISTANT_RATE_WINDOW_MS = parseInt(process.env.AI_ASSISTANT_RATE_WINDOW_MS || '60000', 10);
const ASSISTANT_RATE_MAX = parseInt(process.env.AI_ASSISTANT_RATE_MAX || '10', 10);

const limitAssistantRequests = createRateLimiter({
  keyPrefix: 'ai-assistant',
  windowMs: ASSISTANT_RATE_WINDOW_MS,
  maxRequests: ASSISTANT_RATE_MAX,
});

// Helper: Send request to Hermes via n8n webhook
async function callHermesWebhook({ message, history = [], context = {} }) {
  const { webhookUrl, timeoutMs } = getHermesConfig();

  if (!webhookUrl) {
    throw new Error('HERMES_WEBHOOK_URL not configured');
  }

  const payload = {
    message,
    history: history.slice(-10), // Last 10 messages
    context: {
      ...context,
      source: 'portfolio-ai-assistant',
      timestamp: new Date().toISOString(),
    },
    systemPrompt: HERMES_SYSTEM_PROMPT,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hermes webhook failed: ${response.status} - ${errorText}`);
    }

    const rawBody = await response.text();
    if (!rawBody.trim()) {
      throw createAssistantError({
        status: 502,
        code: 'HERMES_EMPTY_RESPONSE',
        message: 'Hermes webhook returned an empty response',
        publicMessage: 'Hermes returned an empty response.',
      });
    }

    let data;
    try {
      data = JSON.parse(rawBody);
    } catch (error) {
      throw createAssistantError({
        status: 502,
        code: 'HERMES_BAD_RESPONSE',
        message: 'Hermes webhook returned non-JSON response',
        publicMessage: 'Hermes returned an invalid response.',
        cause: error,
      });
    }

    const assistantText = data.response || data.answer || data.message;
    if (!assistantText) {
      throw createAssistantError({
        status: 502,
        code: 'HERMES_EMPTY_ANSWER',
        message: 'Hermes webhook response did not include response, answer, or message',
        publicMessage: 'Hermes returned an empty answer.',
      });
    }

    return {
      response: assistantText,
      model: data.model || data.model_used || 'hermes',
      metadata: data.metadata || {},
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error(`Hermes request timed out after ${timeoutMs}ms`, { cause: error });
    }
    throw error;
  }
}

// Helper: Fallback to SumoPod
async function callSumopodWithContext({ message, history = [] }) {
  const messages = [
    {
      role: 'system',
      content: HERMES_SYSTEM_PROMPT,
    },
    ...history.map(h => ({
      role: h.role,
      content: h.content || h.text,
    })),
    {
      role: 'user',
      content: message,
    },
  ];

  const result = await callSumopodChat({
    messages,
    temperature: 0.2,
    maxTokens: 500,
  });

  return {
    response: result.assistantText,
    model: result.model || 'gpt-4o-mini',
    metadata: {},
  };
}

// Main handler
export default async function handler(req, res) {
  if (!ensureMethod(req, res, 'POST')) return;
  if (!limitAssistantRequests(req, res)) return;
  sendNoStore(res);

  const startedAt = Date.now();
  let usedProvider = 'unknown';

  try {
    const body = readJsonBody(req);
    const { question, history, languageHint, source, submittedAt } = validateFaqBody(body);

    // Build context for Hermes
    const context = {
      language: languageHint || 'auto',
      source: source || 'portfolio-ai-assistant',
      userIntent: 'portfolio-faq',
    };

    let result;
    const hermesConfig = getHermesConfig();

    if (!hermesConfig.enabled) {
      throw createAssistantError({
        status: 503,
        code: 'HERMES_DISABLED',
        message: 'Hermes assistant is disabled by HERMES_WEBHOOK_ENABLED=false',
        publicMessage: 'Hermes assistant is disabled.',
      });
    }

    if (!hermesConfig.webhookUrl) {
      throw createAssistantError({
        status: 500,
        code: 'HERMES_CONFIG_MISSING',
        message: 'HERMES_WEBHOOK_URL is missing',
        publicMessage: 'Hermes assistant is not configured.',
      });
    }

    try {
      result = await callHermesWebhook({
        message: question,
        history: history || [],
        context,
      });
      usedProvider = 'hermes';
    } catch (hermesError) {
      if (!hermesConfig.allowSumopodFallback) {
        throw hermesError;
      }

      console.error('Hermes error, falling back to SumoPod:', hermesError.message);
      result = await callSumopodWithContext({
        message: question,
        history: history || [],
      });
      usedProvider = 'sumopod-fallback';
    }

    const latencyMs = Date.now() - startedAt;

    // Send event to n8n for logging
    await sendN8nEventSafe({
      req,
      route: '/api/ai-assistant',
      eventType: 'portfolio.ai-assistant.success',
      outcome: 'success',
      payload: {
        source,
        submittedAt,
        languageHint: languageHint || 'auto',
        questionPreview: question.slice(0, 220),
        questionLength: question.length,
        answerLength: result.response.length,
        provider: usedProvider,
        model: result.model,
        latencyMs,
      },
    });

    return res.status(200).json({
      answer: result.response,
      meta: {
        provider: usedProvider,
        model: result.model,
        latencyMs,
      },
    });

  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const safeError = toSafeErrorResponse(error);

    // Send error event to n8n
    await sendN8nEventSafe({
      req,
      route: '/api/ai-assistant',
      eventType: 'portfolio.ai-assistant.failed',
      outcome: 'error',
      payload: {
        source: req.body?.source || 'unknown',
        provider: usedProvider,
        errorCode: safeError.body.code,
        errorMessage: safeError.body.error,
        latencyMs,
      },
    });

    return res.status(safeError.status).json(safeError.body);
  }
}
