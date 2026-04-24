import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const MOBILE_QUERY = '(max-width: 768px)';

const viewportByDevice = (isMobile) => ({
  once: true,
  margin: isMobile ? '-20px 0px -20px 0px' : '-40px 0px -40px 0px',
  amount: 0.05,
});

const noMotionVariant = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0, transition: { duration: 0 } },
};

const staggerByDevice = (isMobile, reduceMotion, tight = false) => {
  if (reduceMotion) {
    return {
      hidden: { opacity: 1 },
      visible: { opacity: 1, transition: { duration: 0 } },
    };
  }

  return {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: tight ? 0.04 : 0.06,
        delayChildren: tight ? 0.01 : 0.03,
      },
    },
  };
};

const sectionContainerByDevice = (isMobile, reduceMotion, ease) => {
  if (reduceMotion) return noMotionVariant;

  return {
    hidden: { opacity: 0, y: isMobile ? 12 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isMobile ? 0.45 : 0.55,
        ease,
        staggerChildren: isMobile ? 0.04 : 0.06,
        delayChildren: isMobile ? 0.02 : 0.04,
      },
    },
  };
};

const sectionItemByDevice = (isMobile, reduceMotion, ease) => {
  if (reduceMotion) return noMotionVariant;

  return {
    hidden: { opacity: 0, y: isMobile ? 12 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isMobile ? 0.5 : 0.68,
        ease,
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
    setIsMobile(media.matches);

    if (media.addEventListener) {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  return useMemo(() => {
    const ease = [0.16, 1, 0.3, 1];
    const reduceMotion = Boolean(prefersReducedMotion);

    return {
      ease,
      isMobile,
      reduceMotion,
      viewport: viewportByDevice(isMobile),
      sectionContainer: sectionContainerByDevice(isMobile, reduceMotion, ease),
      sectionItem: sectionItemByDevice(isMobile, reduceMotion, ease),
      staggerGrid: staggerByDevice(isMobile, reduceMotion, false),
      staggerTight: staggerByDevice(isMobile, reduceMotion, true),
    };
  }, [isMobile, prefersReducedMotion]);
};
