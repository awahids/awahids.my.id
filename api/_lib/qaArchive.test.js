import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QA_TEXT_MAX, recordQaSafe } from './qaArchive.js';

const setEnv = () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  process.env.SUPABASE_ANON_KEY = 'anon-key';
};

const clearEnv = () => {
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
};

const ok = { ok: true, json: async () => [] };

const sampleQa = {
  route: '/api/ai-faq',
  question: 'Wahid sekarang kerja di mana?',
  answer: 'Saat ini di Rasa Group sebagai Senior IT Developer.',
  language: 'id',
};

test('recordQaSafe: inserts the row with the service role key, never the anon key', async (t) => {
  setEnv();
  const inserts = [];

  t.mock.method(global, 'fetch', async (url, init) => {
    if (init.method === 'POST') inserts.push({ url: String(url), init });
    return ok;
  });

  await recordQaSafe(sampleQa);

  assert.equal(inserts.length, 1);
  assert.match(inserts[0].url, /\/rest\/v1\/assistant_qa$/);
  assert.equal(inserts[0].init.headers.apikey, 'service-role-key');
  assert.equal(inserts[0].init.headers.Authorization, 'Bearer service-role-key');

  const row = JSON.parse(inserts[0].init.body);
  assert.equal(row.route, '/api/ai-faq');
  assert.equal(row.question, sampleQa.question);
  assert.equal(row.answer, sampleQa.answer);
  assert.equal(row.language, 'id');
});

test('recordQaSafe: also prunes rows older than the retention window', async (t) => {
  setEnv();
  const deletes = [];

  t.mock.method(global, 'fetch', async (url, init) => {
    if (init.method === 'DELETE') deletes.push(String(url));
    return ok;
  });

  await recordQaSafe(sampleQa);

  assert.equal(deletes.length, 1);
  assert.match(deletes[0], /\/rest\/v1\/assistant_qa\?created_at=lt\./);
});

test('recordQaSafe: truncates question and answer that exceed the cap', async (t) => {
  setEnv();
  let row = null;

  t.mock.method(global, 'fetch', async (url, init) => {
    if (init.method === 'POST') row = JSON.parse(init.body);
    return ok;
  });

  await recordQaSafe({ ...sampleQa, question: 'q'.repeat(9000), answer: 'a'.repeat(9000) });

  assert.equal(row.question.length, QA_TEXT_MAX);
  assert.equal(row.answer.length, QA_TEXT_MAX);
});

test('recordQaSafe: writes nothing when the service role key is absent', async (t) => {
  clearEnv();
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  let called = 0;

  t.mock.method(global, 'fetch', async () => { called += 1; return ok; });

  await recordQaSafe(sampleQa);
  assert.equal(called, 0);
});

test('recordQaSafe: never rejects when Supabase fails, so the answer still reaches the visitor', async (t) => {
  setEnv();
  t.mock.method(global, 'fetch', async () => { throw new Error('network down'); });

  await assert.doesNotReject(() => recordQaSafe(sampleQa));
});

test('recordQaSafe: never rejects when Supabase returns a non-ok response', async (t) => {
  setEnv();
  t.mock.method(global, 'fetch', async () => ({ ok: false, status: 500, json: async () => ({}) }));

  await assert.doesNotReject(() => recordQaSafe(sampleQa));
});

test('recordQaSafe: skips rows with an empty question or answer', async (t) => {
  setEnv();
  let called = 0;

  t.mock.method(global, 'fetch', async () => { called += 1; return ok; });

  await recordQaSafe({ ...sampleQa, question: '   ' });
  await recordQaSafe({ ...sampleQa, answer: '' });

  assert.equal(called, 0);
});
