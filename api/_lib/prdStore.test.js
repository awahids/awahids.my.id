import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidSlug, readPrdBySlug, savePrd } from './prdStore.js';

const withEnv = () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
};

test('isValidSlug: accepts the slugs we generate', () => {
  assert.equal(isValidSlug('absensi-k3f9a2'), true);
});

test('isValidSlug: rejects anything that could reach PostgREST as a filter', () => {
  for (const bad of ['../../etc', 'a b', "x'or'1", 'a,b', '*', '', 'x'.repeat(200)]) {
    assert.equal(isValidSlug(bad), false, `${bad} should be rejected`);
  }
});

test('readPrdBySlug: refuses an invalid slug before any request is made', async (t) => {
  withEnv();
  let called = false;
  t.mock.method(global, 'fetch', async () => {
    called = true;
    return { ok: true, json: async () => [] };
  });

  await assert.rejects(() => readPrdBySlug('a,b'), (error) => error.code === 'INVALID_INPUT');
  assert.equal(called, false);
});

test('readPrdBySlug: returns null when nothing matches', async (t) => {
  withEnv();
  t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => [] }));
  assert.equal(await readPrdBySlug('absensi-k3f9a2'), null);
});

test('savePrd: writes with the service role key, not the anon key', async (t) => {
  withEnv();
  t.mock.method(global, 'fetch', async (url, init) => {
    assert.match(String(url), /\/rest\/v1\/prds$/);
    assert.equal(init.headers.apikey, 'service-key');
    return { ok: true, json: async () => [{ slug: 'absensi-k3f9a2' }] };
  });

  const result = await savePrd({ content: { meta: { systemName: 'Absensi' } } });
  assert.match(result.slug, /^[a-z0-9-]+$/);
});

test('savePrd: refuses a service role key that is only available under a VITE_ name', async () => {
  withEnv();
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY = 'leaked-key';

  await assert.rejects(
    () => savePrd({ content: {} }),
    (error) => error.code === 'CONFIG_MISSING'
  );

  delete process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
});
