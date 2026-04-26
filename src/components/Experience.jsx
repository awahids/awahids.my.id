import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const journeyData = {
  rasa: {
    title: 'Rasa Group',
    blurb: 'Senior IT Developer — built and maintained warehouse, logistics, and operational systems across dashboard interfaces, backend APIs, database workflows, and internal automation.',
    tag: 'Feb 2025 — Present · Cikarang, Bekasi',
    glyph: '✺'
  },
  ethis: {
    title: 'PT. Ethis Fintech Indonesia',
    blurb: 'Backend Developer — designed and deployed scalable API services and contributed to end-to-end product delivery with NestJS, MySQL, and TypeORM.',
    tag: 'Aug 2022 — Feb 2025 · West Jakarta',
    glyph: '◍'
  },
  tokokupon: {
    title: 'Tokokupon.com',
    blurb: 'Fullstack Engineer — built top-up product across frontend flow, service API, and operational backend using Next.js, NestJS, and MySQL.',
    tag: 'Jul — Sep 2024 · Remote',
    glyph: '❍'
  },
  adala: {
    title: 'adala.id',
    blurb: 'Backend Developer — developed scalable inventory APIs and helped shape warehouse product workflows with NestJS and MySQL.',
    tag: 'Jan 2022 — Aug 2022 · Remote',
    glyph: '✦'
  }
};

const Experience = () => {
  const [activeId, setActiveId] = useState('rasa');
  const { viewport, sectionContainer, sectionItem, staggerTight } =
    useSectionMotion();
  const d = journeyData[activeId];

  return (
    <section className="s-exp" id="experience">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="s-eyebrow" variants={sectionItem}>
          // CAREER_LOG
        </motion.div>
        <motion.div className="journey-head" variants={sectionItem}>
          <h2 className="journey-title">
            The <span className="j-badge">journey</span>.<br />
            Backend-first <span className="j-serif">mindset</span>.<br />
            Fullstack in <span className="j-stroke">practice</span>.
          </h2>
          <div className="journey-meta">
            BASED IN CIKARANG, BEKASI <span className="j-dot">●</span><br />
          </div>
        </motion.div>

        <motion.div className="journey-layout" variants={sectionItem}>
          <motion.div className="journey-nav" variants={staggerTight}>
            {Object.keys(journeyData).map((id, index) => (
              <motion.button
                key={id}
                type="button"
                className={`journey-item ${activeId === id ? 'active' : ''}`}
                onMouseEnter={() => setActiveId(id)}
                onFocus={() => setActiveId(id)}
                onClick={() => setActiveId(id)}
                variants={sectionItem}
              >
                <div className="journey-item-left">
                  <span className="journey-item-num">0{index + 1}</span>
                  <span className="journey-item-title">{journeyData[id].title}</span>
                </div>
                <span className="journey-item-arrow">↗</span>
              </motion.button>
            ))}
          </motion.div>

          <motion.div className="journey-console" variants={sectionItem}>
            <div className="journey-console-head">
              <div className="journey-lights">
                <span></span><span></span><span></span>
              </div>
              <div className="journey-path">~/career/{activeId}.log</div>
              <div className="journey-running">RUNNING_CMD</div>
            </div>
            <div className="journey-body">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div className="journey-glyph">{d.glyph}</div>
                  <div>
                    <div className="journey-role">// role</div>
                    <h3 className="journey-company">{d.title}</h3>
                  </div>
                  <div>
                    <p className="journey-quote">"{d.blurb}"</p>
                    <div className="journey-tag-wrap">
                      <span className="journey-tag">{d.tag}</span>
                    </div>
                    <div className="journey-command"><b>$</b> cat ./{activeId}.md<span className="journey-cursor">▌</span></div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Experience;
