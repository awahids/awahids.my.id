import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { BOOKING_URL } from '../lib/links';

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

const CV_URL = `${import.meta.env.BASE_URL}cv/my-cv.pdf`;

const PROOF_CHIPS = [
  'Vue.js',
  'Next.js',
  'Node.js',
  'NestJS',
  'PostgreSQL',
  'Docker',
  'Vercel',
];

const Hero = () => {
  const rootRef = useRef(null);

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
          const origText = word.getAttribute('data-text') || word.textContent;
          if (!word.hasAttribute('data-text')) {
             word.setAttribute('data-text', origText);
          }

          let localIv;

          word.addEventListener('mouseenter', () => {
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
          FULLSTACK DEVELOPER · BACKEND-FIRST · CIKARANG, BEKASI
        </div>
        <h1 className="hero-name">
          <div className="hw">
            <span className="hi hn-sub">
              Fullstack Developer · Backend-First Engineer
            </span>
          </div>
          <div className="hw">
            <span className="hi hn-first">A Wahid</span>
          </div>
          <div className="hw">
            <span className="hi hn-last">Safhadi</span>
          </div>
          <div className="hw">
            <span className="hi hn-ghost">Engineer</span>
          </div>
        </h1>
        <p className="hero-desc hfi">
          I build web apps, dashboards, APIs, and business systems from frontend to deployment.
          I build the interface users click and the backend that survives what they do next.
        </p>
        <div className="hero-proof hfi">
          {PROOF_CHIPS.map((chip) => (
            <div className="hero-proof-chip" key={chip}>
              <span className="hero-proof-dot"></span>
              {chip}
            </div>
          ))}
        </div>
        <div className="hero-btns hfi">
          <a href="#portfolio" className="btn-prime">
            View Fullstack Projects
          </a>
          <a href={CV_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost">
            Download Resume
          </a>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn-inline">
            Discuss a Project ↗
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
                <span className="tc-y">&quot;A Wahid Safhadi&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">role</span>
                <span className="tc-w">:</span>{' '}
                <span className="tc-y">&quot;Fullstack Developer&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">company</span>
                <span className="tc-w">:</span>{' '}
                <span className="tc-y">&quot;Rasa Group&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">years</span>
                <span className="tc-w">:</span> <span className="tc-y">&quot;4+&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">city</span>
                <span className="tc-w">:</span>{' '}
                <span className="tc-y">&quot;Cikarang, Bekasi&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">stack</span>
                <span className="tc-w">: [</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="tc-y">&quot;React&quot;</span>
                <span className="tc-w">,</span>{' '}
                <span className="tc-y">&quot;Next.js&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="tc-y">&quot;Node.js&quot;</span>
                <span className="tc-w">,</span>{' '}
                <span className="tc-y">&quot;NestJS&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="tc-y">&quot;PostgreSQL&quot;</span>
                <span className="tc-w">,</span>{' '}
                <span className="tc-y">&quot;Docker&quot;</span>
              </div>
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
            <div className="badge-num">4+</div>
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
