export const DEFAULT_EXPERIENCES = [
  {
    id: 'rasa',
    title: 'Rasa Group',
    role: 'Senior IT Developer',
    blurb:
      'Senior IT Developer — built and maintained warehouse, logistics, and operational systems across dashboard interfaces, backend APIs, database workflows, and internal automation.',
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
      'Backend Developer — designed and deployed scalable API services and contributed to end-to-end product delivery with NestJS, MySQL, and TypeORM.',
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
      'Fullstack Engineer — built top-up product across frontend flow, service API, and operational backend using Next.js, NestJS, and MySQL.',
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
      'Backend Developer — developed scalable inventory APIs and helped shape warehouse product workflows with NestJS and MySQL.',
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
