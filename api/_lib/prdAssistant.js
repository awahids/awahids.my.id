import { parseJsonLenient } from './sumopod.js';
import { RequestError, parseLimitedString } from './requestGuards.js';

const MAX_QUESTIONS = 8;
const MAX_ANSWERS = 8;
const KINDS = new Set(['choice', 'text']);

// Deliberately NOT assistantScope's SCOPE_RULES: that prompt forbids exactly
// the architecture, schema and migration talk a PRD is made of.
export const PRD_QUESTIONS_SYSTEM_PROMPT = `You help scope software products.
Given a short product description, return between 5 and 8 clarifying questions that are
specific to THAT description — never a generic checklist. Aim at what is missing but needed
to write a PRD: roles and their differing access, whether the system is standalone or
integrated (and with what), the business rules or calculations at its core, fixed technical
constraints, notifications, and expected scale.
Reply in the same language as the description.
Return ONLY JSON:
{"questions":[{"id":"q1","text":"...","kind":"choice","options":["...","..."]}]}
Use kind "choice" with options only when the answer is genuinely a small discrete set;
otherwise use kind "text" and omit options. Output no prose and no code fences.`;

export const PRD_DRAFT_SYSTEM_PROMPT = `You write Product Requirements Documents.
Using the description and the answers, produce the content of a PRD.
Reply in the same language as the description.
Return ONLY JSON with this exact shape:
{"meta":{"systemName":"","systemKind":"standalone|integrated","version":"1.0","status":"Draft"},
"overview":{"definition":"","problem":"","goal":""},
"requirements":[{"category":"","items":[""]}],
"coreFeatures":[{"module":"","features":[{"name":"","desc":""}]}],
"userFlow":{"steps":[""],"flowchart":["flowchart TD","  A[...] --> B{...}"]},
"architecture":{"stackRationale":"","integration":"","folders":"","sequence":["sequenceDiagram","  actor User"]},
"database":{"conventions":"","erd":["erDiagram","  USERS ||--o{ ORDERS : places"],"tables":[{"name":"","columns":"","types":"","notes":""}]},
"api":{"principles":"","groups":[{"group":"","endpoints":[{"method":"","path":"","auth":"","note":""}]}]},
"constraints":{"tech":[{"layer":"","choice":"","rationale":""}],"conventions":""},
"assumptions":[""]}
Every diagram MUST be an array of lines, one array element per line, never a single string
with newline characters. Never put a backtick fence inside a diagram array.
State reasons for technical choices, not just the choice. Be explicit about exceptions and
edge cases. Put anything you had to guess into "assumptions". Output no prose and no fences.`;

export const buildQuestionsUserMessage = ({ description, projectName }) =>
  [projectName ? `Nama sistem: ${projectName}` : '', `Deskripsi: ${description}`].filter(Boolean).join('\n');

export const buildDraftUserMessage = ({ description, projectName, answers }) => {
  const lines = [projectName ? `Nama sistem: ${projectName}` : '', `Deskripsi: ${description}`, '', 'Jawaban klarifikasi:'];
  for (const answer of answers) {
    lines.push(`- ${answer.question}: ${answer.answer}`);
  }
  return lines.filter((line) => line !== undefined).join('\n');
};

const readJson = (assistantText) => {
  try {
    return parseJsonLenient(assistantText);
  } catch {
    return null;
  }
};

export const parsePrdQuestions = (assistantText) => {
  const parsed = readJson(assistantText);
  const raw = Array.isArray(parsed?.questions) ? parsed.questions : [];

  const questions = raw
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => {
      const label = String(item.text || '').trim();
      if (!label) return null;
      const kind = KINDS.has(item.kind) ? item.kind : 'text';
      const options =
        kind === 'choice' && Array.isArray(item.options)
          ? item.options.map((option) => String(option || '').trim()).filter(Boolean).slice(0, 6)
          : [];
      return { id: String(item.id || `q${index + 1}`), text: label, kind: options.length ? 'choice' : 'text', options };
    })
    .filter(Boolean)
    .slice(0, MAX_QUESTIONS);

  return { questions };
};

const DRAFT_KEYS = [
  'meta',
  'overview',
  'requirements',
  'coreFeatures',
  'userFlow',
  'architecture',
  'database',
  'api',
  'constraints',
];

export const parsePrdDraft = (assistantText) => {
  const parsed = readJson(assistantText);
  if (!parsed || typeof parsed !== 'object') {
    throw new RequestError(502, 'MODEL_OUTPUT', 'Draf tidak bisa dibaca, coba generate ulang');
  }

  // A truncated response usually parses into something, but without any of the
  // sections we asked for. Half a PRD that looks whole is worse than an error.
  const present = DRAFT_KEYS.filter((key) => parsed[key] != null);
  if (present.length === 0) {
    throw new RequestError(502, 'MODEL_OUTPUT', 'Draf tidak lengkap, coba generate ulang');
  }

  return parsed;
};

export const sanitizePrdRequest = (body) => {
  const description = parseLimitedString({
    value: body?.description,
    field: 'description',
    required: true,
    maxLength: 1200,
  });
  const projectName = parseLimitedString({ value: body?.projectName, field: 'projectName', maxLength: 80 });

  const rawAnswers = Array.isArray(body?.answers) ? body.answers.slice(0, MAX_ANSWERS) : [];
  const answers = rawAnswers
    .filter((item) => item && typeof item === 'object')
    .map((item, index) => ({
      id: String(item.id || `q${index + 1}`).slice(0, 40),
      question: String(item.question || '').slice(0, 300),
      answer: String(item.answer || '').slice(0, 500),
    }));

  return { description, projectName, answers };
};
