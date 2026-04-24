import React, { useState, useEffect } from 'react';
import { BOOKING_URL } from '../lib/links';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <a href="#home" data-scroll-target="#home" className="nav-logo">A<b>.</b>W<b>.</b>S<b>.</b></a>
      <div className="nav-right">
        <ul className="nav-links">
          <li><a href="#about" data-scroll-target="#about"><span>01</span> ABOUT</a></li>
          <li><a href="#services" data-scroll-target="#services"><span>02</span> BUILD</a></li>
          <li><a href="#portfolio" data-scroll-target="#portfolio"><span>03</span> PROJECTS</a></li>
          <li><a href="#skills" data-scroll-target="#skills"><span>04</span> STACK</a></li>
          <li><a href="#experience" data-scroll-target="#experience"><span>05</span> CAREER</a></li>
          <li><a href="#contact" data-scroll-target="#contact"><span>06</span> CONTACT</a></li>
        </ul>
      </div>
      <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="nav-cta">Discuss a Project</a>
    </nav>
  );
};

export default Navbar;
