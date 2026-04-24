import React from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const Footer = ({ isAiLabPage = false }) => {
  const { sectionItem } = useSectionMotion();
  const year = new Date().getFullYear();
  const secondaryLink = isAiLabPage
    ? { href: '/', label: 'Back to Portfolio' }
    : { href: '/ai-lab', label: 'AI Lab' };

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
