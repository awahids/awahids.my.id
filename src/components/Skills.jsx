import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import SkillsScene from './SkillsScene';
import SkillsRelay from './SkillsRelay';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSectionMotion } from '../lib/sectionMotion';
import { useWordSplit } from '../lib/useWordSplit';
import { useParallaxBg } from '../lib/useParallaxBg';
import { useGsapReveal } from '../lib/useGsapReveal';
import { useTextScramble } from '../lib/useTextScramble';

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
    chips: ['Docker', 'Vercel', 'VPS', 'Nginx', 'Cloudflare', 'n8n', 'Git', 'Postman', 'JWT', 'Komodo'],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
    )
  },
  {
    name: 'AI-Assisted Development',
    prof: 'AI Pair Programming',
    num: '05',
    chips: ['Claude AI', 'ChatGPT Codex'],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/><circle cx="12" cy="12" r="4"/></svg>
    )
  }
];

const Skills = ({ lenisRef }) => {
  const rootRef = useRef(null);
  const sectionRef = rootRef; // reuse same ref for wordSplit and parallaxBg
  const [isMobile, setIsMobile] = useState(false);
  const { viewport, sectionContainer, sectionItem, eyebrow } = useSectionMotion();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const sync = (e) => setIsMobile(e.matches);
    sync(mq);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useWordSplit(sectionRef);
  useParallaxBg(sectionRef);
  useGsapReveal(sectionRef);
  useTextScramble(sectionRef);

  // Relay height depends on skillsData.length and is much taller (N*80vh) than a
  // static grid, so refresh GSAP triggers further down the page after it settles.
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 50);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section className="s-skills" id="skills">
      <SkillsScene isMobile={isMobile} />
      <motion.div
        ref={rootRef}
        className="skills-content"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <div className="s-skills-bg-label" data-gsap-reveal="fade-up" data-gsap-delay="0.1" aria-hidden="true">STACK</div>
        <motion.div className="s-eyebrow" variants={eyebrow}>
          // <span data-scramble="TECH_STACK_BY_LAYER">TECH_STACK_BY_LAYER</span>
        </motion.div>
        <div className="skills-copy" data-parallax="0.18">
          <motion.h2 className="skills-copy-title" variants={sectionItem} data-word-split>
            Fullstack Capability by Layer.
          </motion.h2>
          <motion.div
            className="section-lime-rule"
            variants={{
              hidden: { scaleX: 0, originX: 0 },
              visible: { scaleX: 1, originX: 0, transition: { type: 'spring', stiffness: 60, damping: 18, delay: 0.15 } },
            }}
          />
          <motion.span className="skills-copy-sub" variants={sectionItem}>
            Frontend, backend, database, deployment, and automation.
          </motion.span>
          <motion.p className="skills-copy-desc" variants={sectionItem}>
            Connected layers used to ship one working product, from UI experience and API
            architecture to data modeling, production operations, and automation workflows.
          </motion.p>
        </div>

        <SkillsRelay skillItems={skillsData} lenisRef={lenisRef} />
      </motion.div>
    </section>
  );
};

export default Skills;
