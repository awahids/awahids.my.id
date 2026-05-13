import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const wrapChars = (el) => {
  const text = el.textContent;
  el.innerHTML = text
    .split('')
    .map((c) =>
      c === ' '
        ? '<span class="gsap-char" style="display:inline-block">&nbsp;</span>'
        : `<span class="gsap-char" style="display:inline-block;overflow:hidden"><span style="display:inline-block">${c}</span></span>`
    )
    .join('');
  return el.querySelectorAll('.gsap-char > span');
};

const REVEAL_TYPES = {
  'fade-up': (el, tl, reduceMotion) => {
    if (reduceMotion) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }
    gsap.set(el, { opacity: 0, y: 28 });
    tl.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, '<0.08');
  },

  'split-chars': (el, tl, reduceMotion) => {
    if (reduceMotion) {
      gsap.set(el, { opacity: 1 });
      return;
    }
    const chars = wrapChars(el);
    gsap.set(chars, { y: '110%' });
    tl.to(chars, {
      y: '0%',
      duration: 0.55,
      ease: 'power3.out',
      stagger: 0.02,
    });
  },

  'stagger-children': (el, tl, reduceMotion) => {
    const children = Array.from(el.children);
    if (!children.length) return;
    if (reduceMotion) {
      gsap.set(children, { opacity: 1, y: 0 });
      return;
    }
    gsap.set(children, { opacity: 0, y: 20 });
    tl.to(children, {
      opacity: 1,
      y: 0,
      duration: 0.55,
      ease: 'power3.out',
      stagger: 0.06,
    });
  },
};

export const useGsapReveal = (containerRef) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    const prefersReducedMotion =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const targets = container.querySelectorAll('[data-gsap-reveal]');

      targets.forEach((el) => {
        const type = el.dataset.gsapReveal || 'fade-up';
        const delay = parseFloat(el.dataset.gsapDelay || '0');

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
          delay,
        });

        REVEAL_TYPES[type]?.(el, tl, prefersReducedMotion);
      });
    }, container);

    return () => ctx.revert();
  }, [containerRef]);
};
