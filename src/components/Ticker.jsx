import React from 'react';

/* ── Track 1 · Tech stack — terminal style on lime background ── */
const TECH_ITEMS = [
  'React', 'Next.js', 'TypeScript', 'Node.js', 'NestJS',
  'Laravel', 'PostgreSQL', 'MySQL', 'Prisma', 'Docker',
  'Vercel', 'Nginx', 'Cloudflare', 'GraphQL', 'Redis', 'Git',
];

/* ── Track 2 · Capabilities — output label style on dark background ── */
const CAPABILITY_ITEMS = [
  'End-to-End Delivery',
  'Zero Downtime Deploy',
  'API-First Architecture',
  'Business Logic Layer',
  'Auth & Permissions',
  'Dashboard Interfaces',
  'Database Modeling',
  'Production-Ready',
  'Fullstack Ownership',
  'CI/CD Workflows',
];

const Ticker = () => (
  <div className="ticker-wrap" aria-hidden="true">
    {/* ── Row 1: tech stack → ── */}
    <div className="ticker ticker-is-lime">
      <div className="ticker-track">
        {[...TECH_ITEMS, ...TECH_ITEMS, ...TECH_ITEMS].map((tech, i) => (
          <span key={i} className="t-item">
            <span className="t-prefix">$</span>
            {tech}
            <span className="t-sep">//</span>
          </span>
        ))}
      </div>
    </div>

    {/* ── Row 2: capabilities ← ── */}
    <div className="ticker ticker-is-dark">
      <div className="ticker-track ticker-track-rev">
        {[...CAPABILITY_ITEMS, ...CAPABILITY_ITEMS, ...CAPABILITY_ITEMS].map((cap, i) => (
          <span key={i} className="t-item t-cap">
            <span className="t-arrow">→</span>
            {cap}
          </span>
        ))}
      </div>
    </div>
  </div>
);

export default Ticker;
