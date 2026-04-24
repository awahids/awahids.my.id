import React from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const skillsData = [
  {
    name: 'Frontend Layer',
    prof: 'UI + Client Experience',
    num: '01',
    chips: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'HTML', 'CSS', 'Vue.js'],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    )
  },
  {
    name: 'Backend Layer',
    prof: 'API + Business Logic',
    num: '02',
    chips: ['Node.js', 'NestJS', 'ExpressJS', 'Laravel', 'Golang', 'Gin Gonic', 'TypeORM', 'Prisma'],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M20 7h-7L10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/></svg>
    )
  },
  {
    name: 'Database Layer',
    prof: 'Data + Reliability',
    num: '03',
    chips: ['PostgreSQL', 'MySQL', 'MongoDB', 'Sequelize', 'Prisma ORM', 'GORM'],
    icon: (
      <svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
    )
  },
  {
    name: 'Deployment & Automation',
    prof: 'Production Operations',
    num: '04',
    chips: ['Docker', 'Vercel', 'VPS', 'Nginx', 'Cloudflare', 'n8n', 'Git', 'Postman', 'JWT'],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
    )
  }
];

const Skills = () => {
  const { viewport, sectionContainer, sectionItem, staggerGrid } =
    useSectionMotion();

  return (
    <section className="s-skills" id="skills">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="s-eyebrow" variants={sectionItem}>
          // TECH_STACK_BY_LAYER
        </motion.div>
        <div className="skills-copy">
          <motion.h2 className="skills-copy-title" variants={sectionItem}>
            Fullstack Capability <em>by Layer</em>.
          </motion.h2>
          <motion.span className="skills-copy-sub" variants={sectionItem}>
            Frontend, backend, database, deployment.
          </motion.span>
          <motion.p className="skills-copy-desc" variants={sectionItem}>
            Structured stack used to ship complete products, from UI experience and API
            architecture to data modeling and production operations.
          </motion.p>
        </div>

        <motion.div
          className="skills-grid"
          variants={staggerGrid}
        >
          {skillsData.map((skill, index) => (
            <motion.div
              key={index}
              className="skill-card"
              variants={sectionItem}
            >
              <div className="skill-card-icon">{skill.icon}</div>
              <div className="skill-card-num">{skill.num}</div>
              <div className="skill-card-content">
                <h3 className="skill-card-name">{skill.name}</h3>
                <div className="skill-card-prof">{skill.prof}</div>
                <div className="skill-card-list">
                  {skill.chips.map(chip => (
                    <span key={chip} className="skill-chip">{chip}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Skills;
