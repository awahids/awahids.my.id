import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isOwnerRequest } from './ownerAuth.js';

test('isOwnerRequest: accepts the configured token', () => {
  process.env.PRD_OWNER_KEY = 'secret-token';
  assert.equal(isOwnerRequest({ headers: { authorization: 'Bearer secret-token' } }), true);
});

test('isOwnerRequest: the scheme is case-insensitive', () => {
  process.env.PRD_OWNER_KEY = 'secret-token';
  assert.equal(isOwnerRequest({ headers: { authorization: 'bearer secret-token' } }), true);
});

test('isOwnerRequest: rejects a wrong token', () => {
  process.env.PRD_OWNER_KEY = 'secret-token';
  assert.equal(isOwnerRequest({ headers: { authorization: 'Bearer nope' } }), false);
});

test('isOwnerRequest: rejects a scheme with no token', () => {
  process.env.PRD_OWNER_KEY = 'secret-token';
  assert.equal(isOwnerRequest({ headers: { authorization: 'Bearer' } }), false);
});

test('isOwnerRequest: rejects a missing header without throwing', () => {
  process.env.PRD_OWNER_KEY = 'secret-token';
  assert.equal(isOwnerRequest({ headers: {} }), false);
  assert.equal(isOwnerRequest({}), false);
});

test('isOwnerRequest: refuses everything when no key is configured', () => {
  delete process.env.PRD_OWNER_KEY;
  assert.equal(isOwnerRequest({ headers: { authorization: 'Bearer anything' } }), false);
});
