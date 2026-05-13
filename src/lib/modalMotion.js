export const modalOverlayMotion = (reduceMotion) => ({
  initial: {
    opacity: 0,
    backdropFilter: reduceMotion ? 'blur(14px)' : 'blur(0px)',
  },
  animate: {
    opacity: 1,
    backdropFilter: 'blur(14px)',
    transition: { duration: reduceMotion ? 0.12 : 0.24, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    backdropFilter: reduceMotion ? 'blur(14px)' : 'blur(0px)',
    transition: { duration: reduceMotion ? 0.12 : 0.18, ease: [0.4, 0, 1, 1] },
  },
});

export const modalCardVariants = (reduceMotion) => ({
  hidden: reduceMotion
    ? { opacity: 1 }
    : { opacity: 0, y: 42, scale: 0.94, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: reduceMotion
      ? { duration: 0 }
      : {
          type: 'spring',
          stiffness: 270,
          damping: 28,
          mass: 0.78,
          when: 'beforeChildren',
          staggerChildren: 0.055,
          delayChildren: 0.06,
        },
  },
  exit: reduceMotion
    ? { opacity: 1, transition: { duration: 0 } }
    : {
        opacity: 0,
        y: 26,
        scale: 0.97,
        filter: 'blur(6px)',
        transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
      },
});

export const modalChildVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
  },
};
