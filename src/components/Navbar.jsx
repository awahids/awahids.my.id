import React, { useState, useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, EASE, DUR, prefersReducedMotion, useIsoLayoutEffect, sectionEnd } from '../lib/motion';
import { BOOKING_URL } from '../lib/links';
import { trackEvent } from '../lib/analytics';

const mainNavItems = [
  { id: 'services', label: 'Services', num: '01' },
  { id: 'portfolio', label: 'Projects', num: '02' },
  { id: 'experience', label: 'Experience', num: '03' },
  { id: 'contact', label: 'Contact', num: '04' },
];

const aiLabNavItems = [
  { id: 'portfolio-home', label: 'Portfolio', num: '00', href: '/' },
  { id: 'ai-lab', label: 'AI Lab', num: '01', href: '#ai-lab', isSection: true },
];

const Navbar = ({ isAiLabPage = false, isNotFoundPage = false }) => {
  const navItems = isAiLabPage ? aiLabNavItems : mainNavItems;
  const tracksSections = !isAiLabPage && !isNotFoundPage;
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const resolvedActiveSection = isNotFoundPage ? '' : isAiLabPage ? 'ai-lab' : activeSection;

  const wrapRef = useRef(null);
  const navLinksRef = useRef(null);
  const indicatorRef = useRef(null);
  const indicatorPlaced = useRef(false);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: 50,
      end: 'max',
      onToggle: (self) => setScrolled(self.isActive),
    });
    return () => trigger.kill();
  }, []);

  // One trigger per linked section: toggles the active link and scrubs its progress bar.
  useEffect(() => {
    const nav = navLinksRef.current;
    if (!tracksSections || !nav) return undefined;

    const ctx = gsap.context(() => {
      mainNavItems.forEach(({ id }) => {
        const section = document.getElementById(id);
        const bar = nav.querySelector(`[data-progress="${id}"]`);
        if (!section || !bar) return;

        gsap.fromTo(
          bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: section,
              start: 'top 50%',
              end: sectionEnd(section),
              scrub: true,
              // Sections above may pin; measure after them.
              refreshPriority: -1,
              onToggle: (self) =>
                setActiveSection((prev) => (self.isActive ? id : prev === id ? '' : prev)),
            },
          }
        );
      });
    }, nav);

    return () => ctx.revert();
  }, [tracksSections]);

  // The indicator slides to the active link: x plus scaleX over a fixed base width.
  useIsoLayoutEffect(() => {
    const wrap = wrapRef.current;
    const line = indicatorRef.current;
    if (!wrap || !line) return undefined;

    const place = (animate) => {
      const link = wrap.querySelector('a.is-active');
      // Hidden nav (mobile layout) has nothing to measure.
      if (!line.offsetWidth) return;
      if (!link) {
        indicatorPlaced.current = false;
        gsap.to(line, { opacity: 0, duration: animate ? DUR.fast : 0, overwrite: 'auto' });
        return;
      }
      const target = {
        x: link.getBoundingClientRect().left - wrap.getBoundingClientRect().left,
        scaleX: link.offsetWidth / line.offsetWidth,
        opacity: 1,
      };
      // First placement fades in on the spot instead of sliding from the left edge.
      if (!animate || !indicatorPlaced.current) {
        gsap.set(line, { x: target.x, scaleX: target.scaleX, overwrite: 'auto' });
        gsap.to(line, { opacity: 1, duration: animate ? DUR.fast : 0, overwrite: 'auto' });
      } else {
        gsap.to(line, { ...target, duration: DUR.base, ease: EASE, overwrite: 'auto' });
      }
      indicatorPlaced.current = true;
    };

    place(!prefersReducedMotion());

    // Layout shifts (fonts, resize) arrive with ScrollTrigger's refresh.
    const onRefresh = () => place(false);
    ScrollTrigger.addEventListener('refresh', onRefresh);
    return () => ScrollTrigger.removeEventListener('refresh', onRefresh);
  }, [resolvedActiveSection]);

  useEffect(() => {
    const line = indicatorRef.current;
    return () => gsap.killTweensOf(line);
  }, []);

  return (
    <nav className={`main-nav ${scrolled ? 'scrolled' : ''}`.trim()}>
      <a
        href={isNotFoundPage ? '/' : '#home'}
        data-scroll-target={isNotFoundPage ? undefined : '#home'}
        className="nav-logo"
      >
        A<b>.</b>W<b>.</b>S<b>.</b>
      </a>
      <div className="nav-right">
        <div className="nav-links-wrap" ref={wrapRef}>
          <ul className="nav-links" ref={navLinksRef}>
            {navItems.map((item) => {
              const isActive = resolvedActiveSection === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={isNotFoundPage ? `/#${item.id}` : item.href || `#${item.id}`}
                    data-scroll-target={
                      isNotFoundPage
                        ? undefined
                        : isAiLabPage
                        ? (item.isSection ? item.href : undefined)
                        : `#${item.id}`
                    }
                    className={isActive ? 'is-active' : ''}
                    aria-current={isActive ? 'location' : undefined}
                  >
                    <span>{item.num}</span> {item.label.toUpperCase()}
                    {tracksSections && (
                      <i className="nav-progress" data-progress={item.id} aria-hidden="true" />
                    )}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="nav-indicator" ref={indicatorRef} aria-hidden="true" />
        </div>
      </div>
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-cta"
        onClick={() => trackEvent('BookingCTA', { source: 'navbar' })}
      >
        Discuss a Project
      </a>
    </nav>
  );
};

export default Navbar;
