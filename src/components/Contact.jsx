import React from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';
import { BOOKING_URL } from '../lib/links';

const CV_URL = `${import.meta.env.BASE_URL}cv/my-cv.pdf`;

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
          <motion.div variants={sectionItem}>
            <motion.h2 className="contact-headline" variants={sectionItem}>
              Have a web app,<br />
              dashboard, or <em>backend system</em><br />
              to build<span>?</span>
            </motion.h2>
            <motion.p className="contact-kicker" variants={sectionItem}>
              Tell me what you&apos;re building, what&apos;s breaking, or what needs to scale.
              I can help with fullstack development, backend architecture, workflow automation, and deployment.
            </motion.p>
            <motion.div className="contact-top-actions" variants={sectionItem}>
              <a
                href={BOOKING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-top-link is-prime"
              >
                Start a Project Conversation
              </a>
              <a href="#portfolio" data-scroll-target="#portfolio" className="contact-top-link">
                View Fullstack Projects
              </a>
            </motion.div>
          </motion.div>
          <motion.div className="contact-badge" variants={sectionItem}>
            <div className="contact-badge-icon">
              <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M9 13h6" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M9 17h6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="contact-badge-text">
              <span className="contact-badge-name">Curriculum Vitae</span>
              <span className="contact-badge-role">PDF Resume</span>
            </div>
            <a href={CV_URL} target="_blank" rel="noopener noreferrer" className="contact-badge-link">Download Resume ↗</a>
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
              <div className="status-pulse"></div> AVAILABLE FOR FULLSTACK PROJECTS
            </div>
          </motion.div>

          <motion.div className="contact-card" variants={sectionItem}>
            <div className="cc-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 7v6l4 2" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="cc-lbl">AVAILABILITY</div>
            <div className="cc-loc">Open for build, scale, or modernization work.</div>
            <div className="cc-bullet-list">
              <div>Web apps and admin dashboards</div>
              <div>Backend APIs and system workflows</div>
              <div>Automation and production deployment</div>
            </div>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="cc-soc-link">
              <strong>DISCUSS PROJECT</strong> <span>Book a call ↗</span>
            </a>
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
