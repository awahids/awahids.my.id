import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useSectionMotion } from '../lib/sectionMotion';

const Footer = ({ isAiLabPage = false }) => {
  const { sectionItem } = useSectionMotion();
  const year = new Date().getFullYear();
  const topBtnRef = useRef(null);
  const secondaryLink = isAiLabPage
    ? { href: '/', label: 'Back to Portfolio' }
    : { href: '/ai-lab', label: 'AI Lab' };

  useEffect(() => {
    const btn = topBtnRef.current;
    if (!btn) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

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
    <motion.footer
      className={isAiLabPage ? 'is-ai-lab-footer' : ''}
      initial="hidden"
      animate="visible"
      variants={sectionItem}
    >
      <div className="footer-top">
        <div className="fc">
          &copy; {year} — CREATED BY <b>A WAHID SAFHADI</b>
        </div>
        <div className="footer-actions">
          <div className="fc">
            FULLSTACK DEVELOPER · BACKEND-FIRST DELIVERY
          </div>
          <a
            href={secondaryLink.href}
            className="footer-link"
            aria-current={isAiLabPage ? 'page' : undefined}
          >
            {secondaryLink.label}
          </a>
        </div>
      </div>
      <div className="footer-wordmark-wrap" aria-hidden="true">
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
    </motion.footer>
  );
};

export default Footer;
