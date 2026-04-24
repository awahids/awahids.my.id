import React from 'react';

const CV_URL = `${import.meta.env.BASE_URL}cv/my-cv.pdf`;

const links = [
  {
    href: 'https://github.com/awahids',
    label: 'GitHub',
    short: 'GH',
  },
  {
    href: 'https://linkedin.com/in/awahid',
    label: 'LinkedIn',
    short: 'IN',
  },
  {
    href: 'https://blog.awahids.my.id',
    label: 'Blog',
    short: 'BL',
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
            <span>{item.short}</span>
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
