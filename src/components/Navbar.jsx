import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { BOOKING_URL } from '../lib/links';

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
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(() =>
    isAiLabPage ? 'ai-lab' : mainNavItems[0].id
  );
  const resolvedActiveSection = isNotFoundPage ? '' : isAiLabPage ? 'ai-lab' : activeSection;

  const navLinksRef = useRef(null);
  const underlineRef = useRef(null);

  useEffect(() => {
    if (isAiLabPage) {
      const handleScroll = () => {
        setScrolled(window.scrollY > 50);
      };

      handleScroll();
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      let current = mainNavItems[0].id;

      mainNavItems.forEach((item) => {
        const section = document.getElementById(item.id);
        if (!section) return;

        const sectionTop = section.offsetTop - 180;
        if (window.scrollY >= sectionTop) {
          current = item.id;
        }
      });

      setActiveSection(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isAiLabPage]);

  // Sliding underline follows active nav link
  useEffect(() => {
    const nav = navLinksRef.current;
    const line = underlineRef.current;
    if (!nav || !line || isNotFoundPage) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const activeLink = nav.querySelector('a.is-active');
    if (!activeLink) {
      gsap.set(line, { opacity: 0 });
      return;
    }

    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();

    if (prefersReducedMotion) {
      gsap.set(line, { x: linkRect.left - navRect.left, width: linkRect.width, opacity: 1 });
    } else {
      gsap.to(line, {
        x: linkRect.left - navRect.left,
        width: linkRect.width,
        opacity: 1,
        duration: 0.38,
        ease: 'power3.out',
      });
    }
  }, [resolvedActiveSection, scrolled, isNotFoundPage]);

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
        <div className="nav-links-wrap">
          <ul className="nav-links" ref={navLinksRef}>
            {navItems.map((item) => (
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
                  className={resolvedActiveSection === item.id ? 'is-active' : ''}
                >
                  <span>{item.num}</span> {item.label.toUpperCase()}
                </a>
              </li>
            ))}
          </ul>
          <div className="nav-underline" ref={underlineRef} aria-hidden="true" />
        </div>
      </div>
      <a
        href={BOOKING_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-cta"
        onClick={() => window.plausible?.('BookingCTA', { props: { source: 'navbar' } })}
      >
        Discuss a Project
      </a>
    </nav>
  );
};

export default Navbar;
