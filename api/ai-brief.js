import { callSumopodChat, parseJsonLenient, readJsonBody } from './_lib/sumopod.js';
import {
  createRateLimiter,
  ensureMethod,
  sendNoStore,
  toSafeErrorResponse,
  validateBriefBody,
} from './_lib/requestGuards.js';
import { sendN8nEventSafe } from './_lib/n8n.js';

const BRIEF_SYSTEM_PROMPT = `You are a senior software architect focused on backend reliability, automation, and delivery planning.

Requirements:
- Use natural, human phrasing (not stiff template language).
- Ground every recommendation in the user's brief.
- Explicitly reflect every NON-EMPTY input field in the output:
  productType, targetUsers, coreGoals, integrations, timeline, successMetric, constraints.
- If a field is empty, do not fabricate details.
- Keep it practical and implementation-oriented.
- Reply in the language requested by the language hint.
- Return JSON only.`;

const buildBriefPrompt = (brief, languageHint = '') => {
  const details = [
    `Product Type: ${brief.productType || '-'}`,
    `Target Users: ${brief.targetUsers || '-'}`,
    `Core Goals: ${brief.coreGoals || '-'}`,
    `Integrations: ${brief.integrations || '-'}`,
    `Timeline: ${brief.timeline || '-'}`,
    `Success Metric: ${brief.successMetric || '-'}`,
    `Constraints: ${brief.constraints || '-'}`,
  ].join('\n');

  const resolvedLanguageHint =
    languageHint === 'id'
      ? 'Bahasa Indonesia'
      : languageHint === 'en'
        ? 'English'
        : 'same language as the brief';

  return `Analyze this project brief for a backend-first fullstack implementation.\n\n${details}\n\nLanguage to use: ${resolvedLanguageHint}\n\nReturn ONLY JSON with this exact shape:\n{\n  "summary": "string",\n  "effort": "string",\n  "recommendedStack": ["string"],\n  "architecture": ["string"],\n  "milestones": ["string"],\n  "risks": ["string"],\n  "nextActions": ["string"]\n}\n\nRules:\n- summary should sound natural and should reference all non-empty fields.\n- effort should be a short natural judgement sentence.\n- Keep each list concise (3-6 points), concrete, and tied to the input.\n- No markdown, no commentary, JSON only.`;
};

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return fallback;
};

const BRIEF_RATE_WINDOW_MS = toPositiveInt(process.env.AI_BRIEF_RATE_WINDOW_MS, 60 * 1000);
const BRIEF_RATE_MAX = toPositiveInt(process.env.AI_BRIEF_RATE_MAX, 10);
const BRIEF_EVENT_TEXT_PREVIEW_LENGTH = 260;

const truncate = (value, maxLength) => {
  const text = String(value || '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

const limitBriefRequests = createRateLimiter({
  keyPrefix: 'ai-brief',
  windowMs: BRIEF_RATE_WINDOW_MS,
  maxRequests: BRIEF_RATE_MAX,
});

export default async function handler(req, res) {
  if (!ensureMethod(req, res, 'POST')) return;
  if (!limitBriefRequests(req, res)) return;
  sendNoStore(res);

  const startedAt = Date.now();
  const relayContext = {
    source: '',
    submittedAt: '',
    languageHint: '',
    productType: '',
    targetUsers: '',
    coreGoals: '',
    model: '',
  };

  try {
    const body = readJsonBody(req);
    const validatedBody = validateBriefBody(body);
    const {
      source,
      submittedAt,
      languageHint,
      productType,
      targetUsers,
      coreGoals,
      integrations,
      timeline,
      successMetric,
      constraints,
    } = validatedBody;
    relayContext.source = source;
    relayContext.submittedAt = submittedAt;
    relayContext.languageHint = languageHint;
    relayContext.productType = productType;
    relayContext.targetUsers = targetUsers;
    relayContext.coreGoals = coreGoals;

    const { assistantText, model } = await callSumopodChat({
      messages: [
        {
          role: 'system',
          content: BRIEF_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildBriefPrompt(validatedBody, languageHint),
        },
      ],
      temperature: 0.3,
      maxTokens: 1100,
    });
    relayContext.model = model;

    let analysis;
    try {
      analysis = parseJsonLenient(assistantText);
    } catch (error) {
      error.provider = 'sumopod';
      error.model = model;
      throw error;
    }

    await sendN8nEventSafe({
      req,
      route: '/api/ai-brief',
      eventType: 'portfolio.brief.success',
      outcome: 'success',
      payload: {
        source,
        submittedAt,
        languageHint: languageHint || 'auto',
        productType,
        targetUsers,
        coreGoalsPreview: truncate(coreGoals, BRIEF_EVENT_TEXT_PREVIEW_LENGTH),
        integrations,
        timeline,
        successMetric,
        constraintsPreview: truncate(constraints, BRIEF_EVENT_TEXT_PREVIEW_LENGTH),
        analysisSummary: truncate(analysis.summary, BRIEF_EVENT_TEXT_PREVIEW_LENGTH),
        provider: 'sumopod',
        model,
        latencyMs: Date.now() - startedAt,
      },
    });

    return res.status(200).json({
      analysis,
      meta: {
        provider: 'sumopod',
        model,
      },
    });
  } catch (error) {
    const safeError = toSafeErrorResponse(error);
    await sendN8nEventSafe({
      req,
      route: '/api/ai-brief',
      eventType: 'portfolio.brief.failed',
      outcome: 'error',
      payload: {
        source: relayContext.source,
        submittedAt: relayContext.submittedAt,
        languageHint: relayContext.languageHint || 'auto',
        productType: relayContext.productType,
        targetUsers: relayContext.targetUsers,
        coreGoalsPreview: truncate(relayContext.coreGoals, BRIEF_EVENT_TEXT_PREVIEW_LENGTH),
        errorCode: safeError.body.code,
        errorMessage: safeError.body.error,
        provider: safeError.body.meta?.provider,
        model: safeError.body.meta?.model || relayContext.model,
        status: safeError.status,
        latencyMs: Date.now() - startedAt,
      },
    });
    return res.status(safeError.status).json(safeError.body);
  }
}
