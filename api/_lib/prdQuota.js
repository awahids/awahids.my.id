import { createHash } from 'node:crypto';
import { getSupabaseRestConfig } from './supabaseRest.js';
import { RequestError, getClientIp } from './requestGuards.js';

const DEFAULT_PER_DAY = 3;

// The in-memory limiter in requestGuards only survives one serverless
// instance, so the daily allowance has to live in the database.
export const hashClientIp = (ip) =>
  createHash('sha256').update(`${process.env.PRD_QUOTA_SALT || ''}:${ip}`).digest('hex');

export const consumePrdQuota = async (req) => {
  const { url, anonKey } = getSupabaseRestConfig();
  if (!url || !anonKey) {
    throw new RequestError(500, 'CONFIG_MISSING', 'Supabase is not configured');
  }

  const max = Number(process.env.PRD_QUOTA_PER_DAY || DEFAULT_PER_DAY);
  const day = new Date().toISOString().slice(0, 10);

  const response = await fetch(`${url}/rest/v1/rpc/increment_prd_quota`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_ip_hash: hashClientIp(getClientIp(req)), p_day: day, p_max: max }),
  });

  if (!response.ok) {
    throw new RequestError(502, 'QUOTA_UNAVAILABLE', 'Tidak bisa memeriksa kuota');
  }

  const remaining = Number(await response.json());
  return { allowed: remaining > 0, remaining: Number.isFinite(remaining) ? remaining : 0 };
};
