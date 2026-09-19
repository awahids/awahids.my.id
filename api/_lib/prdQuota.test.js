import { test } from 'node:test';
import assert from 'node:assert/strict';
import { consumePrdQuota, hashClientIp } from './prdQuota.js';

const req = { headers: { 'x-forwarded-for': '203.0.113.9' } };

const withEnv = () => {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-key';
  process.env.PRD_QUOTA_SALT = 'salt';
  process.env.PRD_QUOTA_PER_DAY = '3';
};

test('hashClientIp: never returns the raw address', () => {
  process.env.PRD_QUOTA_SALT = 'salt';
  const hash = hashClientIp('203.0.113.9');
  assert.ok(!hash.includes('203.0.113.9'));
  assert.equal(hash.length, 64);
});

test('consumePrdQuota: allows while the RPC still reports headroom', async (t) => {
  withEnv();
  t.mock.method(global, 'fetch', async (url, init) => {
    assert.match(String(url), /\/rest\/v1\/rpc\/increment_prd_quota$/);
    const body = JSON.parse(init.body);
    assert.equal(body.p_max, 3);
    assert.ok(!String(init.body).includes('203.0.113.9'));
    return { ok: true, json: async () => 2 };
  });

  const result = await consumePrdQuota(req);
  assert.deepEqual(result, { allowed: true, remaining: 2 });
});

test('consumePrdQuota: the call that spends the last slot is still allowed', async (t) => {
  withEnv();
  t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => 0 }));

  const result = await consumePrdQuota(req);
  assert.deepEqual(result, { allowed: true, remaining: 0 });
});

test('consumePrdQuota: refuses once the count is past the allowance', async (t) => {
  withEnv();
  t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => -1 }));

  const result = await consumePrdQuota(req);
  assert.deepEqual(result, { allowed: false, remaining: 0 });
});

test('consumePrdQuota: a non-numeric RPC reply fails closed', async (t) => {
  withEnv();
  t.mock.method(global, 'fetch', async () => ({ ok: true, json: async () => null }));

  const result = await consumePrdQuota(req);
  assert.equal(result.allowed, false);
});

test('consumePrdQuota: missing Supabase env raises CONFIG_MISSING', async () => {
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.VITE_SUPABASE_ANON_KEY;

  await assert.rejects(() => consumePrdQuota(req), (error) => error.code === 'CONFIG_MISSING');
});
