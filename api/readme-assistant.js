import { callSumopodChat, parseJsonLenient, readJsonBody } from './_lib/sumopod.js';
import {
  createRateLimiter,
  ensureMethod,
  parseLimitedString,
  sendNoStore,
  toSafeErrorResponse,
} from './_lib/requestGuards.js';
import { isOutOfScopeRequest } from './_lib/assistantScope.js';
import {
  README_SYSTEM_PROMPT,
  buildReadmeUserMessage,
  parseReadmeAnswer,
  readmeRefusal,
  sanitizeReadmeContext,
} from './_lib/readmeAssistant.js';

const limitRequests = createRateLimiter({
  keyPrefix: 'readme-assistant',
  windowMs: 60_000,
  maxRequests: 10,
});

export default async function handler(req, res) {
  if (!ensureMethod(req, res, 'POST')) return;
  if (!limitRequests(req, res)) return;
  sendNoStore(res);

  try {
    const body = readJsonBody(req);
    const request = parseLimitedString({ value: body?.request, field: 'request', required: true, maxLength: 400 });
    const context = sanitizeReadmeContext(body?.context);

    // Obvious out-of-scope work never reaches the model.
    if (isOutOfScopeRequest(request)) {
      return res.status(200).json({
        refused: true,
        message: readmeRefusal(request),
        taglines: [],
        bio: [],
        skills: [],
        meta: { provider: 'scope-guard' },
      });
    }

    const { assistantText, model } = await callSumopodChat({
      messages: [
        { role: 'system', content: README_SYSTEM_PROMPT },
        { role: 'user', content: buildReadmeUserMessage({ request, context }) },
      ],
      temperature: 0.6,
      maxTokens: 600,
    });

    return res.status(200).json({
      ...parseReadmeAnswer(assistantText, parseJsonLenient, request),
      meta: { provider: 'sumopod', model },
    });
  } catch (error) {
    const safeError = toSafeErrorResponse(error);
    return res.status(safeError.status).json(safeError.body);
  }
}
