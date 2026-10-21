import { callSumopodChat, parseJsonLenient, readJsonBody } from './_lib/sumopod.js';
import {
  createRateLimiter,
  ensureMethod,
  parseLimitedString,
  sendNoStore,
  toSafeErrorResponse,
} from './_lib/requestGuards.js';
import { isOutOfScopeRequest } from './_lib/assistantScope.js';
import { getGithubProfileData } from './_lib/github.js';
import {
  README_SYSTEM_PROMPT,
  buildReadmeUserMessage,
  parseReadmeAnswer,
  readmeRefusal,
  sanitizeReadmeContext,
  summarizeProfile,
} from './_lib/readmeAssistant.js';

const USERNAME_PATTERN = /^[a-zA-Z0-9-]{1,39}$/;
// Short, so a slow GitHub still leaves the model call its own time budget.
const PROFILE_TIMEOUT_MS = 5000;

// The real numbers behind a stats recommendation. Best effort: any failure
// (bad token, unknown user, timeout) just means the model works without them.
const loadProfileSummary = async (username) => {
  if (!USERNAME_PATTERN.test(username)) return null;
  try {
    return summarizeProfile(await getGithubProfileData(username, { timeoutMs: PROFILE_TIMEOUT_MS }));
  } catch {
    return null;
  }
};

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
    const focus = body?.focus === 'stats' ? 'stats' : '';

    // Obvious out-of-scope work never reaches the model.
    if (isOutOfScopeRequest(request)) {
      return res.status(200).json({
        refused: true,
        message: readmeRefusal(request),
        taglines: [],
        bio: [],
        skills: [],
        stats: null,
        meta: { provider: 'scope-guard' },
      });
    }

    // Only the stats helper needs the profile; the other asks skip the GitHub call.
    const profile = focus === 'stats' ? await loadProfileSummary(context.username) : null;

    const { assistantText, model } = await callSumopodChat({
      messages: [
        { role: 'system', content: README_SYSTEM_PROMPT },
        { role: 'user', content: buildReadmeUserMessage({ request, context: { ...context, focus }, profile }) },
      ],
      temperature: 0.6,
      maxTokens: 700,
    });

    return res.status(200).json({
      ...parseReadmeAnswer(assistantText, parseJsonLenient, request, '', {
        repoNames: profile?.topRepos.map((repo) => repo.name) || [],
      }),
      meta: { provider: 'sumopod', model, profile: Boolean(profile) },
    });
  } catch (error) {
    const safeError = toSafeErrorResponse(error);
    return res.status(safeError.status).json(safeError.body);
  }
}
