import React, { useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
} from 'framer-motion';

const LAYER_VH = 80;
const LENIS_EASE = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

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

const SkillsRelay = ({ skillItems, lenisRef }) => {
  const outerRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const total = skillItems.length;

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
    layoutEffect: false,
  });
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(scrollYProgress, 'change', (progress) => {
    const index = Math.min(total - 1, Math.max(0, Math.floor(progress * total)));
    setActiveIndex((current) => (current === index ? current : index));
  });

  const handleDotClick = (index) => {
    const outer = outerRef.current;
    if (!outer) return;
    const rect = outer.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    // useScroll's ['start start', 'end end'] maps progress 0→1 across
    // (container height - viewport height), not the full container height —
    // the sticky child already fills one viewport's worth without extra scroll.
    const scrollableRange = rect.height - window.innerHeight;
    const targetProgress = (index + 0.5) / total;
    const targetY = absoluteTop + targetProgress * scrollableRange;

    if (lenisRef?.current) {
      lenisRef.current.scrollTo(targetY, { duration: 1.2, easing: LENIS_EASE });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  return (
    <>
      <ul className="sr-only">
        {skillItems.map((skill) => (
          <li key={skill.name}>
            {skill.name} — {skill.prof}: {skill.chips.join(', ')}
          </li>
        ))}
      </ul>
      <div
        className="skills-relay"
        ref={outerRef}
        aria-hidden="true"
        style={{ height: `${total * LAYER_VH}vh` }}
      >
        <div className="skills-relay-sticky">
          <div className="skills-relay-progress">
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
          <div className="skills-relay-dots">
            {skillItems.map((skill, index) => (
              <button
                key={skill.name}
                type="button"
                className={`skills-relay-dot${index === activeIndex ? ' is-active' : ''}`}
                onClick={() => handleDotClick(index)}
                tabIndex={-1}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SkillsRelay;
