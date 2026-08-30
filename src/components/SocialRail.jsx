import React from 'react';

const CV_URL = `${import.meta.env.BASE_URL}cv/my-cv.pdf`;

const links = [
  {
    href: 'https://github.com/awahids',
    label: 'GitHub',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M15 22v-4a4 4 0 0 0-1-2.8c3.2-.4 6.6-1.6 6.6-7.3a5.7 5.7 0 0 0-1.6-3.1A5.1 5.1 0 0 0 18.9 1S17.7.7 15 2.5a13.3 13.3 0 0 0-6 0C6.3.7 5.1 1 5.1 1A5.1 5.1 0 0 0 5 4.8 5.7 5.7 0 0 0 3.4 7.9c0 5.7 3.4 6.9 6.6 7.3A4 4 0 0 0 9 18v4" />
        <path d="M9 18c-5 2-5-2-7-2" />
      </svg>
    ),
  },
  {
    href: 'https://linkedin.com/in/awahids',
    label: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4V9h4v2a4.8 4.8 0 0 1 4-3z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  {
    href: 'https://blog.awahids.my.id',
    label: 'Blog',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 8h10" />
        <path d="M7 12h10" />
        <path d="M7 16h6" />
      </svg>
    ),
  },
];

const SocialRail = () => {
  return (
    <aside className="social-rail" aria-label="Social links">
      <div className="social-rail-line" aria-hidden="true"></div>
      <div className="social-rail-links">
        {links.map((item) => (
          <a
            key={item.href}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="social-rail-link"
            aria-label={item.label}
            title={item.label}
          >
            {item.icon}
          </a>
        ))}
      </div>
      <a
        href={CV_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="social-rail-resume"
      >
        Resume ↗
      </a>
    </aside>
  );
};

export default SocialRail;
