import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNotFoundRoute, isPrdGeneratorRoute } from './routes.js';

test('isPrdGeneratorRoute: matches with and without a trailing slash', () => {
  assert.equal(isPrdGeneratorRoute('/prd-generator'), true);
  assert.equal(isPrdGeneratorRoute('/prd-generator/'), true);
  assert.equal(isPrdGeneratorRoute('/prd-generator/extra'), false);
});

test('isNotFoundRoute: known routes are not 404', () => {
  for (const path of ['/', '/ai-lab', '/readme-generator', '/prd-generator']) {
    assert.equal(isNotFoundRoute(path), false, `${path} should not be 404`);
  }
});

test('isNotFoundRoute: unknown routes and the retired /prd permalinks are 404', () => {
  for (const path of ['/nope', '/prd', '/prd/absensi-k3f9a2']) {
    assert.equal(isNotFoundRoute(path), true, `${path} should be 404`);
  }
});
