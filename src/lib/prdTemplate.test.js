import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPrdMarkdown } from './prdTemplate.js';

const TODAY = '2026-09-19';

const HEADINGS = [
  '## 1. Overview',
  '## 2. Requirements',
  '## 3. Core Features',
  '## 4. User Flow',
  '## 5. Architecture',
  '## 6. Database Schema',
  '## 7. API Design',
  '## 8. Design & Technical Constraints',
];

test('buildPrdMarkdown: renders all headings in order even for empty input', () => {
  const markdown = buildPrdMarkdown({}, { today: TODAY });
  let cursor = -1;
  for (const heading of HEADINGS) {
    const at = markdown.indexOf(heading);
    assert.ok(at > cursor, `${heading} missing or out of order`);
    cursor = at;
  }
});

test('buildPrdMarkdown: empty sections are marked, never dropped', () => {
  const markdown = buildPrdMarkdown({}, { today: TODAY });
  const marks = markdown.split('> [belum terisi — lengkapi manual]').length - 1;
  assert.equal(marks, 8);
});

test('buildPrdMarkdown: header carries name, version, status and date', () => {
  const markdown = buildPrdMarkdown(
    { meta: { systemName: 'Absensi', systemKind: 'standalone' } },
    { today: TODAY }
  );
  assert.match(markdown, /^# PRD — Absensi\n/);
  assert.match(markdown, /\*\*Version:\*\* 1\.0/);
  assert.match(markdown, /\*\*Status:\*\* Draft/);
  assert.match(markdown, /\*\*Tanggal:\*\* 2026-09-19/);
  assert.match(markdown, /\*\*Sistem:\*\* standalone/);
});

test('buildPrdMarkdown: a valid flowchart is joined and fenced', () => {
  const markdown = buildPrdMarkdown(
    { userFlow: { steps: ['Pilih menu'], flowchart: ['flowchart TD', '  A[Mulai] --> B{Cek}'] } },
    { today: TODAY }
  );
  assert.match(markdown, /```mermaid\nflowchart TD\n {2}A\[Mulai\] --> B\{Cek\}\n```/);
});

test('buildPrdMarkdown: a diagram with a wrong first line is marked, fences stay balanced', () => {
  const markdown = buildPrdMarkdown(
    { userFlow: { steps: [], flowchart: ['graph TD', 'A --> B'] } },
    { today: TODAY }
  );
  assert.match(markdown, /> \[diagram tidak valid — periksa manual\]/);
  assert.equal(markdown.split('```').length % 2, 1);
});

test('buildPrdMarkdown: a diagram line containing a fence is rejected outright', () => {
  const markdown = buildPrdMarkdown(
    { userFlow: { steps: [], flowchart: ['flowchart TD', '``` malicious', 'A --> B'] } },
    { today: TODAY }
  );
  assert.ok(!markdown.includes('malicious'));
  assert.match(markdown, /> \[diagram tidak valid — periksa manual\]/);
  assert.equal(markdown.split('```').length % 2, 1);
});

test('buildPrdMarkdown: database tables render as a table', () => {
  const markdown = buildPrdMarkdown(
    {
      database: {
        erd: ['erDiagram', 'USERS ||--o{ ORDERS : places'],
        tables: [{ name: 'users', columns: 'id, name', types: 'uuid, text', notes: 'name disinkron job' }],
      },
    },
    { today: TODAY }
  );
  assert.match(markdown, /\| users \| id, name \| uuid, text \| name disinkron job \|/);
});

test('buildPrdMarkdown: api endpoints render per group', () => {
  const markdown = buildPrdMarkdown(
    {
      api: {
        principles: 'REST v1',
        groups: [{ group: 'Absensi', endpoints: [{ method: 'GET', path: '/v1/absensi', auth: 'staff', note: 'filter tanggal' }] }],
      },
    },
    { today: TODAY }
  );
  assert.match(markdown, /### Absensi/);
  assert.match(markdown, /`GET \/v1\/absensi`/);
});

test('buildPrdMarkdown: assumptions render with the asumsi marker', () => {
  const markdown = buildPrdMarkdown({ assumptions: ['cut-off jam 15.00'] }, { today: TODAY });
  assert.match(markdown, /\[asumsi: cut-off jam 15\.00\]/);
});
