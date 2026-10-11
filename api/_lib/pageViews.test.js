import { test } from 'node:test';
import assert from 'node:assert/strict';
import { incrementPageView } from './pageViews.js';

test('incrementPageView: returns the count from the RPC response', async (t) => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-key';

  t.mock.method(global, 'fetch', async (url, init) => {
    assert.match(String(url), /\/rest\/v1\/rpc\/increment_page_view$/);
    assert.equal(JSON.parse(init.body).view_key, 'awahids');
    return { ok: true, json: async () => 42 };
  });

  const count = await incrementPageView('awahids');
  assert.equal(count, 42);
});

test('incrementPageView: throws a CONFIG_MISSING error when Supabase env vars are absent', async () => {
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.VITE_SUPABASE_ANON_KEY;

  await assert.rejects(() => incrementPageView('awahids'), (error) => {
    assert.equal(error.code, 'CONFIG_MISSING');
    return true;
  });
});
