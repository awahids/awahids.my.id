/**
 * splitReveal — SplitText headline reveal, used by useGsapReveal for
 * data-gsap-reveal="split" (characters rise out of a per-line mask) and
 * "split-lines" (whole lines rise — for long or badge-styled copy).
 *
 * autoSplit re-splits when fonts load or the width changes, so line masks
 * always match the real line breaks; the tween is rebuilt in onSplit.
 */
import { gsap, SplitText, DUR, EASE_TEXT } from './motion';

export const splitReveal = (el, { byLine = false, delay = 0, scroll = true } = {}) =>
  SplitText.create(el, {
    type: byLine ? 'lines' : 'lines,words,chars',
    mask: 'lines',
    // Line-only splits keep words intact, so screen readers can read them as-is
    // (the generated aria-label would drop the spaces at <br>s).
    aria: byLine ? 'none' : 'auto',
    autoSplit: true,
    onSplit(self) {
      return gsap.from(byLine ? self.lines : self.chars, {
        yPercent: 115,
        rotate: byLine ? 0 : 6,
        transformOrigin: '0% 100%',
        duration: byLine ? DUR.slow : 0.8,
        ease: EASE_TEXT,
        stagger: byLine ? 0.08 : 0.018,
        delay,
        scrollTrigger: scroll ? { trigger: el, start: 'top 88%', once: true } : undefined,
      });
    },
  });
