import React, { useRef } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion';

// Seconds per loop at rest, and how hard scroll speed pushes the rows.
const LOOP_SECONDS = [32, 44];
const MAX_BOOST = 5;
const MAX_SKEW = 6;

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

// Each track holds three copies, so sliding a third of its width loops seamlessly.
// Scrolling speeds the rows up (and flips them when scrolling back up) and leans
// them into the motion; both ease back to rest once scrolling stops.
const useScrollTicker = (rootRef) => {
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return undefined;

    const ctx = gsap.context((self) => {
      const tracks = gsap.utils.toArray('.ticker-track', root);
      const loops = tracks.map((track, i) => {
        const reverse = track.classList.contains('ticker-track-rev');
        return gsap.fromTo(track,
          { xPercent: reverse ? -100 / 3 : 0 },
          { xPercent: reverse ? 0 : -100 / 3, duration: LOOP_SECONDS[i] ?? 40, ease: 'none', repeat: -1 });
      });
      let direction = 1;

      self.add('react', (velocity, scrollDirection) => {
        direction = scrollDirection;
        const boost = gsap.utils.clamp(0, MAX_BOOST, Math.abs(velocity) / 400);
        loops.forEach((loop) => {
          gsap.timeline()
            .to(loop, { timeScale: (1 + boost) * direction, duration: 0.2, ease: 'power2.out', overwrite: true })
            .to(loop, { timeScale: direction, duration: 1.2, ease: 'power2.out' });
        });
        gsap.timeline()
          .to(tracks, { skewX: gsap.utils.clamp(-MAX_SKEW, MAX_SKEW, -velocity / 300), duration: 0.2, overwrite: true })
          .to(tracks, { skewX: 0, duration: 0.8, ease: 'power3.out' });
      });

      ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        // Off screen the rows just stop — no work while nobody can see them.
        onToggle: ({ isActive }) => loops.forEach((loop) => loop.paused(!isActive)),
        onUpdate: (st) => self.react(st.getVelocity(), st.direction),
      });
    }, root);

    return () => ctx.revert();
  }, [rootRef]);
};

const Ticker = () => {
  const rootRef = useRef(null);
  useScrollTicker(rootRef);

  return (
    <div className="ticker-wrap" aria-hidden="true" ref={rootRef}>
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
};

export default Ticker;
