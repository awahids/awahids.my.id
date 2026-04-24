import React from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const offerings = [
  {
    title: 'Web Applications',
    desc: 'Responsive web apps with clean interfaces, maintainable architecture, and business-focused workflows.',
  },
  {
    title: 'Admin Dashboards',
    desc: 'Operational dashboards for users, stock, reporting, approvals, and role-based business processes.',
  },
  {
    title: 'Backend APIs',
    desc: 'REST APIs, authentication, authorization, business rules, and robust data integration layers.',
  },
  {
    title: 'Automation & Integration',
    desc: 'Webhook pipelines, third-party API integrations, and workflow automation for real operations.',
  },
  {
    title: 'Database Architecture',
    desc: 'Schema design, query optimization, and data integrity strategy for long-term scalability.',
  },
  {
    title: 'Deployment Setup',
    desc: 'Production deployment and runtime setup with Vercel, Docker, VPS, Nginx, and Cloudflare.',
  },
];

const WhatIBuild = () => {
  const { viewport, sectionContainer, sectionItem, staggerGrid } = useSectionMotion();

  return (
    <section className="s-build" id="services">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="s-eyebrow" variants={sectionItem}>
          // WHAT_I_BUILD
        </motion.div>
        <motion.h2 className="s-title" variants={sectionItem}>
          End-to-End <span className="s-outline">Delivery</span>
        </motion.h2>
        <motion.p className="build-intro" variants={sectionItem}>
          I help teams build complete products across frontend, backend, database,
          integration, and deployment.
        </motion.p>

        <motion.div className="build-grid" variants={staggerGrid}>
          {offerings.map((item, index) => (
            <motion.article className="build-card" key={item.title} variants={sectionItem}>
              <div className="build-card-num">{`0${index + 1}`}</div>
              <h3 className="build-card-title">{item.title}</h3>
              <p className="build-card-desc">{item.desc}</p>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default WhatIBuild;
