import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

const LayerPanel = ({ skill, index, total, scrollYProgress, reduceMotion }) => {
  const band = 1 / total;
  const start = index * band;
  const end = start + band;
  const fadeInEnd = start + band * 0.15;
  const fadeOutStart = end - band * 0.15;

  const opacity = useTransform(
    scrollYProgress,
    [start, fadeInEnd, fadeOutStart, end],
    [0, 1, 1, 0]
  );
  const y = useTransform(
    scrollYProgress,
    [start, fadeInEnd, fadeOutStart, end],
    reduceMotion ? ['0px', '0px', '0px', '0px'] : ['24px', '0px', '0px', '-24px']
  );

  return (
    <motion.div className="skills-relay-layer" style={{ opacity, y }}>
      <div className="skills-relay-icon">{skill.icon}</div>
      <div className="skills-relay-num">
        {skill.num} / {String(total).padStart(2, '0')}
      </div>
      <h3 className="skills-relay-name">{skill.name}</h3>
      <div className="skills-relay-prof">{skill.prof}</div>
      <div className="skills-relay-chips">
        {skill.chips.map((chip) => (
          <span key={chip} className="skill-chip">{chip}</span>
        ))}
      </div>
    </motion.div>
  );
};

const SkillsRelay = ({ skillItems }) => {
  const outerRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
    layoutEffect: false,
  });
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const total = skillItems.length;

  return (
    <div
      className="skills-relay"
      ref={outerRef}
      style={{ height: `${total * 100}vh` }}
    >
      <div className="skills-relay-sticky">
        <div className="skills-relay-progress" aria-hidden="true">
          <motion.div
            className="skills-relay-progress-fill"
            style={{ scaleX: progressScaleX }}
          />
        </div>
        {skillItems.map((skill, index) => (
          <LayerPanel
            key={skill.name}
            skill={skill}
            index={index}
            total={total}
            scrollYProgress={scrollYProgress}
            reduceMotion={reduceMotion}
          />
        ))}
      </div>
    </div>
  );
};

export default SkillsRelay;
