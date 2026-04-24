const DEFAULT_BASE_URL = 'https://ai.sumopod.com/v1';
const DEFAULT_MODEL = 'gpt-4o-mini';

const ensureNoTrailingSlash = (value) => value.replace(/\/$/, '');

const toErrorMessage = (error) => {
  if (error instanceof Error) return error.message;
  return String(error || 'Unknown error');
};

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
  const model = process.env.SUMOPOD_MODEL || DEFAULT_MODEL;

  return {
    apiKey,
    baseURL,
    model,
  };
};

export const callSumopodChat = async ({ messages, temperature = 0.2, maxTokens = 800 }) => {
  const { apiKey, baseURL, model } = getSumopodConfig();

  if (!apiKey) {
    throw new Error('SUMOPOD_API_KEY is missing');
  }

  const response = await fetch(`${baseURL}/chat/completions`, {
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
  });

  const rawBody = await response.text();

  if (!response.ok) {
    throw new Error(`SumoPod request failed (${response.status}): ${rawBody.slice(0, 500)}`);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new Error(`SumoPod returned non-JSON response: ${rawBody.slice(0, 500)}`);
  }

  const assistantText = extractAssistantText(payload);

  if (!assistantText) {
    throw new Error('SumoPod response did not include assistant content');
  }

  return {
    assistantText,
    payload,
    model,
  };
};

export const safeError = (error) => ({
  error: toErrorMessage(error),
});

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
