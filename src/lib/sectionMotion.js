import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const MOBILE_QUERY = '(max-width: 768px)';

const viewportByDevice = (isMobile) => ({
  once: true,
  margin: isMobile ? '-10px 0px -10px 0px' : '-40px 0px -40px 0px',
  amount: 0.05,
});

const noMotionVariant = {
  hidden: { opacity: 1, y: 0, scale: 1 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0 } },
};

// Pure orchestration — stagger children, container stays visible
const staggerByDevice = (isMobile, reduceMotion, tight = false) => {
  if (reduceMotion) return { hidden: { opacity: 1 }, visible: { opacity: 1 } };
  return {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: tight ? 0.05 : 0.09,
        delayChildren: tight ? 0.02 : 0.06,
      },
    },
  };
};

// Section container — minimal self-property so Framer Motion propagates
// variant name "hidden" down to children correctly
const sectionContainerByDevice = (isMobile, reduceMotion) => {
  if (reduceMotion) return noMotionVariant;
  return {
    hidden: { opacity: 1 }, // container stays visible; children use own hidden
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isMobile ? 0.08 : 0.12,
        delayChildren: isMobile ? 0.05 : 0.1,
      },
    },
  };
};

// DRAMATIC spring item — big y + scale pop, very visible
const sectionItemByDevice = (isMobile, reduceMotion) => {
  if (reduceMotion) return noMotionVariant;
  return {
    hidden: {
      opacity: 0,
      y: isMobile ? 30 : 52,
      scale: 0.92,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 48,
        damping: 14,
        mass: 1,
      },
    },
  };
};

// Clip-path wipe reveal — unmissable headline entrance
const clipRevealByDevice = (reduceMotion) => {
  if (reduceMotion) return noMotionVariant;
  return {
    hidden: {
      opacity: 0,
      clipPath: 'inset(100% 0 0 0)',
    },
    visible: {
      opacity: 1,
      clipPath: 'inset(0% 0 0 0)',
      transition: {
        type: 'spring',
        stiffness: 45,
        damping: 13,
        mass: 0.9,
      },
    },
  };
};

// Eyebrow: slide in from left + fade — clearly visible lateral motion
const eyebrowByDevice = (reduceMotion) => {
  if (reduceMotion) return noMotionVariant;
  return {
    hidden: { opacity: 0, x: -28 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 70,
        damping: 16,
      },
    },
  };
};

// Card pop — scale up from small + big y travel, very dramatic
const cardPopByDevice = (reduceMotion) => {
  if (reduceMotion) return noMotionVariant;
  return {
    hidden: {
      opacity: 0,
      y: 60,
      scale: 0.82,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 42,
        damping: 12,
        mass: 0.9,
      },
    },
  };
};

export const useSectionMotion = () => {
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(MOBILE_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const media = window.matchMedia(MOBILE_QUERY);
    const onChange = (event) => setIsMobile(event.matches);
    if (media.addEventListener) {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  return useMemo(() => {
    const reduceMotion = Boolean(prefersReducedMotion);
    return {
      isMobile,
      reduceMotion,
      viewport: viewportByDevice(isMobile),
      sectionContainer: sectionContainerByDevice(isMobile, reduceMotion),
      sectionItem: sectionItemByDevice(isMobile, reduceMotion),
      staggerGrid: staggerByDevice(isMobile, reduceMotion, false),
      staggerTight: staggerByDevice(isMobile, reduceMotion, true),
      clipReveal: clipRevealByDevice(reduceMotion),
      eyebrow: eyebrowByDevice(reduceMotion),
      cardPop: cardPopByDevice(reduceMotion),
    };
  }, [isMobile, prefersReducedMotion]);
};
