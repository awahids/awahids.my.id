import React, { useState, useEffect } from 'react';
import { BOOKING_URL } from '../lib/links';

const navItems = [
  { id: 'services', label: 'Services', num: '01' },
  { id: 'portfolio', label: 'Projects', num: '02' },
  { id: 'experience', label: 'Experience', num: '03' },
  { id: 'contact', label: 'Contact', num: '04' },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState(navItems[0].id);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      let current = navItems[0].id;

      navItems.forEach((item) => {
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
  }, []);

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <a href="#home" data-scroll-target="#home" className="nav-logo">A<b>.</b>W<b>.</b>S<b>.</b></a>
      <div className="nav-right">
        <ul className="nav-links">
          {navItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                data-scroll-target={`#${item.id}`}
                className={activeSection === item.id ? 'is-active' : ''}
              >
                <span>{item.num}</span> {item.label.toUpperCase()}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="nav-cta">Discuss a Project</a>
    </nav>
  );
};

export default Navbar;
