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

// Configuration
const HERMES_WEBHOOK_URL = process.env.HERMES_WEBHOOK_URL || '';
const HERMES_WEBHOOK_ENABLED = process.env.HERMES_WEBHOOK_ENABLED === 'true';
const HERMES_TIMEOUT_MS = parseInt(process.env.HERMES_TIMEOUT_MS || '30000', 10);

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
  if (!HERMES_WEBHOOK_URL) {
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
  const timeout = setTimeout(() => controller.abort(), HERMES_TIMEOUT_MS);

  try {
    const response = await fetch(HERMES_WEBHOOK_URL, {
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

    const data = await response.json();
    return {
      response: data.response || data.answer || data.message || 'No response received',
      model: data.model || 'hermes',
      metadata: data.metadata || {},
    };
  } catch (error) {
    clearTimeout(timeout);
    if (error.name === 'AbortError') {
      throw new Error(`Hermes request timed out after ${HERMES_TIMEOUT_MS}ms`);
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
  let success = false;

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

    // Try Hermes first if enabled
    if (HERMES_WEBHOOK_ENABLED && HERMES_WEBHOOK_URL) {
      try {
        result = await callHermesWebhook({
          message: question,
          history: history || [],
          context,
        });
        usedProvider = 'hermes';
        success = true;
      } catch (hermesError) {
        console.error('Hermes error, falling back to SumoPod:', hermesError.message);
        // Fallback to SumoPod
        result = await callSumopodWithContext({
          message: question,
          history: history || [],
        });
        usedProvider = 'sumopod-fallback';
        success = true;
      }
    } else {
      // Use SumoPod directly if Hermes not configured
      result = await callSumopodWithContext({
        message: question,
        history: history || [],
      });
      usedProvider = 'sumopod';
      success = true;
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
EOF
'