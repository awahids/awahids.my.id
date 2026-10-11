/**
 * useTextScramble — ScrambleTextPlugin decode effect on viewport enter.
 *
 * Usage: add data-scramble="FINAL_TEXT" to any element. The text decodes
 * left to right through terminal-style noise, once per element.
 */
import { useEffect } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_/#$%';

export const useTextScramble = (containerRef) => {
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || prefersReducedMotion()) return undefined;

    const targets = Array.from(container.querySelectorAll('[data-scramble]'));
    if (!targets.length) return undefined;

    const ctx = gsap.context(() => {
      targets.forEach((el) => {
        const finalText = el.dataset.scramble || el.textContent.trim();
        el.dataset.scramble = finalText;

        const tween = gsap.to(el, {
          paused: true,
          duration: 1.1,
          ease: 'none',
          scrambleText: { text: finalText, chars: CHARS, speed: 0.6, revealDelay: 0.15 },
        });

        ScrollTrigger.create({
          trigger: el,
          start: 'top 90%',
          // Also fires for elements already scrolled past on load.
          onEnter: (self) => { tween.play(); self.kill(); },
          onLeave: (self) => { tween.progress(1); self.kill(); },
        });
      });
    }, container);

    return () => ctx.revert();
  }, [containerRef]);
};
