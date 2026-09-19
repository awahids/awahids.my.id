import { getSupabaseRestConfig } from './supabaseRest.js';
import { RequestError } from './requestGuards.js';
import { buildPrdMarkdown } from '../../src/lib/prdTemplate.js';

// public.prds belongs to the aw-prd app (per-user RLS, no slug column). This
// site writes into it as the owner's user and uses the row id as the permalink,
// so saved PRDs also show up in aw-prd.
const SOURCE = 'awahids.my.id';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidSlug = (slug) => UUID.test(String(slug || ''));

// Reading the service role key WITHOUT a VITE_ fallback is deliberate: every
// other Supabase helper here falls back to the VITE_ name, and doing that with
// a key that bypasses RLS would hand the database to anyone with DevTools.
const serverConfig = () => {
  const { url } = getSupabaseRestConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const owner = process.env.PRD_OWNER_USER_ID || '';
  if (!key) {
    throw new RequestError(500, 'CONFIG_MISSING', 'SUPABASE_SERVICE_ROLE_KEY is not set (never use a VITE_ name for it)');
  }
  if (!url || !UUID.test(owner)) {
    throw new RequestError(500, 'CONFIG_MISSING', 'SUPABASE_URL or PRD_OWNER_USER_ID is not set');
  }
  return { url, owner, headers: { apikey: key, Authorization: `Bearer ${key}` } };
};

export const savePrd = async ({ content }) => {
  const { url, owner, headers } = serverConfig();
  const title = String(content?.meta?.systemName || '').trim() || 'Untitled PRD';

  const response = await fetch(`${url}/rest/v1/prds`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({
      user_id: owner,
      title,
      language: 'id',
      form_data: { source: SOURCE, content },
      markdown: buildPrdMarkdown(content, { today: new Date().toISOString().slice(0, 10) }),
    }),
  });

  if (!response.ok) {
    throw new RequestError(502, 'SAVE_FAILED', 'PRD gagal disimpan');
  }

  const rows = await response.json();
  const id = Array.isArray(rows) ? rows[0]?.id : null;
  if (!isValidSlug(id)) throw new RequestError(502, 'SAVE_FAILED', 'PRD gagal disimpan');
  return { slug: id };
};

// Read with the service role, scoped to the owner, instead of a public RLS
// policy: the table is shared, and a public policy would expose every row.
export const readPrdBySlug = async (slug) => {
  if (!isValidSlug(slug)) {
    throw new RequestError(400, 'INVALID_INPUT', 'slug tidak valid');
  }

  const { url, owner, headers } = serverConfig();
  const query = new URLSearchParams({
    id: `eq.${slug}`,
    user_id: `eq.${owner}`,
    select: 'id,title,form_data,created_at',
    limit: '1',
  });
  const response = await fetch(`${url}/rest/v1/prds?${query.toString()}`, { headers });

  if (!response.ok) throw new RequestError(502, 'READ_FAILED', 'PRD gagal dibaca');

  const rows = await response.json();
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return null;

  return {
    slug: row.id,
    system_name: row.title,
    content: row.form_data?.content ?? null,
    created_at: row.created_at,
  };
};
