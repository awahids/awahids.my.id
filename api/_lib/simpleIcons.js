import fs from 'node:fs';

const MANIFEST_URL = new URL(import.meta.resolve('simple-icons/icons.json'));

// Shorthand codes (as used by skillicons.dev / this project's README) that
// don't match their Simple Icons slug directly.
const ICON_ALIASES = {
  bash: 'gnubash',
  html: 'html5',
  js: 'javascript',
  md: 'markdown',
  nextjs: 'nextdotjs',
  nodejs: 'nodedotjs',
  postgres: 'postgresql',
  tailwind: 'tailwindcss',
  ts: 'typescript',
};

let manifestBySlug = null;
const loadManifest = () => {
  if (manifestBySlug) return manifestBySlug;
  const entries = JSON.parse(fs.readFileSync(MANIFEST_URL, 'utf8'));
  manifestBySlug = new Map(entries.map((icon) => [icon.slug, icon]));
  return manifestBySlug;
};

const extractPathData = (svgMarkup) => svgMarkup.match(/<path d="([^"]+)"/)?.[1] || null;

/**
 * Resolves a shorthand code (e.g. "js", "vscode") to its Simple Icons
 * artwork. A handful of brands (Heroku, VS Code, PowerShell) were pulled
 * from Simple Icons over trademark policy, so those resolve with
 * `path: null` and the caller renders a text fallback instead.
 */
export const resolveIcon = (rawCode) => {
  const code = String(rawCode || '').trim().toLowerCase();
  if (!code) return null;

  const slug = ICON_ALIASES[code] || code;
  const manifest = loadManifest();
  const meta = manifest.get(slug);
  if (!meta) return { slug: code, title: code, hex: null, path: null };

  try {
    const iconUrl = new URL(import.meta.resolve(`simple-icons/icons/${slug}.svg`));
    const svgMarkup = fs.readFileSync(iconUrl, 'utf8');
    return { slug, title: meta.title, hex: meta.hex, path: extractPathData(svgMarkup) };
  } catch {
    return { slug, title: meta.title, hex: meta.hex, path: null };
  }
};
