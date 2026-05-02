class RequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'RequestError';
    this.status = status;
    this.code = code;
  }
}

const RATE_LIMIT_STORE_KEY = '__awahidsRateLimitStore';
const RATE_LIMIT_STORE = globalThis[RATE_LIMIT_STORE_KEY] || new Map();
if (!globalThis[RATE_LIMIT_STORE_KEY]) {
  globalThis[RATE_LIMIT_STORE_KEY] = RATE_LIMIT_STORE;
}

const getHeaderValue = (req, headerName) => {
  const value = req?.headers?.[headerName];
  if (Array.isArray(value)) return value[0] || '';
  return String(value || '');
};

const getClientIp = (req) => {
  const xForwardedFor = getHeaderValue(req, 'x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIp = getHeaderValue(req, 'x-real-ip');
  if (xRealIp) return xRealIp.trim();

  return req?.socket?.remoteAddress || 'unknown';
};

const cleanupRateLimitStore = (now) => {
  if (RATE_LIMIT_STORE.size < 500) return;

  for (const [key, value] of RATE_LIMIT_STORE.entries()) {
    if (!value || value.resetAt <= now) {
      RATE_LIMIT_STORE.delete(key);
    }
  }
};

const parseLimitedString = ({
  value,
  field,
  required = false,
  maxLength,
}) => {
  if (value == null) {
    if (required) {
      throw new RequestError(400, 'INVALID_INPUT', `${field} is required`);
    }
    return '';
  }

  if (typeof value !== 'string') {
    throw new RequestError(400, 'INVALID_INPUT', `${field} must be a string`);
  }

  const trimmed = value.trim();
  if (required && !trimmed) {
    throw new RequestError(400, 'INVALID_INPUT', `${field} is required`);
  }

  if (trimmed.length > maxLength) {
    throw new RequestError(
      400,
      'INVALID_INPUT',
      `${field} must be at most ${maxLength} characters`
    );
  }

  return trimmed;
};

const parseIsoDateString = ({ value, field }) => {
  if (value == null || value === '') return '';
  if (typeof value !== 'string') {
    throw new RequestError(400, 'INVALID_INPUT', `${field} must be a string`);
  }

  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.length > 60) {
    throw new RequestError(400, 'INVALID_INPUT', `${field} is invalid`);
  }

  const parsedTime = Date.parse(trimmed);
  if (Number.isNaN(parsedTime)) {
    throw new RequestError(400, 'INVALID_INPUT', `${field} must be a valid ISO date`);
  }

  return new Date(parsedTime).toISOString();
};

export const sendNoStore = (res) => {
  res.setHeader('Cache-Control', 'no-store');
};

export const ensureMethod = (req, res, method = 'POST') => {
  if (req.method === method) return true;

  res.setHeader('Allow', method);
  sendNoStore(res);
  res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' });
  return false;
};

export const createRateLimiter = ({ keyPrefix, windowMs, maxRequests }) => {
  return (req, res) => {
    const now = Date.now();
    cleanupRateLimitStore(now);

    const ip = getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const bucket = RATE_LIMIT_STORE.get(key);

    if (!bucket || bucket.resetAt <= now) {
      RATE_LIMIT_STORE.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });

      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', String(maxRequests - 1));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil((now + windowMs) / 1000)));
      return true;
    }

    if (bucket.count >= maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.setHeader('X-RateLimit-Limit', String(maxRequests));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
      sendNoStore(res);
      res.status(429).json({
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMITED',
      });
      return false;
    }

    bucket.count += 1;
    RATE_LIMIT_STORE.set(key, bucket);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(maxRequests - bucket.count));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    return true;
  };
};

export const sanitizeLanguageHint = (value) => {
  const hint = String(value || '').trim().toLowerCase();
  if (!hint) return '';
  if (hint === 'id' || hint === 'en') return hint;
  throw new RequestError(400, 'INVALID_INPUT', 'languageHint must be "id" or "en"');
};

export const validateFaqBody = (body) => {
  if (!body || typeof body !== 'object') {
    throw new RequestError(400, 'INVALID_INPUT', 'Request body is required');
  }

  let parsedHistory = [];
  if (Array.isArray(body.history)) {
    parsedHistory = body.history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: parseLimitedString({
        value: msg.text || msg.content,
        field: 'history.content',
        required: true,
        maxLength: 1000,
      }),
    })).slice(-6);
  }

  return {
    question: parseLimitedString({
      value: body.question,
      field: 'question',
      required: true,
      maxLength: 500,
    }),
    history: parsedHistory,
    languageHint: sanitizeLanguageHint(body.languageHint),
    source: parseLimitedString({
      value: body.source,
      field: 'source',
      maxLength: 80,
    }),
    submittedAt: parseIsoDateString({
      value: body.submittedAt,
      field: 'submittedAt',
    }),
  };
};

export const validateBriefBody = (body) => {
  if (!body || typeof body !== 'object') {
    throw new RequestError(400, 'INVALID_INPUT', 'Request body is required');
  }

  return {
    productType: parseLimitedString({
      value: body.productType,
      field: 'productType',
      required: true,
      maxLength: 120,
    }),
    targetUsers: parseLimitedString({
      value: body.targetUsers,
      field: 'targetUsers',
      required: true,
      maxLength: 160,
    }),
    coreGoals: parseLimitedString({
      value: body.coreGoals,
      field: 'coreGoals',
      required: true,
      maxLength: 1200,
    }),
    integrations: parseLimitedString({
      value: body.integrations,
      field: 'integrations',
      maxLength: 320,
    }),
    timeline: parseLimitedString({
      value: body.timeline,
      field: 'timeline',
      maxLength: 120,
    }),
    successMetric: parseLimitedString({
      value: body.successMetric,
      field: 'successMetric',
      maxLength: 200,
    }),
    constraints: parseLimitedString({
      value: body.constraints,
      field: 'constraints',
      maxLength: 500,
    }),
    languageHint: sanitizeLanguageHint(body.languageHint),
    source: parseLimitedString({
      value: body.source,
      field: 'source',
      maxLength: 80,
    }),
    submittedAt: parseIsoDateString({
      value: body.submittedAt,
      field: 'submittedAt',
    }),
  };
};

export const toSafeErrorResponse = (error) => {
  if (error && typeof error === 'object' && error.name === 'RequestError') {
    return {
      status: error.status || 400,
      body: {
        error: error.message,
        code: error.code || 'INVALID_REQUEST',
      },
    };
  }

  const status = Number(error?.status);
  const code = String(error?.code || 'INTERNAL_ERROR');
  const fallbackMessage = 'Something went wrong. Please try again.';
  const exposedMessage = typeof error?.publicMessage === 'string' ? error.publicMessage : '';

  return {
    status: Number.isFinite(status) && status >= 400 && status <= 599 ? status : 500,
    body: {
      error: exposedMessage || fallbackMessage,
      code,
    },
  };
};
