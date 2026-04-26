const DEFAULT_TIMEOUT_MS = 1_500;

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return fallback;
};

const toBoolean = (value, fallback = false) => {
  if (typeof value === 'boolean') return value;
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return fallback;
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'no') return false;
  return fallback;
};

const getHeaderValue = (req, headerName) => {
  const value = req?.headers?.[headerName];
  if (Array.isArray(value)) return value[0] || '';
  return String(value || '');
};

const getClientIp = (req) => {
  const xForwardedFor = getHeaderValue(req, 'x-forwarded-for');
  if (xForwardedFor) return xForwardedFor.split(',')[0].trim();

  const xRealIp = getHeaderValue(req, 'x-real-ip');
  if (xRealIp) return xRealIp.trim();

  return req?.socket?.remoteAddress || 'unknown';
};

const truncate = (value, maxLength = 300) => {
  const text = String(value || '').trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

const getN8nConfig = () => {
  const webhookUrl = String(process.env.N8N_WEBHOOK_URL || '').trim();
  const enabled = toBoolean(process.env.N8N_WEBHOOK_ENABLED, Boolean(webhookUrl));
  const authHeader = String(process.env.N8N_WEBHOOK_AUTH_HEADER || 'x-api-key').trim();
  const authToken = String(process.env.N8N_WEBHOOK_AUTH_TOKEN || '').trim();
  const timeoutMs = toPositiveInt(process.env.N8N_WEBHOOK_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

  return {
    webhookUrl,
    enabled,
    authHeader,
    authToken,
    timeoutMs,
  };
};

const buildEventEnvelope = ({ req, eventType, outcome, payload, route }) => ({
  eventType,
  outcome,
  occurredAt: new Date().toISOString(),
  source: 'awahids-portfolio-api',
  request: {
    method: req?.method || '',
    route: route || req?.url || '',
    ip: getClientIp(req),
    userAgent: truncate(getHeaderValue(req, 'user-agent'), 260),
    referer: truncate(getHeaderValue(req, 'referer'), 260),
    origin: truncate(getHeaderValue(req, 'origin'), 160),
    requestId:
      truncate(getHeaderValue(req, 'x-request-id'), 100) ||
      truncate(getHeaderValue(req, 'x-vercel-id'), 100),
  },
  payload,
});

const postWithTimeout = async ({ url, body, timeoutMs, headers }) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed (${response.status})`);
    }
  } finally {
    clearTimeout(timeout);
  }
};

export const sendN8nEvent = async ({ req, eventType, outcome = 'success', payload, route }) => {
  const config = getN8nConfig();
  if (!config.enabled || !config.webhookUrl) return;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (config.authToken) {
    headers[config.authHeader] = config.authToken;
  }

  const eventBody = buildEventEnvelope({
    req,
    eventType,
    outcome,
    payload,
    route,
  });

  await postWithTimeout({
    url: config.webhookUrl,
    body: eventBody,
    timeoutMs: config.timeoutMs,
    headers,
  });
};

export const sendN8nEventSafe = async (params) => {
  try {
    await sendN8nEvent(params);
  } catch {
    // n8n relay must never break primary API responses
  }
};
