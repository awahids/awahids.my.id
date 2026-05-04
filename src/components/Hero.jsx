import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const KINETIC_WORDS = [
  { text: 'FOCUS', top: '9%', left: '7%' },
  { text: 'PRESENCE', top: '9%', right: '10%' },
  { text: 'LISTEN', top: '18%', left: '22%' },
  { text: 'DECISIONS', top: '18%', right: '24%' },
  { text: 'PROCESS', top: '27%', left: '8%' },
  { text: 'AWARENESS', top: '31%', right: '6%' },
  { text: 'SIMPLIFY', top: '47%', left: '4%' },
  { text: 'REFINE', top: '49%', right: '16%' },
  { text: 'CLARITY', top: '62%', left: '16%' },
  { text: 'SYSTEM', top: '64%', right: '8%' },
  { text: 'TRUTH', top: '78%', left: '10%' },
  { text: 'WISDOM', top: '80%', right: '22%' },
  { text: 'BUILD', top: '86%', left: '34%' },
  { text: 'IMPACT', top: '88%', right: '10%' },
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
  if (!path) return fallback;
  return path;
};

const normalizeProfileItem = (item = {}) => {
  const payload =
    item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)
      ? item.payload
      : {};

  return {
    name: String(item.title || DEFAULT_PROFILE.name).trim(),
    role: String(item.subtitle || DEFAULT_PROFILE.role).trim(),
    eyebrow: String(payload.eyebrow || item.subtitle || DEFAULT_PROFILE.eyebrow).trim(),
    summary: String(item.summary || DEFAULT_PROFILE.summary).trim(),
    secondarySummary: String(payload.secondary_summary || DEFAULT_PROFILE.secondarySummary).trim(),
    signature: String(payload.signature || DEFAULT_PROFILE.signature).trim(),
    ghostTitle: String(payload.ghost_title || DEFAULT_PROFILE.ghostTitle).trim(),
    company: String(payload.company || DEFAULT_PROFILE.company).trim(),
    years: String(payload.years || DEFAULT_PROFILE.years).trim(),
    city: String(payload.city || DEFAULT_PROFILE.city).trim(),
    proofChips: asStringArray(payload.proof_chips, DEFAULT_PROFILE.proofChips),
    ctaPrimaryLabel: String(payload.cta_primary_label || DEFAULT_PROFILE.ctaPrimaryLabel).trim(),
    ctaPrimaryHref: String(payload.cta_primary_href || DEFAULT_PROFILE.ctaPrimaryHref).trim(),
    ctaSecondaryLabel: String(payload.cta_secondary_label || DEFAULT_PROFILE.ctaSecondaryLabel).trim(),
    ctaSecondaryHref: resolveAssetPath(payload.cta_secondary_href, DEFAULT_PROFILE.ctaSecondaryHref),
  };
};

const splitProfileName = (name = '') => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 2) {
    return {
      first: parts.join(' ') || DEFAULT_PROFILE.name,
      last: '',
    };
  }

  return {
    first: parts.slice(0, 2).join(' '),
    last: parts.slice(2).join(' '),
  };
};

const Hero = () => {
  const rootRef = useRef(null);
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const profileName = splitProfileName(profile.name);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let mounted = true;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('cms_items')
        .select('id,title,subtitle,summary,payload,sort_order,is_published')
        .eq('collection', 'profile')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1);

      if (!mounted || error || !data?.length) return;
      setProfile(normalizeProfileItem(data[0]));
    };

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    const hasFinePointer = window.matchMedia(
      '(hover: hover) and (pointer: fine)'
    ).matches;

    if (isMobile) {
      return undefined;
    }

    // Safety conditions
    const lightweightMotion = isMobile || !hasFinePointer;
    const allowHoverInteractions = !prefersReducedMotion && hasFinePointer;
    const allowParallax = allowHoverInteractions && !isMobile;

    let pulseTimer = 0;
    let parallaxRaf = 0;
    let px = 0;
    let py = 0;
    const scrambleIntervals = [];

    // Use GSAP Context for 100% clean React 18 integration and memory management
    const ctx = gsap.context(() => {
      const kineticWords = gsap.utils.toArray('.hero-kinetic-word');

      kineticWords.forEach((word, index) => {
        // Initial setup
        gsap.set(word, { opacity: 0, y: lightweightMotion ? 5 : 10 });

        // Sequence the animations so entrance doesn't overwrite floating setup
        const tl = gsap.timeline({
          delay: lightweightMotion ? 0.04 * index : 0.08 * index
        });

        // 1) Entrance phase
        tl.to(word, {
          opacity: 0.34,
          y: 0,
          duration: lightweightMotion ? 0.4 : 0.6,
          ease: 'power3.out',
        })
          // 2) Floating phase (chained immediately after entrance)
          .to(word, {
            y: lightweightMotion ? `-${2 + (index % 3)}` : `-${4 + (index % 3) * 2}`,
            duration: lightweightMotion ? 3.5 + (index % 2) * 0.4 : 2.5 + (index % 3) * 0.3,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });

        // Setup mouse interactions (opacity only)
        if (allowHoverInteractions) {
          word.addEventListener('mouseenter', () => {
            word.classList.add('is-active');
            gsap.to(word, {
              opacity: 0.65,
              duration: 0.22,
              ease: 'sine.out',
              overwrite: 'auto'
            });
          });

          word.addEventListener('mouseleave', () => {
            word.classList.remove('is-active');
            gsap.to(word, {
              opacity: 0.34,
              duration: 0.28,
              ease: 'sine.inOut',
              overwrite: 'auto'
            });
          });
        }
      });

      // Pulse randomly chosen words with opacity
      const pulseRandomWord = () => {
        if (!kineticWords.length || prefersReducedMotion) return;

        const randomWord = kineticWords[Math.floor(Math.random() * kineticWords.length)];

        // Skip if user is hovering over this word directly
        if (randomWord.classList.contains('is-active')) {
          pulseTimer = window.setTimeout(pulseRandomWord, 500);
          return;
        }

        randomWord.classList.add('is-active');

        gsap.to(randomWord, {
          opacity: 0.55,
          duration: 0.45,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
          overwrite: 'auto',
          onComplete: () => {
            randomWord.classList.remove('is-active');
            // Hard reset to ensure it doesn't get stuck
            gsap.to(randomWord, { opacity: 0.34, duration: 0.2, overwrite: 'auto' });
          },
        });

        pulseTimer = window.setTimeout(
          pulseRandomWord,
          1500 + Math.random() * 2500
        );
      };

      if (!prefersReducedMotion) {
        pulseTimer = window.setTimeout(pulseRandomWord, lightweightMotion ? 800 : 1500);
      }

      // Main specific headings interaction
      if (allowHoverInteractions) {
        const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const headingWords = gsap.utils.toArray('.hn-first, .hn-last, .hn-ghost');

        headingWords.forEach((word) => {
          let localIv;

          word.addEventListener('mouseenter', () => {
            const origText = word.getAttribute('data-text') || word.textContent;

            gsap.fromTo(
              word,
              { opacity: 0.75, y: 3 },
              {
                opacity: 1,
                y: 0,
                duration: 0.35,
                ease: 'power3.out',
                overwrite: 'auto'
              }
            );

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

      // Parallax mouse follow using xPercent/yPercent only!
      const renderParallax = () => {
        const rect = root.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const offsetX = (px - centerX) / Math.max(centerX, 1);
        const offsetY = (py - centerY) / Math.max(centerY, 1);

        kineticWords.forEach((word, index) => {
          const depth = 5 + (index % 5) * 3;
          gsap.to(word, {
            xPercent: offsetX * depth,
            yPercent: offsetY * depth * 0.8,
            duration: 1.2,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        });
        parallaxRaf = 0;
      };

      if (allowParallax) {
        root.addEventListener('pointermove', (event) => {
          const rect = root.getBoundingClientRect();
          px = event.clientX - rect.left;
          py = event.clientY - rect.top;

          if (!parallaxRaf) {
            parallaxRaf = window.requestAnimationFrame(renderParallax);
          }
        }, { passive: true });

        root.addEventListener('pointerleave', () => {
          kineticWords.forEach((word) => {
            gsap.to(word, {
              xPercent: 0,
              yPercent: 0,
              duration: 1.5,
              ease: 'power2.out',
              overwrite: 'auto'
            });
          });
        });
      }

    }, rootRef);

    return () => {
      window.clearTimeout(pulseTimer);
      window.cancelAnimationFrame(parallaxRaf);
      scrambleIntervals.forEach(clearInterval);
      ctx.revert();
    };
  }, []);

  return (
    <section className="hero" id="home" ref={rootRef}>
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

      <div className="hero-glow"></div>

      <div className="hero-left">
        <div className="hero-eyebrow hfi">
          <svg
            className="hero-eyebrow-dot"
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="var(--lime)"
          >
            <circle cx="4" cy="4" r="4" />
          </svg>
          {profile.eyebrow}
        </div>
        <h1 className="hero-name">
          <div className="hw">
            <span className="hi hn-sub">
              {profile.role}
            </span>
          </div>
          <div className="hw">
            <span className="hi hn-first" data-text={profileName.first}>{profileName.first}</span>
          </div>
          {profileName.last && (
            <div className="hw">
              <span className="hi hn-last" data-text={profileName.last}>{profileName.last}</span>
            </div>
          )}
          <div className="hw">
            <span className="hi hn-ghost" data-text={profile.ghostTitle}>{profile.ghostTitle}</span>
          </div>
        </h1>
        <p className="hero-desc hfi">
          {profile.summary}
        </p>
        <p className="hero-desc hero-desc-sub hfi">
          {profile.secondarySummary}
        </p>
        <p className="hero-signature hfi">
          {profile.signature}
        </p>
        <div className="hero-proof hfi">
          {profile.proofChips.map((chip) => (
            <div className="hero-proof-chip" key={chip}>
              <span className="hero-proof-dot"></span>
              {chip}
            </div>
          ))}
        </div>
        <div className="hero-btns hfi">
          <a href={profile.ctaPrimaryHref} className="btn-prime">
            {profile.ctaPrimaryLabel}
          </a>
          <a href={profile.ctaSecondaryHref} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            {profile.ctaSecondaryLabel}
          </a>
        </div>
      </div>

      <div className="hero-right">
        <div style={{ position: 'relative' }}>
          <div className="terminal">
            <div className="term-bar">
              <span className="term-dot td-r"></span>
              <span className="term-dot td-y"></span>
              <span className="term-dot td-g"></span>
              <span className="term-title">~/wahid.config.ts</span>
            </div>
            <div className="term-body">
              <div className="tl">
                <span className="tc-p">const</span> <span className="tc-b">developer</span>{' '}
                <span className="tc-w">= {'{'}</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">name</span>
                <span className="tc-w">:</span>{' '}
                <span className="tc-y">&quot;{profile.name}&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">role</span>
                <span className="tc-w">:</span>{' '}
                <span className="tc-y">&quot;{profile.role}&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">company</span>
                <span className="tc-w">:</span>{' '}
                <span className="tc-y">&quot;{profile.company}&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">years</span>
                <span className="tc-w">:</span> <span className="tc-y">&quot;{profile.years}&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">city</span>
                <span className="tc-w">:</span>{' '}
                <span className="tc-y">&quot;{profile.city}&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">stack</span>
                <span className="tc-w">: [</span>
              </div>
              {profile.proofChips.slice(0, 6).map((chip, index, chips) => (
                <div className="tl" key={`terminal-stack-${chip}`}>
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="tc-y">&quot;{chip}&quot;</span>
                  {index < chips.length - 1 && <span className="tc-w">,</span>}
                </div>
              ))}
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-w">],</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">certified</span>
                <span className="tc-w">:</span>{' '}
                <span className="tc-l">&quot;Backend + Database + API&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">openToWork</span>
                <span className="tc-w">:</span> <span className="tc-l">true</span>
              </div>
              <div className="tl">
                <span className="tc-w">{'}'}</span>
              </div>
              <div className="tl" style={{ marginTop: '8px' }}>
                <span className="tc-g">// execute?</span>{' '}
                <span className="term-cursor"></span>
              </div>
            </div>
          </div>
          <div className="hero-badge">
            <div className="badge-num">{profile.years}</div>
            <div className="badge-txt">Years Exp.</div>
          </div>
        </div>
      </div>

      <div className="scroll-hint">
        <span>Scroll</span>
        <div className="scroll-line"></div>
      </div>
    </section>
  );
};

export default Hero;
