import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const btnSpring = { type: 'spring', stiffness: 360, damping: 22 };
import { BOOKING_URL } from '../lib/links';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { Waves } from './Waves';

const CV_URL = `${import.meta.env.BASE_URL}cv/my-cv.pdf`;

const DEFAULT_CONTACT = {
  title: 'Have a web app, dashboard, or backend system to build?',
  eyebrow: 'Contact',
  summary:
    'Tell me what you are building, where your current system is falling short, or what needs to scale. I can help with fullstack development, backend architecture, workflow automation, and deployment.',
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
  cvUrl: CV_URL,
  ctaPrimaryLabel: 'Start a Project Conversation',
  ctaSecondaryLabel: 'View Fullstack Projects',
};

const asStringArray = (value, fallback) => {
  if (!Array.isArray(value)) return fallback;

  const items = value.map((item) => String(item || '').trim()).filter(Boolean);
  return items.length ? items : fallback;
};

const normalizeContactItem = (item = {}) => {
  const payload =
    item.payload && typeof item.payload === 'object' && !Array.isArray(item.payload)
      ? item.payload
      : {};

  return {
    title: String(item.title || DEFAULT_CONTACT.title).trim(),
    eyebrow: String(item.subtitle || DEFAULT_CONTACT.eyebrow).trim(),
    summary: String(item.summary || DEFAULT_CONTACT.summary).trim(),
    email: String(payload.email || DEFAULT_CONTACT.email).trim(),
    bookingUrl: String(payload.booking_url || DEFAULT_CONTACT.bookingUrl).trim(),
    location: String(payload.location || DEFAULT_CONTACT.location).trim(),
    availability: String(payload.availability || DEFAULT_CONTACT.availability).trim(),
    availabilityPoints: asStringArray(payload.availability_points, DEFAULT_CONTACT.availabilityPoints),
    remoteStatus: String(payload.remote_status || DEFAULT_CONTACT.remoteStatus).trim(),
    cvUrl: String(payload.cv_url || DEFAULT_CONTACT.cvUrl).trim(),
    ctaPrimaryLabel: String(payload.cta_primary_label || DEFAULT_CONTACT.ctaPrimaryLabel).trim(),
    ctaSecondaryLabel: String(payload.cta_secondary_label || DEFAULT_CONTACT.ctaSecondaryLabel).trim(),
  };
};

const renderContactTitle = (title) => {
  const text = String(title || DEFAULT_CONTACT.title).trim();
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
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);
  const reduced = useReducedMotion();
  const { viewport, sectionContainer, sectionItem, staggerGrid, clipReveal, cardPop } =
    useSectionMotion();

  const handleEmailCopy = async (e) => {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      window.location.href = `mailto:${contact.email}`;
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let mounted = true;

    const loadContact = async () => {
      const { data, error } = await supabase
        .from('cms_items')
        .select('id,title,subtitle,summary,payload,sort_order,is_published')
        .eq('collection', 'contact')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .limit(1);

      if (!mounted || error || !data?.length) return;
      setContact(normalizeContactItem(data[0]));
    };

    loadContact();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="s-contact" id="contact" style={{ position: 'relative', overflow: 'hidden' }}>
      <Waves 
        className="contact-waves-bg"
        strokeColor="rgba(200, 255, 0, 0.12)"
        backgroundColor="transparent"
        pointerSize={0}
      />
      <motion.div
        className="contact-inner"
        style={{ position: 'relative', zIndex: 10 }}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="contact-top" variants={sectionItem}>
          <motion.div variants={sectionItem}>
            <motion.h2 className="contact-headline" variants={clipReveal}>
              {renderContactTitle(contact.title)}
            </motion.h2>
            <motion.p className="contact-kicker" variants={sectionItem}>
              {contact.summary}
            </motion.p>
            <motion.div className="contact-top-actions" variants={sectionItem}>
              <motion.a
                href={contact.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="contact-top-link is-prime"
                whileHover={reduced ? {} : { scale: 1.04 }}
                whileTap={reduced ? {} : { scale: 0.96 }}
                transition={btnSpring}
                onClick={() => window.plausible?.('BookingCTA', { props: { source: 'contact' } })}
              >
                {contact.ctaPrimaryLabel}
              </motion.a>
              <motion.a
                href="#portfolio"
                data-scroll-target="#portfolio"
                className="contact-top-link"
                whileHover={reduced ? {} : { x: 4 }}
                whileTap={reduced ? {} : { scale: 0.97 }}
                transition={btnSpring}
              >
                {contact.ctaSecondaryLabel}
              </motion.a>
            </motion.div>
          </motion.div>
          <motion.div className="contact-badge" variants={sectionItem}>
            <div className="contact-badge-icon">
              <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M14 2v6h6" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M9 13h6" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M9 17h6" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="contact-badge-text">
              <span className="contact-badge-name">Curriculum Vitae</span>
              <span className="contact-badge-role">PDF Resume</span>
            </div>
            <a
              href={contact.cvUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="contact-badge-link"
              onClick={() => window.plausible?.('CVDownload', { props: { source: 'contact' } })}
            >
              Download Resume ↗
            </a>
          </motion.div>
        </motion.div>

        <motion.div className="contact-grid" variants={staggerGrid}>
          <motion.div className="contact-card" variants={cardPop}>
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
          </motion.div>

          <motion.div className="contact-card" variants={cardPop}>
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
          </motion.div>

          <motion.div className="contact-card" variants={cardPop}>
            <div className="cc-icon">
              <svg viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
            </div>
            <div className="cc-lbl">LOCATION</div>
            <div className="cc-loc">{contact.location}</div>
            <div className="cc-remote">
              <div className="status-pulse"></div> {contact.remoteStatus}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Contact;
