import React, { useEffect, useRef, useState } from 'react';
import { gsap, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion';
import { useGsapReveal } from '../lib/useGsapReveal';
import { useTextScramble } from '../lib/useTextScramble';

const OFFERINGS = [
  {
    title: 'Web Applications',
    desc: 'Responsive interfaces with clean component structure, smooth user flows, and frontend code that stays maintainable past v1.',
  },
  {
    title: 'Admin Dashboards',
    desc: 'Internal platforms your operations team will actually use — role-based, data-rich, built around real business workflows.',
  },
  {
    title: 'Backend APIs',
    desc: 'REST APIs built for production: auth, business rules, database relationships, and third-party integrations that hold under load.',
  },
  {
    title: 'Automation & Integration',
    desc: 'Webhook-driven pipelines, scheduled jobs, and API integrations that eliminate repetitive manual work across systems.',
  },
  {
    title: 'Architecture',
    desc: 'Database schemas, service boundaries, and role models designed to stay clean and readable as the product grows.',
  },
  {
    title: 'Deployment Setup',
    desc: 'Production-ready deployment — Vercel, Docker, Nginx, VPS — repeatable, stable, and CI/CD-friendly from day one.',
  },
];

// Desktop with motion allowed: the cards become a sticky stack instead of a grid.
const STACK_QUERY = '(min-width: 961px) and (prefers-reduced-motion: no-preference)';
// How far the previous card shrinks and fades as the next one slides over it.
const STACK_SCALE = 0.94;
const STACK_DIM = 0.35;

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};

const WhatIBuild = () => {
  const gridRef = useRef(null);
  const sectionRef = useRef(null);

  const stacked = useMediaQuery(STACK_QUERY);

  useGsapReveal(sectionRef);
  useTextScramble(sectionRef);

  // Stacking: each card is CSS-sticky; as the next card slides up over it,
  // the covered card is scrubbed down in scale and its text dims.
  useIsoLayoutEffect(() => {
    const grid = gridRef.current;
    if (!grid || !stacked) return undefined;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.build-card', grid);
      cards.forEach((card, index) => {
        const next = cards[index + 1];
        if (!next) return;
        // Scrub only while the next card actually slides over this one: from
        // when its top meets this card's stuck bottom edge until it sticks.
        const top = (el) => parseFloat(getComputedStyle(el).top) || 0;
        gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: next,
            start: () => `top ${top(card) + card.offsetHeight}px`,
            end: () => `top ${top(next)}px`,
            scrub: 0.3,
            invalidateOnRefresh: true,
          },
        })
          .to(card, { scale: STACK_SCALE }, 0)
          .to(card.querySelectorAll('.build-card-title, .build-card-desc'), { opacity: STACK_DIM }, 0);
      });
    }, grid);

    return () => ctx.revert();
  }, [stacked]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid || prefersReducedMotion()) return undefined;

    const cards = grid.querySelectorAll('.build-card');
    const cleanups = [];

    cards.forEach((card) => {
      const numEl = card.querySelector('.build-card-num');
      // In the stack, scale belongs to the scroll scrub — hover only moves the number.
      const onEnter = () => {
        if (!stacked) gsap.to(card, { scale: 1.03, duration: 0.28, ease: 'power2.out', overwrite: 'auto' });
        if (numEl) gsap.to(numEl, { color: 'var(--lime)', x: 5, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
      };
      const onLeave = () => {
        if (!stacked) gsap.to(card, { scale: 1, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
        if (numEl) gsap.to(numEl, { color: '', x: 0, duration: 0.28, ease: 'power3.out', overwrite: 'auto' });
      };
      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mouseleave', onLeave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [stacked]);

  return (
    <section className="s-build" id="services">
      <div ref={sectionRef}>
        <div className="s-build-bg-label" data-gsap-reveal="fade-up" aria-hidden="true">BUILD</div>
        <div className="s-eyebrow" data-gsap-reveal="left">
          // <span data-scramble="WHAT_I_BUILD">WHAT_I_BUILD</span>
        </div>
        <h2 className="s-title" data-gsap-reveal="split">
          End-to-End Web Product Development
        </h2>
        <div className="section-lime-rule" data-gsap-reveal="line" />
        <p className="build-intro" data-gsap-reveal="up">
          Full-product development across every layer — from the interface users see to the backend that keeps it running in production.
        </p>

        <div className={`build-grid${stacked ? ' is-stacked' : ''}`} ref={gridRef}>
          {OFFERINGS.map((item, index) => (
            <article
              className="notch-surface build-card"
              key={item.title}
              // Stacked cards arrive by sliding over the previous one — no pop reveal.
              data-gsap-reveal={stacked ? undefined : 'pop'}
              style={stacked ? { '--stack-i': index } : undefined}
            >
              <div className="build-card-num">{`0${index + 1}`}</div>
              <h3 className="build-card-title">{item.title}</h3>
              <p className="build-card-desc">{item.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatIBuild;
