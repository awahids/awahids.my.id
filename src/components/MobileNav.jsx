import React, { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, EASE, DUR, prefersReducedMotion, useIsoLayoutEffect, sectionEnd } from '../lib/motion';

const navItems = [
  { id: 'services', label: 'Services', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
  )},
  { id: 'portfolio', label: 'Projects', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  )},
  { id: 'experience', label: 'Experience', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>
  )},
  { id: 'contact', label: 'Contact', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  )}
];

const MobileNav = () => {
  const [activeSection, setActiveSection] = useState('');
  const barRef = useRef(null);
  const containerRef = useRef(null);
  const pillRef = useRef(null);
  const pillPlaced = useRef(false);

  // Slide the bar up from below the fold on mount.
  useIsoLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar || prefersReducedMotion()) return undefined;
    const tween = gsap.fromTo(
      bar,
      { xPercent: -50, x: 0, y: 100 },
      { xPercent: -50, y: 0, duration: DUR.slow, ease: EASE, clearProps: 'transform' }
    );
    return () => tween.revert();
  }, []);

  // Same section tracking as the desktop navbar: one trigger per section.
  useEffect(() => {
    const triggers = navItems
      .map(({ id }) => {
        const section = document.getElementById(id);
        if (!section) return null;
        return ScrollTrigger.create({
          trigger: section,
          start: 'top 50%',
          end: sectionEnd(section),
          refreshPriority: -1,
          onToggle: (self) =>
            setActiveSection((prev) => (self.isActive ? id : prev === id ? '' : prev)),
        });
      })
      .filter(Boolean);
    return () => triggers.forEach((trigger) => trigger.kill());
  }, []);

  // A single pill slides under the active tab; its icon gets a small pop.
  useIsoLayoutEffect(() => {
    const container = containerRef.current;
    const pill = pillRef.current;
    if (!container || !pill) return undefined;

    const place = (animate) => {
      const tab = container.querySelector('.tab-item.is-active');
      if (!pill.offsetWidth) return;
      if (!tab) {
        pillPlaced.current = false;
        gsap.to(pill, { opacity: 0, duration: animate ? DUR.fast : 0, overwrite: 'auto' });
        return;
      }
      const x = tab.offsetLeft;
      if (!animate || !pillPlaced.current) {
        gsap.set(pill, { x, overwrite: 'auto' });
        gsap.to(pill, { opacity: 1, duration: animate ? DUR.fast : 0, overwrite: 'auto' });
      } else {
        gsap.to(pill, { x, opacity: 1, duration: DUR.base, ease: EASE, overwrite: 'auto' });
      }
      if (animate) {
        gsap.fromTo(
          tab.querySelector('.tab-icon'),
          { scale: 0.75 },
          { scale: 1, duration: DUR.base, ease: 'back.out(3)', clearProps: 'transform', overwrite: 'auto' }
        );
      }
      pillPlaced.current = true;
    };

    place(!prefersReducedMotion());

    const onRefresh = () => place(false);
    ScrollTrigger.addEventListener('refresh', onRefresh);
    return () => ScrollTrigger.removeEventListener('refresh', onRefresh);
  }, [activeSection]);

  return (
    <>
      <div
        ref={barRef}
        className="mobile-tab-bar"
        role="navigation"
        aria-label="Mobile section navigation"
      >
        <div className="tab-container" ref={containerRef}>
          <span className="tab-pill" ref={pillRef} aria-hidden="true" />
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              data-scroll-target={`#${item.id}`}
              className={`tab-item${activeSection === item.id ? ' is-active' : ''}`}
              aria-label={`Go to ${item.label} section`}
              aria-current={activeSection === item.id ? 'location' : undefined}
              onClick={() => setActiveSection(item.id)}
            >
              <span className="tab-icon">{item.icon}</span>
              <span className="tab-label">{item.label}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileNav;
