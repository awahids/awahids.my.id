import React, { useEffect, useRef, useState } from 'react';
import { gsap, Flip, DUR, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion';
import { useTextScramble } from '../lib/useTextScramble';
import { useGsapReveal } from '../lib/useGsapReveal';

const certs = [
  {
    issuer: 'GLINTS X BINAR',
    name: 'Backend Developer, Learn to make API using JavaScript (Node.js) and ExpressJS framework for 3 months',
    year: 'Dec 2021'
  },
  {
    issuer: 'ORACLE ACADEMY',
    name: 'Programming Database with SQL',
    year: 'Sep 2021'
  },
  {
    issuer: 'ORACLE ACADEMY',
    name: 'Design Database',
    year: 'Aug 2021'
  },
  {
    issuer: 'PROGATE',
    name: 'Javascript Course',
    year: 'Jul 2021'
  },
  {
    issuer: 'PROGATE',
    name: 'Sass Course',
    year: 'Jul 2021'
  }
];

const Certificates = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [showAllMobile, setShowAllMobile] = useState(false);
  const gridRef = useRef(null);
  const sectionRef = useRef(null);
  const flipStateRef = useRef(null);

  useTextScramble(sectionRef);
  useGsapReveal(sectionRef);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 720px)');
    const syncViewport = (event) => {
      const nextIsMobile = Boolean(event.matches);
      setIsMobile((prevIsMobile) => {
        if (prevIsMobile !== nextIsMobile) setShowAllMobile(!nextIsMobile);
        return nextIsMobile;
      });
    };
    syncViewport(mediaQuery);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', syncViewport);
    } else {
      mediaQuery.addListener(syncViewport);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', syncViewport);
      } else {
        mediaQuery.removeListener(syncViewport);
      }
    };
  }, []);

  // GSAP hover: lift + icon spin
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;

    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (prefersReducedMotion() || !hasFinePointer) return undefined;

    const cards = Array.from(grid.querySelectorAll('.cert-card'));
    const cleanups = [];

    cards.forEach((card) => {
      const icon = card.querySelector('.cert-icon');

      const onEnter = () => {
        gsap.to(card, { y: -10, scale: 1.025, duration: 0.32, ease: 'power3.out', overwrite: 'auto' });
        if (icon) gsap.to(icon, { rotation: 12, scale: 1.12, duration: 0.32, ease: 'back.out(2)', overwrite: 'auto' });
      };
      const onLeave = () => {
        gsap.to(card, { y: 0, scale: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
        if (icon) gsap.to(icon, { rotation: 0, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      };

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mouseleave', onLeave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [isMobile]);

  // Flip: record where the cards are, let React add/remove cards, then animate
  // from the old layout to the new one. Added cards pop in.
  const toggleShowAll = () => {
    if (gridRef.current && !prefersReducedMotion()) {
      flipStateRef.current = Flip.getState(gridRef.current.querySelectorAll('.cert-card'));
    }
    setShowAllMobile((prev) => !prev);
  };

  useIsoLayoutEffect(() => {
    const state = flipStateRef.current;
    flipStateRef.current = null;
    if (!state || !gridRef.current) return undefined;

    const flip = Flip.from(state, {
      targets: gridRef.current.querySelectorAll('.cert-card'),
      duration: DUR.slow,
      ease: 'power3.inOut',
      onEnter: (cards) =>
        gsap.fromTo(cards,
          { opacity: 0, y: 24, scale: 0.95 },
          { opacity: 1, y: 0, scale: 1, duration: DUR.base, stagger: 0.08, delay: 0.1, clearProps: 'transform' }),
    });
    return () => flip.kill();
  }, [showAllMobile]);

  const visibleCerts = isMobile && !showAllMobile ? certs.slice(0, 3) : certs;

  return (
    <section className="s-cert" id="certificates">
      <div ref={sectionRef}>
        <div className="s-eyebrow" data-gsap-reveal="left">
          // <span data-scramble="RECOGNITIONS">RECOGNITIONS</span>
        </div>
        <h2 className="s-title" data-gsap-reveal="split">
          Licenses & <span className="s-outline">Certificates</span>
        </h2>
        <div className="section-lime-rule" data-gsap-reveal="line" />
        <p className="cert-intro" data-gsap-reveal="up">
          Supporting credentials across backend development, database systems,
          JavaScript, and cloud fundamentals.
        </p>

        <div className="cert-grid" ref={gridRef}>
          {visibleCerts.map((c, i) => (
            <div key={i} className="notch-surface cert-card" data-gsap-reveal="pop">
              <div className="cert-icon">
                <svg viewBox="0 0 24 24" data-gsap-reveal="draw">
                  <path d="M12 15l-2 5 2 2 2-2-2-5z" />
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <circle cx="12" cy="11" r="4" />
                </svg>
              </div>
              <div className="cert-issuer">{c.issuer}</div>
              <div className="cert-year">{c.year}</div>
              <h3 className="cert-name">{c.name}</h3>
              <div className="cert-card-view">
                <span>View Details</span> ↗
              </div>
            </div>
          ))}
        </div>

        {isMobile && certs.length > 3 && (
          <button
            type="button"
            className="cert-mobile-toggle"
            onClick={toggleShowAll}
          >
            {showAllMobile ? 'Show Less' : `View More (${certs.length - 3})`}
          </button>
        )}
      </div>
    </section>
  );
};

export default Certificates;
