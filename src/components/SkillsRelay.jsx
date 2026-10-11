import React, { useRef, useState } from 'react';
import { gsap, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion';
import { SVG_SHAPES, drawIn } from '../lib/useGsapReveal';

const LAYER_VH = 80;
const LENIS_EASE = (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t));
// Share of each layer's band spent fading in / out.
const FADE = 0.15;

const LayerPanel = ({ skill, total }) => (
  <div className="skills-relay-layer">
    <div className="skills-relay-icon">{skill.icon}</div>
    <div className="skills-relay-num">
      {skill.num} / {String(total).padStart(2, '0')}
    </div>
    <h3 className="skills-relay-name">{skill.name}</h3>
    <div className="skills-relay-prof">{skill.prof}</div>
    <div className="skills-relay-chips">
      {skill.chips.map((chip) => (
        <span key={chip} className="skill-chip">{chip}</span>
      ))}
    </div>
  </div>
);

const SkillsRelay = ({ skillItems, lenisRef }) => {
  const outerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const total = skillItems.length;

  // One scrubbed timeline, 1 unit long, maps scroll progress across the relay:
  // the progress fill grows the whole way, and each layer owns a 1/total band.
  useIsoLayoutEffect(() => {
    const outer = outerRef.current;
    if (!outer) return undefined;
    const move = !prefersReducedMotion();
    let lastIndex = -1;

    let ctx = null;
    // Each time a layer takes over: its icon draws itself and its chips cascade in.
    // Runs from a scroll callback, so it goes through ctx to be reverted on unmount.
    const activate = (layer) => ctx?.add(() => {
      if (!move || !layer) return;
      const icon = layer.querySelector('.skills-relay-icon');
      if (icon) drawIn(icon.querySelectorAll(SVG_SHAPES), { overwrite: true });
      gsap.fromTo(layer.querySelectorAll('.skill-chip'),
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.035, delay: 0.15, overwrite: true, clearProps: 'transform' });
    });

    ctx = gsap.context(() => {
      const layers = Array.from(outer.querySelectorAll('.skills-relay-layer'));
      const band = 1 / total;
      gsap.set(layers, move ? { opacity: 0, y: 24 } : { opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: outer,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
          onUpdate: (self) => {
            const index = Math.min(total - 1, Math.max(0, Math.floor(self.progress * total)));
            if (index === lastIndex) return;
            lastIndex = index;
            setActiveIndex(index);
            activate(layers[index]);
          },
        },
      });

      tl.fromTo('.skills-relay-progress-fill', { scaleX: 0 }, { scaleX: 1, duration: 1 }, 0);
      layers.forEach((layer, index) => {
        const start = index * band;
        const fade = band * FADE;
        tl.to(layer, move ? { opacity: 1, y: 0, duration: fade } : { opacity: 1, duration: fade }, start)
          .to(layer, move ? { opacity: 0, y: -24, duration: fade } : { opacity: 0, duration: fade }, start + band - fade);
      });
    }, outer);

    return () => ctx.revert();
  }, [total]);

  const handleDotClick = (index) => {
    const outer = outerRef.current;
    if (!outer) return;
    const rect = outer.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;
    // The trigger's 'top top' → 'bottom bottom' maps progress 0→1 across
    // (container height - viewport height), not the full container height —
    // the sticky child already fills one viewport's worth without extra scroll.
    const scrollableRange = rect.height - window.innerHeight;
    const targetProgress = (index + 0.5) / total;
    const targetY = absoluteTop + targetProgress * scrollableRange;

    if (lenisRef?.current) {
      lenisRef.current.scrollTo(targetY, { duration: 1.2, easing: LENIS_EASE });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  return (
    <>
      <ul className="sr-only">
        {skillItems.map((skill) => (
          <li key={skill.name}>
            {skill.name} — {skill.prof}: {skill.chips.join(', ')}
          </li>
        ))}
      </ul>
      <div
        className="skills-relay"
        ref={outerRef}
        aria-hidden="true"
        style={{ height: `${total * LAYER_VH}vh` }}
      >
        <div className="skills-relay-sticky">
          <div className="skills-relay-progress">
            <div className="skills-relay-progress-fill" />
          </div>
          {skillItems.map((skill) => (
            <LayerPanel
              key={skill.name}
              skill={skill}
              total={total}
            />
          ))}
          <div className="skills-relay-dots">
            {skillItems.map((skill, index) => (
              <button
                key={skill.name}
                type="button"
                className={`skills-relay-dot${index === activeIndex ? ' is-active' : ''}`}
                onClick={() => handleDotClick(index)}
                tabIndex={-1}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SkillsRelay;
