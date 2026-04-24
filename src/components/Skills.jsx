import React from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const skillsData = [
  {
    name: 'Programming Languages',
    prof: 'CV Skills',
    num: '01',
    chips: ['TypeScript', 'Javascript', 'PHP', 'HTML', 'CSS', 'Go'],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    )
  },
  {
    name: 'Framework and Library',
    prof: 'CV Skills',
    num: '02',
    chips: ['Nestjs', 'Expressjs', 'Bootstrap', 'Laravel', 'Gin Gonic', 'TypeOrm', 'GORM', 'Sequelize'],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M20 7h-7L10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/></svg>
    )
  },
  {
    name: 'Databases',
    prof: 'CV Skills',
    num: '03',
    chips: ['MySQL', 'PostgreSQL', 'MongoDB', 'Oracle Apex'],
    icon: (
      <svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
    )
  },
  {
    name: 'Others',
    prof: 'CV Skills',
    num: '04',
    chips: ['Git', 'Jira', 'Scrum', 'GraphQL Server', 'Postman', 'JWT'],
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
          // STACK_KNOWLEDGE
        </motion.div>
        <div className="skills-copy">
          <motion.h2 className="skills-copy-title" variants={sectionItem}>
            The Technical <em>Toolkit</em>.
          </motion.h2>
          <motion.span className="skills-copy-sub" variants={sectionItem}>
            Backend-first, Fullstack-ready.
          </motion.span>
          <motion.p className="skills-copy-desc" variants={sectionItem}>
            Core stack aligned with production standards: Programming Languages, Frameworks, 
            Databases, and Delivery tools used across production projects.
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
