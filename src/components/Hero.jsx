import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import GlyphPortal from './GlyphPortal';
import { openCvDownload } from '../lib/cvDownload';

// ─── Framer Motion Variants ────────────────────────────────────────────────

const heroLeftContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

const chipContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const chipItem = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] } },
};

const photoVariant = {
  hidden: { opacity: 0, x: 32, scale: 0.96 },
  visible: {
    opacity: 1, x: 0, scale: 1,
    transition: { duration: 0.78, ease: [0.16, 1, 0.3, 1], delay: 0.3 },
  },
};

const btnSpring = { type: 'spring', stiffness: 380, damping: 20 };

// ─── Data ─────────────────────────────────────────────────────────────────

const PORTAL_WORD = 'WAHID';
const PORTAL_FONT_TIMEOUT_MS = 2500;

const PROFILE = {
  name: 'A Wahid Safhadi',
  role: 'Fullstack Developer · Backend-First Engineer',
  eyebrow: 'Available for Fullstack Projects',
  summary: 'I build web apps, dashboards, APIs, and business systems from frontend to deployment.',
  secondarySummary:
    'I help teams turn ideas and messy workflows into usable, scalable, production-ready web products.',
  signature: 'I build the interface users click and the backend that survives what they do next.',
  ghostTitle: 'Engineer',
  proofChips: ['Vue.js', 'Next.js', 'Node.js', 'NestJS', 'PostgreSQL', 'Docker'],
  ctaPrimaryLabel: 'View Fullstack Projects',
  ctaPrimaryHref: '#portfolio',
  ctaSecondaryLabel: 'Download Resume',
};

const splitProfileName = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return { first: parts.join(' '), last: '' };
  return { first: parts.slice(0, 2).join(' '), last: parts.slice(2).join(' ') };
};

// ─── Component ────────────────────────────────────────────────────────────

const Hero = () => {
  const profile = PROFILE;
  const [fontReady, setFontReady] = useState(false);
  const profileName = splitProfileName(profile.name);
  const reduced = useReducedMotion();

  // Build reduced-motion-safe variants
  const safe = (v) => reduced ? { hidden: {}, visible: {} } : v;

  // GlyphPortal freezes its font at mount and disables the scroll effect if the face isn't loaded yet.
  useEffect(() => {
    let cancelled = false;
    const finish = () => { if (!cancelled) setFontReady(true); };
    if (!document.fonts?.load) { finish(); return undefined; }
    const timer = window.setTimeout(finish, PORTAL_FONT_TIMEOUT_MS);
    document.fonts.load(`900 100px 'Unbounded'`, PORTAL_WORD).then(finish, finish);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div id="home" style={fontReady ? undefined : { minHeight: '100svh' }}>
    {fontReady && <GlyphPortal
      word={PORTAL_WORD}
      className="hero-portal"
      fontFamily="'Unbounded', sans-serif"
      fontWeight={900}
      enterLabel="Enter Portfolio"
      hint="Scroll to step inside."
      style={{
        '--gp-paper': 'var(--dark)',
        '--gp-ink': 'var(--white)',
        '--gp-field': 'var(--dark)',
        '--gp-foreground': 'var(--white)',
      }}
      background={
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, transform: 'scale(var(--gp-field-scale,1))' }}>
          {/* base — grid on flat dark, this is what stays once the hero content is revealed */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              backgroundColor: 'var(--dark)',
            }}
          />
          {/* glow — lights the WAHID cutout while scrolling, fades out as the hero content reveals */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(140% 120% at 50% 45%, rgba(200,255,0,.4), rgba(200,255,0,.16) 55%, rgba(200,255,0,0) 85%)',
              opacity: 'calc(1 - var(--gp-reveal, 0))',
            }}
          />
        </div>
      }
      front={
        <div className="hero-portal-front">
          <div className="hero-eyebrow">
            <svg className="hero-eyebrow-dot" width="8" height="8" viewBox="0 0 8 8" fill="var(--lime)">
              <circle cx="4" cy="4" r="4" />
            </svg>
            {profile.eyebrow}
          </div>
        </div>
      }
    >
      <div className="hero-portal-grid">
        {/* ── LEFT — orchestrated stagger entrance ── */}
        <motion.div
          className="hero-left"
          variants={safe(heroLeftContainer)}
          initial="hidden"
          animate="visible"
        >
          {/* Name — role + last name + ghost title (first name is shown via the portal) */}
          <motion.h2 className="hero-portal-name" variants={safe(fadeUp)}>
            <span className="hn-sub">{profile.role}</span>
            {profileName.first && <span className="hn-first">{profileName.first}</span>}
            {profileName.last && <span className="hn-last">{profileName.last}</span>}
            <span className="hn-ghost">{profile.ghostTitle}</span>
          </motion.h2>

          {/* Descriptions */}
          <motion.p className="hero-desc" variants={safe(fadeUp)}>
            {profile.summary}
          </motion.p>
          <motion.p className="hero-desc hero-desc-sub" variants={safe(fadeUp)}>
            {profile.secondarySummary}
          </motion.p>
          <motion.p className="hero-signature" variants={safe(fadeUp)}>
            {profile.signature}
          </motion.p>

          {/* Tech stack chips — stagger left slide-in */}
          <motion.div className="hero-proof" variants={safe(chipContainer)}>
            {profile.proofChips.map((chip) => (
              <motion.div className="hero-proof-chip" key={chip} variants={safe(chipItem)}>
                <span className="hero-proof-dot" />
                {chip}
              </motion.div>
            ))}
          </motion.div>

          {/* CTA buttons — whileHover + whileTap spring */}
          <motion.div className="hero-btns" variants={safe(fadeUp)}>
            <motion.a
              href={profile.ctaPrimaryHref}
              className="btn-prime"
              whileHover={reduced ? {} : { scale: 1.05 }}
              whileTap={reduced ? {} : { scale: 0.96 }}
              transition={btnSpring}
            >
              {profile.ctaPrimaryLabel}
            </motion.a>
            <motion.a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              whileHover={reduced ? {} : { scale: 1.05 }}
              whileTap={reduced ? {} : { scale: 0.96 }}
              transition={btnSpring}
              onClick={(event) => { event.preventDefault(); openCvDownload('hero'); }}
            >
              {profile.ctaSecondaryLabel}
            </motion.a>
          </motion.div>
        </motion.div>

        {/* ── RIGHT — photo ── */}
        <motion.div
          className="hero-right"
          variants={safe(photoVariant)}
          initial="hidden"
          animate="visible"
        >
          <div className="hero-photo-wrap">
            <div className="hero-photo-frame">
              <img
                src={`${import.meta.env.BASE_URL}img/aw.png`}
                alt="A Wahid Safhadi"
                className="hero-photo-img"
                draggable="false"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </GlyphPortal>}
    </div>
  );
};

export default Hero;
