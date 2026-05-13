import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, useSpring } from 'framer-motion';
import gsap from 'gsap';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

// ─── Framer Motion Variants ────────────────────────────────────────────────

const heroLeftContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

const nameContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11 } },
};

const clipUp = {
  hidden: { y: '108%' },
  visible: { y: 0, transition: { type: 'spring', stiffness: 58, damping: 15 } },
};

const chipContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const chipItem = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
};

const photoVariant = {
  hidden: { opacity: 0, x: 32, scale: 0.96 },
  visible: {
    opacity: 1, x: 0, scale: 1,
    transition: { duration: 0.78, ease: [0.22, 1, 0.36, 1], delay: 0.3 },
  },
};

const statContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 1.05 } },
};

const statItem = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
};

const btnSpring = { type: 'spring', stiffness: 380, damping: 20 };

// ─── Data ─────────────────────────────────────────────────────────────────

const KINETIC_WORDS = [
  { text: 'FOCUS',     top: '9%',  left: '7%'   },
  { text: 'PRESENCE',  top: '9%',  right: '10%' },
  { text: 'LISTEN',    top: '18%', left: '22%'  },
  { text: 'DECISIONS', top: '18%', right: '24%' },
  { text: 'PROCESS',   top: '27%', left: '8%'   },
  { text: 'AWARENESS', top: '31%', right: '6%'  },
  { text: 'SIMPLIFY',  top: '47%', left: '4%'   },
  { text: 'REFINE',    top: '49%', right: '16%' },
  { text: 'CLARITY',   top: '62%', left: '16%'  },
  { text: 'SYSTEM',    top: '64%', right: '8%'  },
  { text: 'TRUTH',     top: '78%', left: '10%'  },
  { text: 'WISDOM',    top: '80%', right: '22%' },
  { text: 'BUILD',     top: '86%', left: '34%'  },
  { text: 'IMPACT',    top: '88%', right: '10%' },
];

const DEFAULT_PROFILE = {
  name: 'A Wahid Safhadi',
  role: 'Fullstack Developer · Backend-First Engineer',
  eyebrow: 'FULLSTACK DEVELOPER · BACKEND-FIRST ENGINEER',
  summary: 'I build web apps, dashboards, APIs, and business systems from frontend to deployment.',
  secondarySummary:
    'I help teams turn ideas and messy workflows into usable, scalable, production-ready web products.',
  signature: 'I build the interface users click and the backend that survives what they do next.',
  ghostTitle: 'Engineer',
  company: 'Rasa Group',
  years: '4+',
  city: 'Cikarang, Bekasi',
  proofChips: ['Vue.js', 'Next.js', 'Node.js', 'NestJS', 'PostgreSQL', 'Docker'],
  ctaPrimaryLabel: 'View Fullstack Projects',
  ctaPrimaryHref: '#portfolio',
  ctaSecondaryLabel: 'Download Resume',
  ctaSecondaryHref: `${import.meta.env.BASE_URL}cv/my-cv.pdf`,
};

const asStringArray = (value, fallback) => {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => String(item || '').trim()).filter(Boolean);
  return items.length ? items : fallback;
};

const resolveAssetPath = (value, fallback) => {
  const path = String(value || '').trim();
  return path || fallback;
};

const normalizeProfileItem = (item = {}) => {
  const payload =
    item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)
      ? item.payload : {};
  return {
    name:              String(item.title || DEFAULT_PROFILE.name).trim(),
    role:              String(item.subtitle || DEFAULT_PROFILE.role).trim(),
    eyebrow:           String(payload.eyebrow || item.subtitle || DEFAULT_PROFILE.eyebrow).trim(),
    summary:           String(item.summary || DEFAULT_PROFILE.summary).trim(),
    secondarySummary:  String(payload.secondary_summary || DEFAULT_PROFILE.secondarySummary).trim(),
    signature:         String(payload.signature || DEFAULT_PROFILE.signature).trim(),
    ghostTitle:        String(payload.ghost_title || DEFAULT_PROFILE.ghostTitle).trim(),
    company:           String(payload.company || DEFAULT_PROFILE.company).trim(),
    years:             String(payload.years || DEFAULT_PROFILE.years).trim(),
    city:              String(payload.city || DEFAULT_PROFILE.city).trim(),
    proofChips:        asStringArray(payload.proof_chips, DEFAULT_PROFILE.proofChips),
    ctaPrimaryLabel:   String(payload.cta_primary_label || DEFAULT_PROFILE.ctaPrimaryLabel).trim(),
    ctaPrimaryHref:    String(payload.cta_primary_href || DEFAULT_PROFILE.ctaPrimaryHref).trim(),
    ctaSecondaryLabel: String(payload.cta_secondary_label || DEFAULT_PROFILE.ctaSecondaryLabel).trim(),
    ctaSecondaryHref:  resolveAssetPath(payload.cta_secondary_href, DEFAULT_PROFILE.ctaSecondaryHref),
  };
};

const splitProfileName = (name = '') => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 2) return { first: parts.join(' ') || DEFAULT_PROFILE.name, last: '' };
  return { first: parts.slice(0, 2).join(' '), last: parts.slice(2).join(' ') };
};

// ─── Component ────────────────────────────────────────────────────────────

const Hero = () => {
  const rootRef   = useRef(null);
  const badgeRef  = useRef(null);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const profileName = splitProfileName(profile.name);
  const reduced = useReducedMotion();

  // Scroll parallax
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ['start start', 'end start'] });
  const rawLeftY   = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -120]);
  const rawRightY  = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -70]);
  const rawOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const leftY      = useSpring(rawLeftY,   { stiffness: 60, damping: 18 });
  const rightY     = useSpring(rawRightY,  { stiffness: 60, damping: 18 });
  const heroOpacity = useSpring(rawOpacity, { stiffness: 60, damping: 18 });

  // Build reduced-motion-safe variants
  const safe = (v) => reduced ? { hidden: {}, visible: {} } : v;

  // ── Supabase profile load
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;
    let mounted = true;
    const load = async () => {
      const { data, error } = await supabase
        .from('cms_items')
        .select('id,title,subtitle,summary,payload,sort_order,is_published')
        .eq('collection', 'profile').eq('is_published', true)
        .order('sort_order', { ascending: true }).order('created_at', { ascending: true })
        .limit(1);
      if (!mounted || error || !data?.length) return;
      setProfile(normalizeProfileItem(data[0]));
    };
    load();
    return () => { mounted = false; };
  }, []);

  // ── GSAP: kinetic words + parallax + scramble (unchanged)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (isMobile) return undefined;

    const lightweightMotion = !hasFinePointer;
    const allowHoverInteractions = !prefersReducedMotion && hasFinePointer;
    const allowParallax = allowHoverInteractions;

    let pulseTimer = 0;
    let parallaxRaf = 0;
    let px = 0, py = 0;
    const scrambleIntervals = [];

    const ctx = gsap.context(() => {
      const kineticWords = gsap.utils.toArray('.hero-kinetic-word');

      kineticWords.forEach((word, index) => {
        gsap.set(word, { opacity: 0, y: lightweightMotion ? 5 : 10 });
        const tl = gsap.timeline({ delay: lightweightMotion ? 0.04 * index : 0.08 * index });
        tl.to(word, { opacity: 0.34, y: 0, duration: lightweightMotion ? 0.4 : 0.6, ease: 'power3.out' })
          .to(word, {
            y: lightweightMotion ? `-${2 + (index % 3)}` : `-${4 + (index % 3) * 2}`,
            duration: lightweightMotion ? 3.5 + (index % 2) * 0.4 : 2.5 + (index % 3) * 0.3,
            ease: 'sine.inOut', repeat: -1, yoyo: true,
          });

        if (allowHoverInteractions) {
          word.addEventListener('mouseenter', () => {
            word.classList.add('is-active');
            gsap.to(word, { opacity: 0.65, duration: 0.22, ease: 'sine.out', overwrite: 'auto' });
          });
          word.addEventListener('mouseleave', () => {
            word.classList.remove('is-active');
            gsap.to(word, { opacity: 0.34, duration: 0.28, ease: 'sine.inOut', overwrite: 'auto' });
          });
        }
      });

      const pulseRandomWord = () => {
        if (!kineticWords.length || prefersReducedMotion) return;
        const randomWord = kineticWords[Math.floor(Math.random() * kineticWords.length)];
        if (randomWord.classList.contains('is-active')) {
          pulseTimer = window.setTimeout(pulseRandomWord, 500); return;
        }
        randomWord.classList.add('is-active');
        gsap.to(randomWord, {
          opacity: 0.55, duration: 0.45, yoyo: true, repeat: 1, ease: 'sine.inOut', overwrite: 'auto',
          onComplete: () => {
            randomWord.classList.remove('is-active');
            gsap.to(randomWord, { opacity: 0.34, duration: 0.2, overwrite: 'auto' });
          },
        });
        pulseTimer = window.setTimeout(pulseRandomWord, 1500 + Math.random() * 2500);
      };
      if (!prefersReducedMotion) {
        pulseTimer = window.setTimeout(pulseRandomWord, lightweightMotion ? 800 : 1500);
      }

      if (allowHoverInteractions) {
        const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const headingWords = gsap.utils.toArray('.hn-first, .hn-last, .hn-ghost');
        headingWords.forEach((word) => {
          let localIv;
          word.addEventListener('mouseenter', () => {
            const origText = word.getAttribute('data-text') || word.textContent;
            gsap.fromTo(word, { opacity: 0.75, y: 3 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
            if (localIv) clearInterval(localIv);
            let i = 0;
            localIv = setInterval(() => {
              word.textContent = origText.split('').map((c, j) => {
                if (j < i) return origText[j];
                if (c === ' ') return ' ';
                return CHARS[Math.floor(Math.random() * CHARS.length)];
              }).join('');
              if (i++ >= origText.length) clearInterval(localIv);
            }, 28);
            scrambleIntervals.push(localIv);
          });
        });
      }

      const renderParallax = () => {
        const rect = root.getBoundingClientRect();
        const cx = rect.width / 2, cy = rect.height / 2;
        const ox = (px - cx) / Math.max(cx, 1);
        const oy = (py - cy) / Math.max(cy, 1);
        kineticWords.forEach((word, index) => {
          const depth = 5 + (index % 5) * 3;
          gsap.to(word, { xPercent: ox * depth, yPercent: oy * depth * 0.8, duration: 1.2, ease: 'power2.out', overwrite: 'auto' });
        });
        parallaxRaf = 0;
      };

      if (allowParallax) {
        root.addEventListener('pointermove', (e) => {
          const rect = root.getBoundingClientRect();
          px = e.clientX - rect.left;
          py = e.clientY - rect.top;
          if (!parallaxRaf) parallaxRaf = window.requestAnimationFrame(renderParallax);
        }, { passive: true });

        root.addEventListener('pointerleave', () => {
          kineticWords.forEach((word) => {
            gsap.to(word, { xPercent: 0, yPercent: 0, duration: 1.5, ease: 'power2.out', overwrite: 'auto' });
          });
        });
      }
    }, root);

    return () => {
      window.clearTimeout(pulseTimer);
      window.cancelAnimationFrame(parallaxRaf);
      scrambleIntervals.forEach(clearInterval);
      ctx.revert();
    };
  }, []);

  // ── GSAP: badge float + glow (starts after FM entrance completes)
  useEffect(() => {
    const el = badgeRef.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const float = gsap.to(el, {
      y: -8, duration: 2.8, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 1.8,
    });
    const glow = gsap.to(el, {
      boxShadow: '0 0 22px 5px rgba(200,255,0,0.35)',
      duration: 2.0, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: 2.2,
    });

    return () => { float.kill(); glow.kill(); };
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <section className="hero" id="home" ref={rootRef}>
      {/* Kinetic background words */}
      <div className="hero-kinetic-bg" aria-hidden="true">
        {KINETIC_WORDS.map((word) => (
          <span
            key={`${word.text}-${word.top}-${word.left || word.right}`}
            className="hero-kinetic-word"
            data-text={word.text}
            style={{ top: word.top, left: word.left, right: word.right }}
          >
            {word.text}
          </span>
        ))}
      </div>

      <div className="hero-glow" aria-hidden="true" />

      {/* ── LEFT — orchestrated stagger entrance ── */}
      <motion.div
        className="hero-left"
        variants={safe(heroLeftContainer)}
        initial="hidden"
        animate="visible"
        style={{ y: leftY }}
      >
        {/* Eyebrow */}
        <motion.div className="hero-eyebrow" variants={safe(fadeUp)}>
          <svg className="hero-eyebrow-dot" width="8" height="8" viewBox="0 0 8 8" fill="var(--lime)">
            <circle cx="4" cy="4" r="4" />
          </svg>
          {profile.eyebrow}
        </motion.div>

        {/* Name — each line clips up from overflow:hidden container */}
        <motion.h1 className="hero-name" variants={safe(nameContainer)}>
          <div className="hw">
            <motion.span className="hi hn-sub" variants={safe(clipUp)}>
              {profile.role}
            </motion.span>
          </div>
          <div className="hw">
            <motion.span className="hi hn-first" data-text={profileName.first} variants={safe(clipUp)}>
              {profileName.first}
            </motion.span>
          </div>
          {profileName.last && (
            <div className="hw">
              <motion.span className="hi hn-last" data-text={profileName.last} variants={safe(clipUp)}>
                {profileName.last}
              </motion.span>
            </div>
          )}
          <div className="hw">
            <motion.span className="hi hn-ghost" data-text={profile.ghostTitle} variants={safe(clipUp)}>
              {profile.ghostTitle}
            </motion.span>
          </div>
        </motion.h1>

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
            href={profile.ctaSecondaryHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            whileHover={reduced ? {} : { scale: 1.05 }}
            whileTap={reduced ? {} : { scale: 0.96 }}
            transition={btnSpring}
          >
            {profile.ctaSecondaryLabel}
          </motion.a>
        </motion.div>
      </motion.div>

      {/* ── RIGHT — photo + floating stat cards ── */}
      <motion.div
        className="hero-right"
        variants={safe(photoVariant)}
        initial="hidden"
        animate="visible"
        style={{ y: rightY }}
      >
        <motion.div
          className="hero-photo-wrap"
          variants={safe(statContainer)}
          initial="hidden"
          animate="visible"
        >
          <div className="hero-photo-frame">
            <img
              src={`${import.meta.env.BASE_URL}img/aw.png`}
              alt="A Wahid Safhadi"
              className="hero-photo-img"
              draggable="false"
            />
          </div>

          <motion.div className="hero-stat-card hsc-exp" ref={badgeRef} variants={safe(statItem)}>
            <div className="hsc-num">{profile.years}</div>
            <div className="hsc-lbl">Years Exp.</div>
          </motion.div>

          <motion.div className="hero-stat-card hsc-proj" variants={safe(statItem)}>
            <div className="hsc-num">20+</div>
            <div className="hsc-lbl">Projects Shipped</div>
          </motion.div>

          <motion.div className="hero-stat-card hsc-remote" variants={safe(statItem)}>
            <div className="hsc-pulse-row">
              <div className="status-pulse" />
              <span>Open to Remote</span>
            </div>
            <div className="hsc-sublbl">Fullstack · Backend-First</div>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div className="scroll-hint" style={{ opacity: heroOpacity }}>
        <span>Scroll</span>
        <div className="scroll-line" />
      </motion.div>
    </section>
  );
};

export default Hero;
