import React from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const Footer = () => {
  const { sectionItem } = useSectionMotion();

  return (
    <motion.footer
      initial="hidden"
      animate="visible"
      variants={sectionItem}
    >
      <div className="fc">
        &copy; {new Date().getFullYear()} — CREATED BY <b>A WAHID SAFHADI</b>
      </div>
      <div className="fc">
        BACKEND ENGINEER · FULLSTACK SYSTEMS
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
