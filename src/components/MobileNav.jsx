import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const navItems = [
  { id: 'about', label: 'About', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  )},
  { id: 'services', label: 'Build', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
  )},
  { id: 'portfolio', label: 'Work', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
  )},
  { id: 'skills', label: 'Stack', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  )},
  { id: 'experience', label: 'Career', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 2v4"/><path d="M16 2v4"/><path d="M3 10h18"/></svg>
  )},
  { id: 'contact', label: 'Contact', icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
  )}
];

const MobileNav = () => {
  const [activeSection, setActiveSection] = useState(navItems[0].id);

  useEffect(() => {
    const syncActiveSection = () => {
      let current = navItems[0].id;

      navItems.forEach((item) => {
        const section = document.getElementById(item.id);
        if (!section) return;

        const sectionTop = section.offsetTop - 160;
        if (window.scrollY >= sectionTop) {
          current = item.id;
        }
      });

      setActiveSection(current);
    };

    syncActiveSection();
    window.addEventListener('scroll', syncActiveSection, { passive: true });

    return () => {
      window.removeEventListener('scroll', syncActiveSection);
    };
  }, []);

  return (
    <motion.div 
      className="mobile-tab-bar"
      initial={{ y: 100, x: '-50%' }}
      animate={{ y: 0, x: '-50%' }}
      transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      role="navigation"
      aria-label="Mobile section navigation"
    >
      <div className="tab-container">
        {navItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            data-scroll-target={`#${item.id}`}
            className={`tab-item${activeSection === item.id ? ' is-active' : ''}`}
            aria-label={`Go to ${item.label} section`}
            onClick={() => setActiveSection(item.id)}
          >
            <span className="tab-icon">{item.icon}</span>
            <span className="tab-label">{item.label}</span>
          </a>
        ))}
      </div>
    </motion.div>
  );
};

export default MobileNav;
