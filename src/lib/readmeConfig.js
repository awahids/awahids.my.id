import { CARD_THEMES, DEFAULT_THEME } from './cardThemes.js';
import { DEFAULT_HIGHLIGHT_LANGS } from './codeStatsWorkflow.js';
import { DEFAULT_SKILL_IDS, isSkillIcon } from './skillIcons.js';

// Every README generator setting, in the same shape as the form state. The
// URL only carries what differs from these, so a fresh page has no query.
export const DEFAULT_CONFIG = {
  username: '',
  pinnedReposText: '',
  showVisitorCounter: false,
  showCodeStats: false,
  codeStatsLangsText: DEFAULT_HIGHLIGHT_LANGS.join(', '),
  showRepoCards: false,
  showSnake: false,
  showTrophies: false,
  taglineText: 'Hello, There! 👋\nNice to meet you!',
  bioText: '',
  skillIds: DEFAULT_SKILL_IDS,
  socials: { github: '', linkedin: '', instagram: '', email: '', website: '' },
  theme: DEFAULT_THEME,
  lightTheme: '',
  typing: { font: 'mono', bold: false, speed: 'normal', align: 'center', size: 30, color: '' },
};

// A codec turns a value into its query string form and back. `parse`
// returns undefined for input it rejects, which keeps the default.
const text = (max) => ({ format: String, parse: (raw) => raw.slice(0, max) });
const bool = { format: (value) => (value ? '1' : '0'), parse: (raw) => raw === '1' };
const oneOf = (options) => ({ format: String, parse: (raw) => (options.includes(raw) ? raw : undefined) });
const intRange = (min, max) => ({
  format: String,
  parse: (raw) => {
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : undefined;
  },
});
const hex = { format: String, parse: (raw) => raw.replace(/[^0-9a-f]/gi, '').slice(0, 6) };
const skillList = {
  format: (ids) => ids.join(','),
  parse: (raw) => [...new Set(raw.split(',').filter(isSkillIcon))],
};

const THEME_IDS = Object.keys(CARD_THEMES);

// [query param, path into the config, codec]. Short params keep shared links short.
const FIELDS = [
  ['u', 'username', text(100)],
  ['repos', 'pinnedReposText', text(500)],
  ['vc', 'showVisitorCounter', bool],
  ['loc', 'showCodeStats', bool],
  ['langs', 'codeStatsLangsText', text(300)],
  ['rc', 'showRepoCards', bool],
  ['snake', 'showSnake', bool],
  ['tr', 'showTrophies', bool],
  ['tag', 'taglineText', text(500)],
  ['bio', 'bioText', text(2000)],
  ['skills', 'skillIds', skillList],
  ['gh', 'socials.github', text(100)],
  ['li', 'socials.linkedin', text(100)],
  ['ig', 'socials.instagram', text(100)],
  ['em', 'socials.email', text(200)],
  ['web', 'socials.website', text(300)],
  ['theme', 'theme', oneOf(THEME_IDS)],
  ['light', 'lightTheme', oneOf(['', ...THEME_IDS])],
  ['font', 'typing.font', oneOf(['mono', 'sans', 'serif'])],
  ['bold', 'typing.bold', bool],
  ['speed', 'typing.speed', oneOf(['slow', 'normal', 'fast'])],
  ['align', 'typing.align', oneOf(['left', 'center', 'right'])],
  ['size', 'typing.size', intRange(14, 60)],
  ['color', 'typing.color', hex],
];

const getPath = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);

const setPath = (object, path, value) => {
  const keys = path.split('.');
  const last = keys.pop();
  keys.reduce((parent, key) => parent[key], object)[last] = value;
};

/** Query-string syntax (no leading "#" or "?") for every setting that differs from the defaults. */
export const encodeConfig = (config) => {
  const params = new URLSearchParams();
  for (const [param, path, codec] of FIELDS) {
    const value = codec.format(getPath(config, path) ?? getPath(DEFAULT_CONFIG, path));
    if (value !== codec.format(getPath(DEFAULT_CONFIG, path))) params.set(param, value);
  }
  return params.toString();
};

/**
 * A full config from query-string syntax (the URL hash): defaults, overridden by every param
 * that parses. Unknown params and invalid values are ignored, so a hand-edited
 * or outdated link still opens.
 */
export const decodeConfig = (search = '') => {
  const params = new URLSearchParams(search);
  const config = structuredClone(DEFAULT_CONFIG);
  for (const [param, path, codec] of FIELDS) {
    if (!params.has(param)) continue;
    const value = codec.parse(params.get(param));
    if (value !== undefined) setPath(config, path, value);
  }
  return config;
};
