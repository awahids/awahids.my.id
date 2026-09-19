// Assembles a prd-writer-shaped Markdown document from the structured object
// the draft endpoint returns. Structure lives here, not in the model output:
// every heading is rendered whether or not the model filled it, so a missing
// section shows up as a marker during review instead of vanishing.

const EMPTY = '> [belum terisi — lengkapi manual]';
const BAD_DIAGRAM = '> [diagram tidak valid — periksa manual]';
const DIAGRAM_HEAD = /^(flowchart|sequenceDiagram|erDiagram)\b/;

const text = (value) => String(value == null ? '' : value).trim();
const list = (value) => (Array.isArray(value) ? value : []);

const paragraphs = (...values) => values.map(text).filter(Boolean).join('\n\n');

// A diagram is only emitted when it is safe and plausibly Mermaid. A line
// carrying a fence would close the block early and corrupt everything after
// it, so such a diagram is refused rather than escaped.
const renderDiagram = (lines) => {
  const rows = list(lines).map((line) => String(line == null ? '' : line));
  if (rows.length === 0) return '';
  if (rows.some((line) => line.includes('```'))) return BAD_DIAGRAM;

  const first = rows.find((line) => line.trim().length > 0) || '';
  if (!DIAGRAM_HEAD.test(first.trim())) return BAD_DIAGRAM;

  return ['```mermaid', ...rows, '```'].join('\n');
};

const bullets = (items) => list(items).map((item) => `- ${text(item)}`).filter((row) => row !== '- ').join('\n');

const numbered = (items) =>
  list(items)
    .map((item, index) => `${index + 1}. ${text(item)}`)
    .filter((row) => !row.endsWith('. '))
    .join('\n');

const section = (heading, body) => `${heading}\n\n${text(body) || EMPTY}`;

const renderRequirements = (groups) =>
  list(groups)
    .map((group) => {
      const items = bullets(group?.items);
      if (!text(group?.category) && !items) return '';
      return `**${text(group?.category)}**\n\n${items}`;
    })
    .filter(Boolean)
    .join('\n\n');

const renderFeatures = (modules) =>
  list(modules)
    .map((module, index) => {
      const features = list(module?.features)
        .map((feature) => `   * **${text(feature?.name)}:** ${text(feature?.desc)}`)
        .join('\n');
      if (!text(module?.module) && !features) return '';
      return `${index + 1}. **${text(module?.module)}**\n${features}`;
    })
    .filter(Boolean)
    .join('\n');

const renderTables = (tables) => {
  const rows = list(tables)
    .map((row) => `| ${text(row?.name)} | ${text(row?.columns)} | ${text(row?.types)} | ${text(row?.notes)} |`)
    .filter((row) => row !== '|  |  |  |  |');
  if (rows.length === 0) return '';
  return ['| Tabel | Kolom Utama | Tipe Data | Keterangan |', '| --- | --- | --- | --- |', ...rows].join('\n');
};

const renderApiGroups = (groups) =>
  list(groups)
    .map((group) => {
      const endpoints = list(group?.endpoints)
        .map((endpoint) => {
          const parts = [`- \`${text(endpoint?.method)} ${text(endpoint?.path)}\``];
          if (text(endpoint?.auth)) parts.push(`— akses: ${text(endpoint.auth)}`);
          if (text(endpoint?.note)) parts.push(`— ${text(endpoint.note)}`);
          return parts.join(' ');
        })
        .join('\n');
      if (!text(group?.group) && !endpoints) return '';
      return `### ${text(group?.group)}\n\n${endpoints}`;
    })
    .filter(Boolean)
    .join('\n\n');

const renderTech = (rows) =>
  list(rows)
    .map((row) => `- **${text(row?.layer)}:** ${text(row?.choice)} — ${text(row?.rationale)}`)
    .filter((row) => row !== '- **:**  — ')
    .join('\n');

export const buildPrdMarkdown = (content = {}, { today = '' } = {}) => {
  const meta = content.meta || {};
  const overview = content.overview || {};
  const userFlow = content.userFlow || {};
  const architecture = content.architecture || {};
  const database = content.database || {};
  const api = content.api || {};
  const constraints = content.constraints || {};

  const header = [
    `# PRD — ${text(meta.systemName) || '[Nama Sistem]'}`,
    '',
    `**Version:** ${text(meta.version) || '1.0'}`,
    `**Tanggal:** ${text(today)}`,
    `**Status:** ${text(meta.status) || 'Draft'}`,
    `**Sistem:** ${text(meta.systemKind) || 'standalone'}`,
    '**Acuan kode:** `wahid-toolkit:coding-standards`',
  ].join('\n');

  const assumptions = list(content.assumptions)
    .map((item) => text(item))
    .filter(Boolean)
    .map((item) => `- [asumsi: ${item}]`)
    .join('\n');

  const blocks = [
    header,
    section('## 1. Overview', paragraphs(overview.definition, overview.problem, overview.goal)),
    section('## 2. Requirements', renderRequirements(content.requirements)),
    section('## 3. Core Features', renderFeatures(content.coreFeatures)),
    section('## 4. User Flow', paragraphs(numbered(userFlow.steps), renderDiagram(userFlow.flowchart))),
    section(
      '## 5. Architecture',
      paragraphs(architecture.stackRationale, architecture.integration, architecture.folders, renderDiagram(architecture.sequence))
    ),
    section('## 6. Database Schema', paragraphs(database.conventions, renderDiagram(database.erd), renderTables(database.tables))),
    section('## 7. API Design', paragraphs(api.principles, renderApiGroups(api.groups))),
    // The closing sentence is mandated by prd-writer, so it is a footer rather
    // than content: a section carrying only boilerplate is still unfilled, and
    // the reviewer needs to see that.
    `${section('## 8. Design & Technical Constraints', paragraphs(renderTech(constraints.tech), constraints.conventions))}\n\nDeviasi dari standar ini wajib didokumentasikan alasannya di komentar kode.`,
  ];

  if (assumptions) blocks.push(`## Asumsi\n\n${assumptions}`);

  return `${blocks.join('\n\n')}\n`;
};
