import React from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const certs = [
  {
    issuer: 'GLINTS X BINAR',
    name: 'Backend Developer, Learn to make API using JavaScript (Node.js) and ExpressJS framework for 3 months',
    year: 'Dec 2021'
  },
  {
    issuer: 'ORACLE ACADEMY',
    name: 'Pemroggraming Database with SQL',
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
  const { viewport, sectionContainer, sectionItem, staggerGrid } =
    useSectionMotion();

  return (
    <section className="s-cert" id="certificates">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="s-eyebrow" variants={sectionItem}>
          // RECOGNITIONS
        </motion.div>
        <motion.h2 className="s-title" variants={sectionItem}>
          Licenses & <span className="s-outline">Certificates</span>
        </motion.h2>
        <motion.p className="cert-intro" variants={sectionItem} style={{ color: 'rgba(255,255,255,0.4)', marginTop: '12px', fontSize: '14px', maxWidth: '600px' }}>
          Evidence of continuous learning and technical validation in backend development, 
          database architecture, and modern programming standards.
        </motion.p>

        <motion.div
          className="cert-grid"
          variants={staggerGrid}
        >
          {certs.map((c, i) => (
            <motion.div
              key={i}
              className="cert-card"
              variants={sectionItem}
            >
              <div className="cert-icon">
                <svg viewBox="0 0 24 24">
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
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Certificates;
