import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

gsap.registerPlugin(CustomEase, SplitText, ScrambleTextPlugin);

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
    const lightweightMotion = isMobile || !hasFinePointer;

    CustomEase.create('heroEase', '0.86,0,0.07,1');
    CustomEase.create('heroMouseEase', '0.25,0.1,0.25,1');

    const splitInstances = [];
    const animations = [];
    const disposers = [];
    let scrambleTimer = 0;
    let parallaxRaf = 0;
    let px = 0;
    let py = 0;

    const addAnimation = (animation) => {
      animations.push(animation);
      return animation;
    };

    const kineticWords = Array.from(root.querySelectorAll('.hero-kinetic-word'));

    kineticWords.forEach((word, index) => {
      if (lightweightMotion) {
        gsap.set(word, { opacity: 0, y: 6 });
        addAnimation(
          gsap.to(word, {
            opacity: 0.3,
            y: 0,
            duration: 0.5,
            ease: 'heroEase',
            delay: 0.05 * index,
          })
        );
      } else {
        const split = new SplitText(word, {
          type: 'chars',
          charsClass: 'hero-kinetic-char',
        });
        splitInstances.push(split);

        gsap.set(split.chars, { opacity: 0, y: 10, filter: 'blur(5px)' });
        addAnimation(
          gsap.to(split.chars, {
            opacity: 0.34,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.62,
            stagger: 0.025,
            ease: 'heroEase',
            delay: 0.08 * index,
          })
        );
      }

      addAnimation(
        gsap.to(word, {
          y: `+=${lightweightMotion ? 2 + (index % 3) : 4 + (index % 4) * 2}`,
          duration: lightweightMotion ? 3.8 + (index % 2) * 0.4 : 2.8 + (index % 3) * 0.35,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: index * 0.14,
        })
      );
    });

    if (!prefersReducedMotion && hasFinePointer) {
      const headingWords = Array.from(
        root.querySelectorAll('.hn-first, .hn-last, .hn-ghost')
      );
      headingWords.forEach((word) => {
        word.dataset.original = word.textContent || '';
        const onEnter = () => {
          addAnimation(
            gsap.to(word, {
              duration: 0.55,
              scrambleText: {
                text: word.dataset.original || '',
                chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
                speed: 0.4,
              },
              ease: 'none',
            })
          );
        };
        word.addEventListener('mouseenter', onEnter);
        disposers.push(() => word.removeEventListener('mouseenter', onEnter));
      });
    }

    const scrambleRandomWord = () => {
      if (!kineticWords.length) return;
      const randomWord =
        kineticWords[Math.floor(Math.random() * kineticWords.length)];
      const original = randomWord.dataset.text || randomWord.textContent || '';

      randomWord.classList.add('is-active');
      addAnimation(
        gsap.to(randomWord, {
          duration: 0.85,
          scrambleText: {
            text: original,
            chars: '■▪▌▐▬',
            revealDelay: 0.25,
            speed: 0.35,
          },
          ease: 'none',
          onComplete: () => randomWord.classList.remove('is-active'),
        })
      );

      scrambleTimer = window.setTimeout(
        scrambleRandomWord,
        900 + Math.random() * 1400
      );
    };

    if (!prefersReducedMotion && !lightweightMotion) {
      scrambleTimer = window.setTimeout(scrambleRandomWord, 1100);
    }

    const renderParallax = () => {
      const rect = root.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const offsetX = (px - centerX) / Math.max(centerX, 1);
      const offsetY = (py - centerY) / Math.max(centerY, 1);

      kineticWords.forEach((word, index) => {
        const depth = 8 + (index % 5) * 3;
        gsap.to(word, {
          x: offsetX * depth,
          y: offsetY * depth * 0.7,
          duration: 0.9,
          ease: 'heroMouseEase',
          overwrite: 'auto',
        });
      });
      parallaxRaf = 0;
    };

    const onPointerMove = (event) => {
      const rect = root.getBoundingClientRect();
      px = event.clientX - rect.left;
      py = event.clientY - rect.top;

      if (!parallaxRaf) {
        parallaxRaf = window.requestAnimationFrame(renderParallax);
      }
    };

    const onPointerLeave = () => {
      kineticWords.forEach((word) => {
        gsap.to(word, {
          x: 0,
          y: 0,
          duration: 1.1,
          ease: 'heroEase',
        });
      });
    };

    if (!prefersReducedMotion && hasFinePointer && !isMobile) {
      root.addEventListener('pointermove', onPointerMove, { passive: true });
      root.addEventListener('pointerleave', onPointerLeave);
      disposers.push(() => root.removeEventListener('pointermove', onPointerMove));
      disposers.push(() => root.removeEventListener('pointerleave', onPointerLeave));
    }

    return () => {
      window.clearTimeout(scrambleTimer);
      window.cancelAnimationFrame(parallaxRaf);

      disposers.forEach((dispose) => dispose());
      animations.forEach((animation) => animation?.kill?.());
      splitInstances.forEach((split) => split?.revert?.());
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
          Backend-first | Open to Opportunities | Cikarang, Bekasi
        </div>
        <h1 className="hero-name">
          <div className="hw">
            <span className="hi hn-sub">Fullstack Developer | Senior Backend Developer</span>
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
          <strong>Architecting high-performance backends</strong> for high-stakes production.
          I bridge the gap between complex data logic and seamless user experiences with
          <em> NestJS, TypeScript, PostgreSQL, and Go</em>.
        </p>
        <div className="hero-proof hfi">
          <div className="hero-proof-chip">
            <span className="hero-proof-dot"></span>
            <b>4+ Years</b> Production Experience
          </div>
          <div className="hero-proof-chip">
            <span className="hero-proof-dot"></span>
            <b>Senior IT Developer</b> at Rasa Group
          </div>
          <div className="hero-proof-chip">
            <span className="hero-proof-dot"></span>
            <b>Certified</b> Backend + Database
          </div>
        </div>
        <div className="hero-btns hfi">
          <a href="#contact" className="btn-prime">
            Hire Me
          </a>
          <a href="#portfolio" className="btn-ghost">
            View Work
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
                <span className="tc-y">&quot;System Architect&quot;</span>
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
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="tc-y">&quot;TypeScript&quot;</span>
                <span className="tc-w">,</span>{' '}
                <span className="tc-y">&quot;NestJS&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="tc-y">&quot;PostgreSQL&quot;</span>
                <span className="tc-w">,</span>{' '}
                <span className="tc-y">&quot;Laravel&quot;</span>
                <span className="tc-w">,</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="tc-y">&quot;Go&quot;</span>
                <span className="tc-w">,</span>{' '}
                <span className="tc-y">&quot;GraphQL Server&quot;</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-w">],</span>
              </div>
              <div className="tl">
                &nbsp;&nbsp;<span className="tc-gr">certified</span>
                <span className="tc-w">:</span>{' '}
                <span className="tc-l">&quot;Backend + Database&quot;</span>
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
