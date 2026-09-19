import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNotFoundRoute, isPrdGeneratorRoute, prdSlugFromPath } from './routes.js';

test('isPrdGeneratorRoute: matches with and without a trailing slash', () => {
  assert.equal(isPrdGeneratorRoute('/prd-generator'), true);
  assert.equal(isPrdGeneratorRoute('/prd-generator/'), true);
  assert.equal(isPrdGeneratorRoute('/prd-generator/extra'), false);
});

test('prdSlugFromPath: extracts a valid slug', () => {
  assert.equal(prdSlugFromPath('/prd/absensi-k3f9a2'), 'absensi-k3f9a2');
  assert.equal(prdSlugFromPath('/prd/absensi-k3f9a2/'), 'absensi-k3f9a2');
});

test('prdSlugFromPath: returns empty for a bare prefix or a nested path', () => {
  assert.equal(prdSlugFromPath('/prd'), '');
  assert.equal(prdSlugFromPath('/prd/'), '');
  assert.equal(prdSlugFromPath('/prd/a/b'), '');
});

test('prdSlugFromPath: rejects a slug shape we would never generate', () => {
  assert.equal(prdSlugFromPath('/prd/a,b'), '');
  assert.equal(prdSlugFromPath('/prd/..'), '');
});

test('isNotFoundRoute: known routes are not 404', () => {
  for (const path of ['/', '/ai-lab', '/readme-generator', '/prd-generator', '/prd/absensi-k3f9a2']) {
    assert.equal(isNotFoundRoute(path), false, `${path} should not be 404`);
  }
});

test('isNotFoundRoute: unknown routes and a bare /prd are 404', () => {
  for (const path of ['/nope', '/prd', '/prd/a,b']) {
    assert.equal(isNotFoundRoute(path), true, `${path} should be 404`);
  }
});
