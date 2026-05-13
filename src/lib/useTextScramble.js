/**
 * useTextScramble — On viewport enter, scrambles text through random chars
 * before revealing the final value. GSAP-powered, once per element.
 *
 * Usage: add data-scramble attribute to any element.
 * The element's textContent is the final revealed value.
 */
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const scrambleIn = (el, finalText, duration = 0.9) => {
  const chars = CHARS.split('');
  const len = finalText.length;
  const startTime = { t: 0 };
  const revealed = new Array(len).fill(false);

  gsap.to(startTime, {
    t: 1,
    duration,
    ease: 'power2.inOut',
    onUpdate() {
      const progress = startTime.t;
      const revealCount = Math.floor(progress * len);

      // Mark chars as revealed left-to-right
      for (let i = 0; i < revealCount; i++) revealed[i] = true;

      el.textContent = finalText
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (revealed[i]) return ch;
          return rand(chars);
        })
        .join('');
    },
    onComplete() {
      el.textContent = finalText;
    },
  });
};

export const useTextScramble = (containerRef) => {
  useEffect(() => {
    const container = containerRef?.current;
    if (!container || typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = Array.from(container.querySelectorAll('[data-scramble]'));
    if (!targets.length) return;

    const triggers = [];

    targets.forEach((el) => {
      const finalText = el.dataset.scramble || el.textContent.trim();
      // Store the final text in case it's also the initial text
      el.dataset.scramble = finalText;

      if (prefersReducedMotion) {
        el.textContent = finalText;
        return;
      }

      const st = ScrollTrigger.create({
        trigger: el,
        start: 'top 90%',
        once: true,
        onEnter() {
          scrambleIn(el, finalText);
        },
      });

      triggers.push(st);
    });

    return () => triggers.forEach((st) => st.kill());
  }, [containerRef]);
};
