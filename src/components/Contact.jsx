import React, { useRef, useState } from 'react';
import { BOOKING_URL } from '../lib/links';
import { Waves } from './Waves';
import { openCvDownload } from '../lib/cvDownload';
import { useGsapReveal } from '../lib/useGsapReveal';
import { trackEvent } from '../lib/analytics';


const CONTACT = {
  title: 'Have a web app, dashboard, or backend system to build?',
  eyebrow: 'Contact',
  summary:
    'Tell me what you are building, what is breaking, or what needs to scale. I can help with fullstack development, backend architecture, workflow automation, and deployment.',
  email: 'awahid.safhadi@gmail.com',
  bookingUrl: BOOKING_URL,
  location: 'Cikarang, Bekasi, Jawa Barat',
  availability: 'Open for build, scale, or modernization work.',
  availabilityPoints: [
    'Web apps and admin dashboards',
    'Backend APIs and system workflows',
    'Automation and production deployment',
  ],
  remoteStatus: 'OPEN TO REMOTE',
  ctaPrimaryLabel: 'Start a Project Conversation',
  ctaSecondaryLabel: 'View Fullstack Projects',
};

const renderContactTitle = (title) => {
  const text = title;
  const highlighted = 'backend system';
  const index = text.toLowerCase().indexOf(highlighted);

  if (index < 0) return text;

  return (
    <>
      {text.slice(0, index)}
      <em>{text.slice(index, index + highlighted.length)}</em>
      {text.slice(index + highlighted.length)}
    </>
  );
};

const Contact = () => {
  const contact = CONTACT;
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);
  const innerRef = useRef(null);

  useGsapReveal(innerRef);

  const handleEmailCopy = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(contact.email);
      trackEvent('EmailCopy', { source: 'contact' });
      setCopied(true);
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  return (
    <section className="s-contact" id="contact" style={{ position: 'relative', overflow: 'hidden' }}>
      <Waves 
        className="contact-waves-bg"
        strokeColor="rgba(200, 255, 0, 0.12)"
        backgroundColor="transparent"
        pointerSize={0}
      />
      <div
        className="contact-inner"
        ref={innerRef}
        style={{ position: 'relative', zIndex: 10 }}
      >
        <div className="contact-top">
          <div>
            <h2 className="contact-headline" data-gsap-reveal="split">
              {renderContactTitle(contact.title)}
            </h2>
            <p className="contact-kicker" data-gsap-reveal="up">
              {contact.summary}
            </p>
            <div className="contact-top-actions" data-gsap-reveal="up">
              <a
                href={contact.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-top-link is-prime"
                onClick={() => trackEvent('BookingCTA', { source: 'contact' })}
              >
                {contact.ctaPrimaryLabel}
              </a>
              <a
                href="#portfolio"
                data-scroll-target="#portfolio"
                className="contact-top-link"
              >
                {contact.ctaSecondaryLabel}
              </a>
            </div>
          </div>
          <div className="contact-badge" data-gsap-reveal="up">
            <div className="contact-badge-icon">
              <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M9 13h6" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M9 17h6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="contact-badge-text">
              <span className="contact-badge-name">Curriculum Vitae</span>
              <span className="contact-badge-role">PDF Resume</span>
            </div>
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-badge-link"
              onClick={(event) => { event.preventDefault(); openCvDownload('contact'); }}
            >
              Download Resume ↗
            </a>
          </div>
        </div>

        <div className="contact-grid">
          <div className="notch-surface contact-card" data-gsap-reveal="pop">
            <div className="cc-icon">
              <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m3 7 12 6 9-6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="cc-lbl">EMAIL</div>
            <button type="button" className="cc-val cc-email-copy" onClick={handleEmailCopy} aria-label="Copy email address">
              {contact.email}
              <span className={`cc-copied-badge${copied ? ' is-visible' : ''}`}>Copied!</span>
            </button>
            <div className="cc-remote">
              <div className="status-pulse"></div> AVAILABLE FOR FULLSTACK PROJECTS
            </div>
          </div>

          <div className="notch-surface contact-card" data-gsap-reveal="pop">
            <div className="cc-icon">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 7v6l4 2" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="cc-lbl">AVAILABILITY</div>
            <div className="cc-loc">{contact.availability}</div>
            <div className="cc-bullet-list">
              {contact.availabilityPoints.map((point) => (
                <div key={point}>{point}</div>
              ))}
            </div>
            <a href={contact.bookingUrl} target="_blank" rel="noopener noreferrer" className="cc-soc-link">
              <strong>DISCUSS PROJECT</strong> <span>Book a call ↗</span>
            </a>
          </div>

          <div className="notch-surface contact-card" data-gsap-reveal="pop">
            <div className="cc-icon">
              <svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="cc-lbl">LOCATION</div>
            <div className="cc-loc">{contact.location}</div>
            <div className="cc-remote">
              <div className="status-pulse"></div> {contact.remoteStatus}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
