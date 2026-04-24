import React from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const Contact = () => {
  const { viewport, sectionContainer, sectionItem, staggerGrid } =
    useSectionMotion();

  return (
    <section className="s-contact" id="contact">
      <motion.div
        className="contact-inner"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="contact-top" variants={sectionItem}>
          <motion.h2 className="contact-headline" variants={sectionItem}>
            Got a <em>project?</em><br />
            Let's build it<span>.</span>
          </motion.h2>
          <motion.div className="contact-badge" variants={sectionItem}>
            <div className="contact-badge-icon">
              <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M9 13h6" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M9 17h6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="contact-badge-text">
              <span className="contact-badge-name">Curriculum Vitae</span>
              <span className="contact-badge-role">PDF Resume</span>
            </div>
            <a href="/assets/cv/my-cv.pdf" target="_blank" rel="noopener noreferrer" className="contact-badge-link">Open CV ↗</a>
          </motion.div>
        </motion.div>

        <motion.div className="contact-grid" variants={staggerGrid}>
          <motion.div className="contact-card" variants={sectionItem}>
            <div className="cc-icon">
              <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m3 7 12 6 9-6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="cc-lbl">EMAIL</div>
            <a href="mailto:awahid.safhadi@gmail.com" className="cc-val">awahid.safhadi@gmail.com</a>
            <div className="cc-remote">
              <div className="status-pulse"></div> AVAILABLE FOR FREELANCE
            </div>
          </motion.div>

          <motion.div className="contact-card" variants={sectionItem}>
            <div className="cc-icon">
              <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l2.12-2.12a5 5 0 0 0-7.07-7.07L11.4 5.53" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M14 11a5 5 0 0 0-7.54-.54L4.34 12.6a5 5 0 0 0 7.07 7.07l1.18-1.18" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="cc-lbl">SOCIALS</div>
            <div className="cc-soc-list">
              <a href="https://github.com/awahids" target="_blank" rel="noopener noreferrer" className="cc-soc-link">
                <strong>GITHUB</strong> <span>@awahids ↗</span>
              </a>
              <a href="https://linkedin.com/in/awahid" target="_blank" rel="noopener noreferrer" className="cc-soc-link">
                <strong>LINKEDIN</strong> <span>/in/awahid ↗</span>
              </a>
              <a href="https://blog.awahids.my.id" target="_blank" rel="noopener noreferrer" className="cc-soc-link">
                <strong>BLOG</strong> <span>awahids.my.id ↗</span>
              </a>
            </div>
          </motion.div>

          <motion.div className="contact-card" variants={sectionItem}>
            <div className="cc-icon">
              <svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="cc-lbl">LOCATION</div>
            <div className="cc-loc">Cikarang, Bekasi,<br />Jawa Barat</div>
            <div className="cc-remote">
              <div className="status-pulse"></div> OPEN TO REMOTE
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Contact;
