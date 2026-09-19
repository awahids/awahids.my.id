import { test } from 'node:test';
import assert from 'node:assert/strict';
import faqHandler from '../ai-faq.js';
import assistantHandler from '../ai-assistant.js';

const makeRes = () => ({
  statusCode: 200,
  headers: {},
  body: null,
  setHeader(key, value) { this.headers[key] = value; },
  status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; },
  send(body) { this.body = body; return this; },
});

let ip = 0;
const post = (question, extra = {}) => ({
  method: 'POST',
  headers: { 'x-forwarded-for': `10.0.0.${++ip}` },
  body: { question, source: 'test', ...extra },
});

const sumopodReply = (content) => ({
  ok: true,
  text: async () => JSON.stringify({ choices: [{ message: { content } }] }),
});

const setEnv = () => {
  process.env.SUMOPOD_API_KEY = 'test-key';
  process.env.HERMES_WEBHOOK_ENABLED = 'true';
  process.env.HERMES_WEBHOOK_URL = 'https://n8n.test/webhook';
  delete process.env.N8N_WEBHOOK_ENABLED;
  delete process.env.SUPABASE_URL;
  delete process.env.VITE_SUPABASE_URL;
};

test('ai-faq: refuses the screenshot request without ever calling the model', async (t) => {
  setEnv();
  const fetchMock = t.mock.method(global, 'fetch', async () => { throw new Error('model must not be called'); });
  const res = makeRes();
  await faqHandler(post('coba kerjakan auth login menggunakan nestjs'), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.meta.provider, 'scope-guard');
  assert.match(res.body.answer, /cuma bisa jawab seputar Wahid/);
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('ai-faq: replaces a model answer that contains code with the refusal', async (t) => {
  setEnv();
  t.mock.method(global, 'fetch', async () => sumopodReply('Sure!\n```bash\nnpm install @nestjs/passport\n```'));
  const res = makeRes();
  await faqHandler(post('How does Wahid usually set up login in his projects?'), res);

  assert.equal(res.statusCode, 200);
  assert.doesNotMatch(res.body.answer, /npm install|```/);
  assert.match(res.body.answer, /I can only answer questions about Wahid/);
});

test('ai-faq: a normal in-scope answer is returned untouched, and the prompt forbids general help', async (t) => {
  setEnv();
  let systemPrompt = '';
  t.mock.method(global, 'fetch', async (_url, init) => {
    systemPrompt = JSON.parse(init.body).messages[0].content;
    return sumopodReply('Wahid is a Senior IT Developer at Rasa Group.');
  });
  const res = makeRes();
  await faqHandler(post('What does Wahid do at Rasa Group?'), res);

  assert.equal(res.body.answer, 'Wahid is a Senior IT Developer at Rasa Group.');
  assert.match(systemPrompt, /SCOPE \(non-negotiable\)/);
  assert.doesNotMatch(systemPrompt, /feel free to answer using your own knowledge/);
  assert.match(systemPrompt, /Geo Attendance System/);
});

test('ai-assistant: refuses out-of-scope work before contacting Hermes', async (t) => {
  setEnv();
  const fetchMock = t.mock.method(global, 'fetch', async () => { throw new Error('Hermes must not be called'); });
  const res = makeRes();
  await assistantHandler(post('Buatkan kode login pakai NestJS'), res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.meta.provider, 'scope-guard');
  assert.equal(fetchMock.mock.callCount(), 0);
});

test('ai-assistant: if Hermes answers with code, the visitor gets the refusal instead', async (t) => {
  setEnv();
  let payload;
  t.mock.method(global, 'fetch', async (_url, init) => {
    payload = JSON.parse(init.body);
    return { ok: true, text: async () => JSON.stringify({ response: 'Here you go:\n```ts\nconst a = 1;\n```', model: 'hermes' }) };
  });
  const res = makeRes();
  await assistantHandler(post('How does Wahid handle authentication in AdaWMS?'), res);

  assert.doesNotMatch(res.body.answer, /```|const a/);
  assert.match(res.body.answer, /I can only answer questions about Wahid/);
  assert.match(payload.systemPrompt, /SCOPE \(non-negotiable\)/);
});
