import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const fadeUp = {
  hidden: { opacity: 0, y: 40, scale: 0.94 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const HeroZoomBridgeDesktop = ({ photoSrc }) => {
  const outerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: outerRef,
    offset: ['start start', 'end end'],
    layoutEffect: false,
  });

  const scale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 2.4, 3.2]);
  const opacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 1, 0]);
  const wash = useTransform(scrollYProgress, [0, 0.7, 1], [0, 0.5, 1]);

  return (
    <section className="hzb hzb-desktop" ref={outerRef} aria-hidden="true">
      <div className="hzb-sticky">
        <motion.div className="hzb-wash" style={{ opacity: wash }} />
        <motion.img
          src={photoSrc}
          alt=""
          className="hzb-photo"
          style={{ scale, opacity }}
          draggable="false"
        />
      </div>
    </section>
  );
};

const HeroZoomBridge = () => {
  const reduceMotion = useReducedMotion();
  const { isMobile } = useSectionMotion();
  const photoSrc = `${import.meta.env.BASE_URL}img/aw.png`;

  if (reduceMotion) {
    return (
      <section className="hzb hzb-static" aria-hidden="true">
        <img src={photoSrc} alt="" className="hzb-photo" draggable="false" />
      </section>
    );
  }

  if (isMobile) {
    return (
      <motion.section
        className="hzb hzb-mobile"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        aria-hidden="true"
      >
        <img src={photoSrc} alt="" className="hzb-photo" draggable="false" />
      </motion.section>
    );
  }

  return <HeroZoomBridgeDesktop photoSrc={photoSrc} />;
};

export default HeroZoomBridge;
