import React, { useEffect, useState } from 'react';
import { OPEN_CONSENT_EVENT, readConsent, saveConsent } from '../lib/consent';

// Clarity is only mentioned where it can actually run (see src/lib/clarity.js).
const CLARITY_ENABLED = Boolean(import.meta.env.VITE_CLARITY_PROJECT_ID);

// Shown until the visitor picks, and again whenever "Cookie settings" asks
// for it. Not a modal: the page stays usable, and nothing is stored by
// Google Analytics while no choice has been made.
const CookieConsent = () => {
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && readConsent() === null);
  const [current, setCurrent] = useState(() => (typeof window !== 'undefined' ? readConsent() : null));

  useEffect(() => {
    const reopen = () => {
      setCurrent(readConsent());
      setOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
  }, []);

  if (!open) return null;

  const choose = (choice) => {
    saveConsent(choice);
    setCurrent(choice);
    setOpen(false);
  };

  return (
    <section className="cookie-consent" role="region" aria-labelledby="cookie-consent-title">
      <h2 id="cookie-consent-title" className="cookie-consent-title">Analytics cookies</h2>
      <p className="cookie-consent-text">
        {CLARITY_ENABLED
          ? 'I use Google Analytics and Microsoft Clarity cookies to see which pages and tools people use, and Clarity records clicks and scrolling so I can fix what is confusing. No ads, and what you type stays hidden.'
          : 'I use Google Analytics cookies to see which pages and tools people use, so I can improve them. They hold no ads and nothing you type.'}{' '}
        Plausible, which sets no cookies, counts visits either way.{' '}
        <a href="/privacy">Privacy policy</a>
      </p>
      {current && (
        <p className="cookie-consent-current">
          Current choice: {current === 'granted' ? 'accepted' : 'declined'}.
        </p>
      )}
      <div className="cookie-consent-actions">
        <button type="button" className="cookie-consent-btn" onClick={() => choose('denied')}>
          Decline
        </button>
        <button type="button" className="cookie-consent-btn is-primary" onClick={() => choose('granted')}>
          Accept
        </button>
      </div>
    </section>
  );
};

export default CookieConsent;
