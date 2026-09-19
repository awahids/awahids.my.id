import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidSlug, readPrdBySlug, savePrd } from './prdStore.js';

const OWNER = '1d0b4ec0-6a12-43ac-8c6f-2875e559ca0c';
const ROW_ID = '0f6d3c2a-9b1e-4c7a-8d2f-5e4b3a2c1d0e';

const withEnv = () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  process.env.PRD_OWNER_USER_ID = OWNER;
};

test('isValidSlug: accepts the row ids we hand out', () => {
  assert.equal(isValidSlug(ROW_ID), true);
  assert.equal(isValidSlug(ROW_ID.toUpperCase()), true);
});

test('isValidSlug: rejects anything that is not a uuid', () => {
  for (const bad of ['absensi-k3f9a2', '../../etc', 'a b', "x'or'1", 'a,b', '*', '', 'x'.repeat(200)]) {
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

test('readPrdBySlug: reads server-side, scoped to the owner, and returns null on no match', async (t) => {
  withEnv();
  t.mock.method(global, 'fetch', async (url, init) => {
    const query = new URL(String(url)).searchParams;
    assert.equal(query.get('id'), `eq.${ROW_ID}`);
    // The table is shared with another app and another user: without this
    // filter a leaked id would expose rows that were never published here.
    assert.equal(query.get('user_id'), `eq.${OWNER}`);
    assert.equal(init.headers.apikey, 'service-key');
    return { ok: true, json: async () => [] };
  });
  assert.equal(await readPrdBySlug(ROW_ID), null);
});

test('readPrdBySlug: maps the row to the shape the permalink page expects', async (t) => {
  withEnv();
  const content = { meta: { systemName: 'Absensi' } };
  t.mock.method(global, 'fetch', async () => ({
    ok: true,
    json: async () => [
      { id: ROW_ID, title: 'Absensi', form_data: { source: 'awahids.my.id', content }, created_at: '2026-09-19T10:00:00Z' },
    ],
  }));

  assert.deepEqual(await readPrdBySlug(ROW_ID), {
    slug: ROW_ID,
    system_name: 'Absensi',
    content,
    created_at: '2026-09-19T10:00:00Z',
  });
});

test('savePrd: writes as the owner with the service role key and returns the row id', async (t) => {
  withEnv();
  t.mock.method(global, 'fetch', async (url, init) => {
    assert.match(String(url), /\/rest\/v1\/prds$/);
    assert.equal(init.headers.apikey, 'service-key');
    const body = JSON.parse(init.body);
    assert.equal(body.user_id, OWNER);
    assert.equal(body.title, 'Absensi');
    assert.equal(body.form_data.source, 'awahids.my.id');
    assert.equal(body.form_data.content.meta.systemName, 'Absensi');
    assert.match(body.markdown, /^# PRD — Absensi/);
    return { ok: true, json: async () => [{ id: ROW_ID }] };
  });

  assert.deepEqual(await savePrd({ content: { meta: { systemName: 'Absensi' } } }), { slug: ROW_ID });
});

test('savePrd: refuses to write without an owner user id', async () => {
  withEnv();
  delete process.env.PRD_OWNER_USER_ID;

  await assert.rejects(() => savePrd({ content: {} }), (error) => error.code === 'CONFIG_MISSING');
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
