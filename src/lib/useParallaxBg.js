/**
 * useParallaxBg — GSAP ScrollTrigger parallax for section background elements.
 * Attach data-parallax="<speed>" (e.g. 0.3) to elements you want to parallax.
 * Speed 0 = no movement, 1 = moves at scroll speed (full parallax).
 */
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useParallaxBg = (containerRef) => {
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const targets = Array.from(container.querySelectorAll('[data-parallax]'));
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      targets.forEach((el) => {
        const speed = parseFloat(el.getAttribute('data-parallax') || '0.2');
        const yAmount = window.innerHeight * speed * 0.5;

        gsap.fromTo(
          el,
          { y: -yAmount },
          {
            y: yAmount,
            ease: 'none',
            scrollTrigger: {
              trigger: container,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          }
        );
      });
    }, container);

    return () => ctx.revert();
  }, [containerRef]);
};
