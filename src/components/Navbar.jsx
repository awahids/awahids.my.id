import React, { useState, useEffect } from 'react';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const updateClock = () => {
      const now = new Date();
      const wib = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (7 * 3600000));
      const h = String(wib.getHours()).padStart(2, '0');
      const m = String(wib.getMinutes()).padStart(2, '0');
      const s = String(wib.getSeconds()).padStart(2, '0');
      setTime(`${h}:${m}:${s} WIB`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  return (
    <nav className={scrolled ? 'scrolled' : ''}>
      <a href="#home" data-scroll-target="#home" className="nav-logo">A<b>.</b>W<b>.</b>S<b>.</b></a>
      <div className="nav-right">
        <ul className="nav-links">
          <li><a href="#about" data-scroll-target="#about"><span>01</span> ABOUT</a></li>
          <li><a href="#portfolio" data-scroll-target="#portfolio"><span>02</span> WORK</a></li>
          <li><a href="#skills" data-scroll-target="#skills"><span>03</span> STACK</a></li>
          <li><a href="#experience" data-scroll-target="#experience"><span>04</span> CAREER</a></li>
          <li><a href="#certificates" data-scroll-target="#certificates"><span>05</span> CERT</a></li>
          <li><a href="#contact" data-scroll-target="#contact"><span>06</span> CONTACT</a></li>
        </ul>
        <div className="nav-clock">
          <div className="clock-dot"></div>
          <span>{time || '00:00:00 WIB'}</span>
        </div>
      </div>
      <a href="#contact" data-scroll-target="#contact" className="nav-cta">Hire Me</a>
    </nav>
  );
};

export default Navbar;
