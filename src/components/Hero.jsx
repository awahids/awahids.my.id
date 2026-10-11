import React, { useCallback, useEffect, useRef, useState } from 'react';
import GlyphPortal from './GlyphPortal';
import { openCvDownload } from '../lib/cvDownload';
import { gsap, SplitText, DUR, EASE_TEXT, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion';

// ─── Data ─────────────────────────────────────────────────────────────────

const PORTAL_WORD = 'WAHID';
const PORTAL_FONT_TIMEOUT_MS = 2500;
// Portal progress at which the hero content starts fading in (GlyphPortal reveals over 0.78–0.9).
const PORTAL_REVEAL_AT = 0.8;

const PROFILE = {
  name: 'A Wahid Saphadi',
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
  const rootRef = useRef(null);
  const introRef = useRef(null);

  // GlyphPortal freezes its font at mount and disables the scroll effect if the face isn't loaded yet.
  useEffect(() => {
    let cancelled = false;
    const finish = () => { if (!cancelled) setFontReady(true); };
    if (!document.fonts?.load) { finish(); return undefined; }
    const timer = window.setTimeout(finish, PORTAL_FONT_TIMEOUT_MS);
    document.fonts.load(`900 100px 'Unbounded'`, PORTAL_WORD).then(finish, finish);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, []);

  // Entrance — built paused once the grid mounts, played when the portal
  // actually reveals the content (playing on mount would run it unseen).
  useIsoLayoutEffect(() => {
    if (!fontReady || !rootRef.current || prefersReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      const name = SplitText.create('.hn-first, .hn-last', { type: 'lines,words,chars', mask: 'lines' });
      // Chars keep their transform (SplitText owns them); everything else clears it.
      introRef.current = gsap.timeline({ paused: true })
        .from('.hn-sub', { opacity: 0, x: -20, duration: DUR.base, clearProps: 'transform' })
        .from(name.chars, {
          yPercent: 115, rotate: 6, transformOrigin: '0% 100%',
          duration: 0.9, ease: EASE_TEXT, stagger: 0.025,
        }, 0.05)
        .from('.hn-ghost', { opacity: 0, x: 60, duration: 1.1, ease: EASE_TEXT, clearProps: 'transform' }, 0.25)
        .from('.hero-left > *:not(.hero-portal-name):not(.hero-proof)', { opacity: 0, y: 22, stagger: 0.08, clearProps: 'transform' }, 0.35)
        .from('.hero-proof-chip', { opacity: 0, x: -14, duration: DUR.fast * 1.5, stagger: 0.05, clearProps: 'transform' }, 0.55)
        .from('.hero-right', { opacity: 0, x: 32, scale: 0.96, duration: DUR.slow, clearProps: 'transform' }, 0.2);
    }, rootRef);

    // Portal effect off (reduced motion, or its first frame came too late): the
    // content sits in normal reading flow, so play straight away. The portal
    // decides on its first rendered frame — it always starts out "off" — so
    // check only after a couple of frames, and keep watching after that.
    const portal = rootRef.current.querySelector('[data-gp-motion]');
    const playIfStatic = () => {
      if (portal?.dataset.gpMotion === 'off') introRef.current?.play();
    };
    let observer = null;
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => {
        playIfStatic();
        observer = portal ? new MutationObserver(playIfStatic) : null;
        observer?.observe(portal, { attributes: true, attributeFilter: ['data-gp-motion'] });
      });
    });

    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      introRef.current = null;
      ctx.revert();
    };
  }, [fontReady]);

  const handlePortalProgress = useCallback((progress) => {
    if (progress >= PORTAL_REVEAL_AT) introRef.current?.play();
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <div id="home" ref={rootRef} style={fontReady ? undefined : { minHeight: '100svh' }}>
    {fontReady && <GlyphPortal
      word={PORTAL_WORD}
      className="hero-portal"
      fontFamily="'Unbounded', sans-serif"
      fontWeight={900}
      enterLabel="Enter Portfolio"
      hint="Scroll to step inside."
      onProgress={handlePortalProgress}
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
        <div className="hero-left">
          {/* Name — role + last name + ghost title (first name is shown via the portal) */}
          <h2 className="hero-portal-name">
            <span className="hn-sub">{profile.role}</span>
            {profileName.first && <span className="hn-first">{profileName.first}</span>}
            {profileName.last && <span className="hn-last">{profileName.last}</span>}
            <span className="hn-ghost">{profile.ghostTitle}</span>
          </h2>

          {/* Descriptions */}
          <p className="hero-desc">
            {profile.summary}
          </p>
          <p className="hero-desc hero-desc-sub">
            {profile.secondarySummary}
          </p>
          <p className="hero-signature">
            {profile.signature}
          </p>

          {/* Tech stack chips — stagger left slide-in */}
          <div className="hero-proof">
            {profile.proofChips.map((chip) => (
              <div className="hero-proof-chip" key={chip}>
                <span className="hero-proof-dot" />
                {chip}
              </div>
            ))}
          </div>

          {/* CTA buttons */}
          <div className="hero-btns">
            <a href={profile.ctaPrimaryHref} className="btn-prime">
              {profile.ctaPrimaryLabel}
            </a>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              onClick={(event) => { event.preventDefault(); openCvDownload('hero'); }}
            >
              {profile.ctaSecondaryLabel}
            </a>
          </div>
        </div>

        {/* ── RIGHT — photo ── */}
        <div className="hero-right">
          <div className="hero-photo-wrap">
            <div className="hero-photo-frame">
              <img
                src={`${import.meta.env.BASE_URL}img/aw.png`}
                alt="A Wahid Saphadi"
                className="hero-photo-img"
                draggable="false"
              />
            </div>
          </div>
        </div>
      </div>
    </GlyphPortal>}
    </div>
  );
};

export default Hero;
