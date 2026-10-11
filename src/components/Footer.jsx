import React, { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { useGsapReveal } from '../lib/useGsapReveal';

const FOOTER_LINKS = [
  { href: '/', label: 'Portfolio' },
  { href: '/ai-lab', label: 'AI Lab' },
  { href: '/readme-generator', label: 'README Generator' },
  { href: '/prd-generator', label: 'PRD Generator' },
];

const Footer = ({ isAiLabPage = false }) => {
  const year = new Date().getFullYear();
  const footerRef = useRef(null);
  const topBtnRef = useRef(null);
  useGsapReveal(footerRef);

  useEffect(() => {
    const btn = topBtnRef.current;
    if (!btn || prefersReducedMotion()) return undefined;

    const onEnter = () => gsap.to(btn, { scale: 1.14, rotation: -20, duration: 0.25, ease: 'back.out(2)' });
    const onLeave = () => gsap.to(btn, { scale: 1, rotation: 0, duration: 0.32, ease: 'power3.out' });

    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mouseleave', onLeave);
    return () => {
      btn.removeEventListener('mouseenter', onEnter);
      btn.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <footer ref={footerRef} className={isAiLabPage ? 'is-ai-lab-footer' : ''}>
      <div className="footer-top" data-gsap-reveal="up">
        <div className="fc">
          &copy; {year} — CREATED BY <b>A WAHID SAPHADI</b>
        </div>
        <div className="footer-actions">
          <div className="fc">
            FULLSTACK DEVELOPER · BACKEND-FIRST ENGINEER
          </div>
          <nav className="footer-links" aria-label="More from this site">
            {FOOTER_LINKS.map(({ href, label }) => {
              const current = href === (isAiLabPage ? '/ai-lab' : '/');
              return (
                <a
                  key={href}
                  href={href}
                  className="footer-link"
                  aria-current={current ? 'page' : undefined}
                >
                  {label}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="footer-wordmark-wrap" aria-hidden="true" data-gsap-reveal="up">
        <div className="footer-wordmark">awahids</div>
      </div>
      <button
        ref={topBtnRef}
        className="floating-top-btn"
        data-scroll-target="#home"
        aria-label="Scroll to top"
        type="button"
      >
        ↑
      </button>
    </footer>
  );
};

export default Footer;
