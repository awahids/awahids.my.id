import { timingSafeEqual } from 'node:crypto';

// Constant-time so the endpoint does not leak the token one byte at a time.
const safeEqual = (a, b) => {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
};

export const isOwnerRequest = (req) => {
  const expected = process.env.PRD_OWNER_KEY || '';
  if (!expected) return false;

  const header = String(req?.headers?.authorization || '');
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;

  return safeEqual(match[1].trim(), expected);
};
