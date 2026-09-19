import { getSupabaseRestConfig } from './supabaseRest.js';

export const QA_TEXT_MAX = 2_000;

const RETENTION_DAYS = 90;

const toPositiveInt = (value, fallback) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  return fallback;
};

// Reading the service role key WITHOUT a VITE_ fallback is deliberate, for the
// same reason prdStore.js did it: this key bypasses every RLS policy, and a
// VITE_ name would inline it into the client bundle.
//
// assistant_qa has RLS on and NO policies at all, so the anon key — which is
// public — can neither read nor write it. The service role is the only way in,
// and it lives solely in this server-side module.
const serviceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const truncate = (value) => {
  const text = String(value || '').trim();
  return text.length <= QA_TEXT_MAX ? text : text.slice(0, QA_TEXT_MAX);
};

const authHeaders = (key) => ({
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
});

/**
 * Deletes rows past the retention window. Runs alongside each insert rather
 * than on a pg_cron schedule: traffic here is low enough that a second REST
 * call costs nothing, and this keeps the retention promise working on a plain
 * Supabase project with no extensions enabled. Move it to pg_cron if the
 * archive ever gets busy.
 */
const pruneExpired = async (url, key) => {
  const days = toPositiveInt(process.env.ASSISTANT_QA_RETENTION_DAYS, RETENTION_DAYS);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const query = new URLSearchParams({ created_at: `lt.${cutoff}` });

  const response = await fetch(`${url}/rest/v1/assistant_qa?${query.toString()}`, {
    method: 'DELETE',
    headers: authHeaders(key),
  });

  if (!response.ok) throw new Error(`prune failed with status ${response.status}`);
};

const recordQa = async ({ route, question, answer, language = '' }) => {
  const trimmedQuestion = truncate(question);
  const trimmedAnswer = truncate(answer);
  if (!trimmedQuestion || !trimmedAnswer) return;

  const { url } = getSupabaseRestConfig();
  const key = serviceRoleKey();
  if (!url || !key) return;

  const response = await fetch(`${url}/rest/v1/assistant_qa`, {
    method: 'POST',
    headers: { ...authHeaders(key), Prefer: 'return=minimal' },
    body: JSON.stringify({
      route: String(route || ''),
      question: trimmedQuestion,
      answer: trimmedAnswer,
      language: String(language || ''),
    }),
  });

  if (!response.ok) throw new Error(`insert failed with status ${response.status}`);

  await pruneExpired(url, key);
};

/**
 * Archives one answered question. Never throws: the archive is a convenience
 * for the site owner, so a Supabase outage must not cost a visitor their
 * answer.
 *
 * This IS awaited before the response is sent, adding two Supabase round-trips
 * to a request that already waits on the model. That is deliberate — on Vercel
 * a promise left unawaited can be frozen the moment the response goes out, so
 * a literal fire-and-forget would drop writes at random.
 *
 * Callers skip questions the scope guard refused — those are not real questions
 * about Wahid and would only pollute the corpus that phase 2 retrieves from.
 *
 * Failures are swallowed but not hidden: a wrong SUPABASE_SERVICE_ROLE_KEY
 * would otherwise look exactly like the feature being switched off, since both
 * produce an empty table and a perfectly healthy endpoint. The warning names
 * the table and the reason only — never the visitor's question or answer, which
 * do not belong in a log.
 */
export const recordQaSafe = async (params) => {
  try {
    await recordQa(params);
  } catch (error) {
    // Warn, but never rethrow: the archive must not break primary responses.
    console.warn(`[assistant_qa] archive write skipped: ${error?.message || error}`);
  }
};
