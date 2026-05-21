export const DEFAULT_EXPERIENCES = [
  {
    id: 'rasa',
    title: 'Rasa Group',
    role: 'Senior IT Developer',
    blurb:
      'Currently building and maintaining warehouse, logistics, and operational systems — covering dashboard interfaces, backend APIs, database workflows, and internal automation pipelines.',
    tag: 'Feb 2025 — Present · Cikarang, Bekasi',
    glyph: '✺',
    sort_order: 10,
    is_published: true,
  },
  {
    id: 'ethis',
    title: 'PT. Ethis Fintech Indonesia',
    role: 'Backend Developer',
    blurb:
      'Designed and deployed scalable API services, contributing to end-to-end product delivery using NestJS, MySQL, and TypeORM across multiple fintech product cycles.',
    tag: 'Aug 2022 — Feb 2025 · West Jakarta',
    glyph: '◍',
    sort_order: 20,
    is_published: true,
  },
  {
    id: 'tokokupon',
    title: 'Tokokupon.com',
    role: 'Fullstack Engineer',
    blurb:
      'Built a top-up product end-to-end — frontend flow, service API, and operational backend — using Next.js, NestJS, and MySQL.',
    tag: 'Jul — Sep 2024 · Remote',
    glyph: '❍',
    sort_order: 30,
    is_published: true,
  },
  {
    id: 'adala',
    title: 'adala.id',
    role: 'Backend Developer',
    blurb:
      'Developed scalable inventory APIs and helped shape warehouse product workflows, working on data modeling and backend service design with NestJS and MySQL.',
    tag: 'Jan 2022 — Aug 2022 · Remote',
    glyph: '✦',
    sort_order: 40,
    is_published: true,
  },
];

export const createEmptyExperience = (sortOrder = 10) => ({
  id: '',
  title: '',
  role: '',
  blurb: '',
  tag: '',
  glyph: '✦',
  sort_order: sortOrder,
  is_published: true,
});

export const normalizeExperience = (experience) => ({
  id: String(experience?.id || '').trim(),
  title: String(experience?.title || '').trim(),
  role: String(experience?.role || '').trim(),
  blurb: String(experience?.blurb || '').trim(),
  tag: String(experience?.tag || '').trim(),
  glyph: String(experience?.glyph || '✦').trim() || '✦',
  sort_order: Number(experience?.sort_order) || 0,
  is_published: Boolean(experience?.is_published),
});
