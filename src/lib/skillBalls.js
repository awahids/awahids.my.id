/**
 * The skill balls in the Skills playground: official logo paths + brand colours
 * from simple-icons (each icon is tree-shaken in on its own, ~1 KB).
 */
import {
  siReact,
  siNextdotjs,
  siTypescript,
  siJavascript,
  siVuedotjs,
  siTailwindcss,
  siNodedotjs,
  siNestjs,
  siLaravel,
  siGo,
  siPostgresql,
  siMysql,
  siMongodb,
  siPrisma,
  siDocker,
  siVercel,
  siNginx,
  siCloudflare,
  siN8n,
  siClaude,
} from 'simple-icons';

const ICONS = [
  siReact, siNextdotjs, siTypescript, siJavascript, siVuedotjs,
  siTailwindcss, siNodedotjs, siNestjs, siLaravel, siGo,
  siPostgresql, siMysql, siMongodb, siPrisma, siDocker,
  siVercel, siNginx, siCloudflare, siN8n, siClaude,
];

const luminance = (hex) => {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

// Near-black brands (Next.js, Vercel, Prisma…) would vanish on the dark
// section, so they get a lifted graphite ball instead of pure black.
const ballColor = (hex) => (luminance(hex) < 0.08 ? '#2b2b2b' : `#${hex}`);

export const SKILL_BALLS = ICONS.map(({ title, hex, path }) => {
  const color = ballColor(hex);
  return {
    name: title,
    path, // 24×24 SVG path
    color,
    logo: luminance(color.slice(1)) > 0.6 ? '#111111' : '#ffffff',
  };
});
