/**
 * useWordSplit — GSAP word reveal for section titles.
 * Add data-word-split attribute to any element you want to split.
 * Each word wraps in overflow:hidden container and slides up on scroll.
 */
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const useWordSplit = (containerRef) => {
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = Array.from(container.querySelectorAll('[data-word-split]'));
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      targets.forEach((el) => {
        // Split into words — derive from textContent (safe, no HTML injection)
        const words = el.textContent.split(/\s+/).filter(Boolean);
        const fragment = document.createDocumentFragment();

        words.forEach((w, i) => {
          const wrap = document.createElement('span');
          wrap.className = 'ws-wrap';
          wrap.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom';

          const inner = document.createElement('span');
          inner.className = 'ws-word';
          inner.style.cssText = 'display:inline-block';
          inner.textContent = w;

          wrap.appendChild(inner);
          fragment.appendChild(wrap);
          if (i < words.length - 1) {
            fragment.appendChild(document.createTextNode(' '));
          }
        });

        el.textContent = '';
        el.appendChild(fragment);

        const wordEls = el.querySelectorAll('.ws-word');

        if (prefersReducedMotion) {
          gsap.set(wordEls, { y: 0, opacity: 1 });
          return;
        }

        gsap.set(wordEls, { y: '110%', opacity: 0 });

        ScrollTrigger.create({
          trigger: el,
          start: 'top 88%',
          once: true,
          onEnter: () => {
            gsap.to(wordEls, {
              y: '0%',
              opacity: 1,
              duration: 0.75,
              ease: 'power3.out',
              stagger: 0.055,
              clearProps: 'all',
            });
          },
        });
      });
    }, container);

    return () => ctx.revert();
  }, [containerRef]);
};
