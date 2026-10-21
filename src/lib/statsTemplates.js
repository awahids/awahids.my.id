import { isCardTheme } from './cardThemes.js';

// The optional README sections a stats template can switch on. `id` is what
// the AI answers with; `field` is the generator setting it maps to. The core
// stats cards (streak, stats, top languages, activity graph) are always on
// once there is a username, so they are not listed.
export const STATS_SECTIONS = [
  { id: 'trophies', field: 'showTrophies', label: 'Trophy row' },
  { id: 'repo_cards', field: 'showRepoCards', label: 'Pinned repo cards' },
  { id: 'snake', field: 'showSnake', label: 'Contribution snake' },
  { id: 'code_stats', field: 'showCodeStats', label: 'Lines of code' },
  { id: 'visitor_counter', field: 'showVisitorCounter', label: 'Visitor counter' },
];

const SECTION_IDS = new Set(STATS_SECTIONS.map((section) => section.id));

// Curated starting points. `fits` tells both the visitor and the AI who each
// one is for, so the AI picks from the same list the page shows.
export const STATS_TEMPLATES = [
  {
    id: 'minimal',
    name: 'Minimal',
    fits: 'New or quiet profiles: just the core stats cards, nothing that can look empty.',
    sections: [],
    theme: 'github_dark',
    lightTheme: 'light',
  },
  {
    id: 'showcase',
    name: 'Project showcase',
    fits: 'Open-source authors with a few repos worth pinning and some stars.',
    sections: ['repo_cards', 'trophies'],
    theme: 'tokyonight',
    lightTheme: 'light',
  },
  {
    id: 'daily_coder',
    name: 'Daily coder',
    fits: 'People who commit often: the snake and trophies show off a busy contribution graph.',
    sections: ['snake', 'trophies'],
    theme: 'dracula',
    lightTheme: 'light',
  },
  {
    id: 'code_volume',
    name: 'Code volume',
    fits: 'Many repos and a broad stack: counts lines of code per language across public repos.',
    sections: ['code_stats', 'trophies'],
    theme: 'nord',
    lightTheme: 'light',
  },
  {
    id: 'everything',
    name: 'Everything',
    fits: 'Active profiles that want every section: cards, trophies, snake, lines of code and a visitor counter.',
    sections: ['repo_cards', 'trophies', 'snake', 'code_stats', 'visitor_counter'],
    theme: 'radical',
    lightTheme: 'light',
  },
];

export const STATS_TEMPLATE_IDS = STATS_TEMPLATES.map((template) => template.id);

export const findStatsTemplate = (id) => STATS_TEMPLATES.find((template) => template.id === id) || null;

/** Known section ids only, deduplicated, in the order given. */
export const cleanSectionIds = (ids) =>
  [...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id).trim().toLowerCase()))].filter((id) =>
    SECTION_IDS.has(id)
  );

/**
 * The generator settings for a layout: every section flag (on if listed, off
 * otherwise) plus the themes when they are known card themes.
 */
export const statsLayoutSettings = ({ sections = [], theme, lightTheme } = {}) => {
  const enabled = new Set(cleanSectionIds(sections));
  const settings = Object.fromEntries(STATS_SECTIONS.map((section) => [section.field, enabled.has(section.id)]));
  if (isCardTheme(theme)) settings.theme = theme;
  if (lightTheme === '' || isCardTheme(lightTheme)) settings.lightTheme = lightTheme === theme ? '' : lightTheme;
  return settings;
};
