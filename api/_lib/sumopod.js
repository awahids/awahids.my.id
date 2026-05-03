const DEFAULT_BASE_URL = 'https://ai.sumopod.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_TIMEOUT_MS = 12_000;

const ensureNoTrailingSlash = (value) => value.replace(/\/$/, '');

const normalizeModelList = (models) =>
  models
    .map((model) => String(model || '').trim())
    .filter(Boolean);

const parseModelList = (value) => {
  const rawValue = String(value || '').trim();
  if (!rawValue) return [DEFAULT_MODEL];

  if (rawValue.startsWith('[')) {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        const models = normalizeModelList(parsed);
        if (models.length > 0) return models;
      }
    } catch {
      // Fall through to comma/plain string parsing for more forgiving env input.
    }
  }

  const models = normalizeModelList(rawValue.split(','));
  return models.length > 0 ? models : [DEFAULT_MODEL];
};

const pickRandomModel = (models) => models[Math.floor(Math.random() * models.length)];

const createServiceError = ({
  status = 500,
  code = 'INTERNAL_ERROR',
  message = 'Service request failed',
  publicMessage = 'Something went wrong. Please try again.',
  model,
}) =>
  Object.assign(new Error(message), {
    name: 'ServiceError',
    status,
    code,
    publicMessage,
    provider: 'sumopod',
    model,
  });

const extractAssistantText = (payload) => {
  const choice = payload?.choices?.[0];
  const content = choice?.message?.content;

  if (typeof content === 'string') return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item.text === 'string') return item.text;
        return '';
      })
      .join('')
      .trim();
  }

  return '';
};

const stripCodeFence = (text) =>
  text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

export const parseJsonLenient = (text) => {
  const sanitized = stripCodeFence(text);

  try {
    return JSON.parse(sanitized);
  } catch {
    const objectMatch = sanitized.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      return JSON.parse(objectMatch[0]);
    }

    throw new Error('Model response is not valid JSON');
  }
};

export const getSumopodConfig = () => {
  const apiKey = process.env.SUMOPOD_API_KEY;
  const baseURL = ensureNoTrailingSlash(process.env.SUMOPOD_BASE_URL || DEFAULT_BASE_URL);
  const models = parseModelList(process.env.SUMOPOD_MODEL || DEFAULT_MODEL);
  const model = pickRandomModel(models);
  const timeoutMs = Number(process.env.SUMOPOD_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);

  return {
    apiKey,
    baseURL,
    model,
    models,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS,
  };
};

export const callSumopodChat = async ({ messages, temperature = 0.2, maxTokens = 800 }) => {
  const { apiKey, baseURL, model, timeoutMs } = getSumopodConfig();

  if (!apiKey) {
    throw createServiceError({
      status: 500,
      code: 'AI_CONFIG_MISSING',
      message: 'SUMOPOD_API_KEY is missing',
      publicMessage: 'AI service is not configured.',
      model,
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw createServiceError({
        status: 504,
        code: 'AI_TIMEOUT',
        message: `SumoPod request timed out after ${timeoutMs}ms`,
        publicMessage: 'AI provider timeout. Please try again.',
        model,
      });
    }

    throw createServiceError({
      status: 502,
      code: 'AI_UPSTREAM_ERROR',
      message: `SumoPod request failed: ${error instanceof Error ? error.message : String(error)}`,
      publicMessage: 'AI provider is unavailable right now.',
      model,
    });
  } finally {
    clearTimeout(timeout);
  }

  const rawBody = await response.text();

  if (!response.ok) {
    throw createServiceError({
      status: 502,
      code: 'AI_UPSTREAM_ERROR',
      message: `SumoPod request failed with status ${response.status}`,
      publicMessage: 'AI provider is unavailable right now.',
      model,
    });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw createServiceError({
      status: 502,
      code: 'AI_BAD_RESPONSE',
      message: 'SumoPod returned non-JSON response',
      publicMessage: 'AI provider returned an invalid response.',
      model,
    });
  }

  const assistantText = extractAssistantText(payload);

  if (!assistantText) {
    throw createServiceError({
      status: 502,
      code: 'AI_EMPTY_RESPONSE',
      message: 'SumoPod response did not include assistant content',
      publicMessage: 'AI provider returned an empty response.',
      model,
    });
  }

  return {
    assistantText,
    payload,
    model,
  };
};

export const readJsonBody = (req) => {
  const body = req.body;

  if (!body) return {};
  if (typeof body === 'object') return body;

  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
};
