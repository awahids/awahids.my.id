import { getSupabaseRestConfig } from './supabaseRest.js';

const createPageViewError = ({ status = 500, code = 'UPSTREAM_ERROR', message }) =>
  Object.assign(new Error(message), { name: 'PageViewError', status, code });

/**
 * Increments and returns the view count for `key`, via the
 * `increment_page_view` RPC (see supabase/page-views.sql) — a
 * SECURITY DEFINER function so the public anon key can bump the counter
 * without needing write access to the table directly.
 */
export const incrementPageView = async (key) => {
  const { url, anonKey } = getSupabaseRestConfig();
  if (!url || !anonKey) {
    throw createPageViewError({ status: 500, code: 'CONFIG_MISSING', message: 'Supabase is not configured' });
  }

  const response = await fetch(`${url}/rest/v1/rpc/increment_page_view`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ view_key: key }),
  });

  if (!response.ok) {
    throw createPageViewError({
      status: 502,
      code: 'UPSTREAM_ERROR',
      message: `Supabase RPC failed with status ${response.status}`,
    });
  }

  const count = await response.json();
  return Number(count) || 0;
};
