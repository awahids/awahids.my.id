import { randomUUID } from 'node:crypto';
import { getSupabaseRestConfig } from './supabaseRest.js';
import { RequestError } from './requestGuards.js';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX = 80;

export const isValidSlug = (slug) => {
  const value = String(slug || '');
  return value.length > 0 && value.length <= SLUG_MAX && SLUG.test(value);
};

const slugify = (name) =>
  String(name || 'prd')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'prd';

// Reading the service role key WITHOUT a VITE_ fallback is deliberate: every
// other Supabase helper here falls back to the VITE_ name, and doing that with
// a key that bypasses RLS would hand the database to anyone with DevTools.
const serviceRoleKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!key) {
    throw new RequestError(500, 'CONFIG_MISSING', 'SUPABASE_SERVICE_ROLE_KEY is not set (never use a VITE_ name for it)');
  }
  return key;
};

export const savePrd = async ({ content }) => {
  const { url } = getSupabaseRestConfig();
  const key = serviceRoleKey();
  if (!url) throw new RequestError(500, 'CONFIG_MISSING', 'Supabase is not configured');

  const systemName = String(content?.meta?.systemName || '').trim() || 'PRD';
  const slug = `${slugify(systemName)}-${randomUUID().slice(0, 6)}`;

  const response = await fetch(`${url}/rest/v1/prds`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      id: randomUUID(),
      slug,
      system_name: systemName,
      version: String(content?.meta?.version || '1.0'),
      status: String(content?.meta?.status || 'draft').toLowerCase(),
      source: 'web',
      content,
    }),
  });

  if (!response.ok) {
    throw new RequestError(502, 'SAVE_FAILED', 'PRD gagal disimpan');
  }

  return { slug };
};

export const readPrdBySlug = async (slug) => {
  if (!isValidSlug(slug)) {
    throw new RequestError(400, 'INVALID_INPUT', 'slug tidak valid');
  }

  const { url, anonKey } = getSupabaseRestConfig();
  if (!url || !anonKey) throw new RequestError(500, 'CONFIG_MISSING', 'Supabase is not configured');

  const query = new URLSearchParams({ slug: `eq.${slug}`, select: '*', limit: '1' });
  const response = await fetch(`${url}/rest/v1/prds?${query.toString()}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
  });

  if (!response.ok) throw new RequestError(502, 'READ_FAILED', 'PRD gagal dibaca');

  const rows = await response.json();
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
};
