// Analytics cookie consent, wired to Google Consent Mode v2.
//
// index.html sets every Google storage type to "denied" before gtag.js loads,
// then re-applies a choice saved here. The banner only ever grants
// analytics_storage: this site runs no ads, so the ad_* signals stay denied.
// Plausible is cookieless and runs either way.

// index.html reads this key too, before the app loads; keep the two in sync.
export const CONSENT_STORAGE_KEY = 'aw-analytics-consent';
export const OPEN_CONSENT_EVENT = 'aw:open-consent';

const CHOICES = new Set(['granted', 'denied']);

/** The saved choice, or null when the visitor has not chosen yet. */
export const readConsent = () => {
  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return CHOICES.has(value) ? value : null;
  } catch {
    return null;
  }
};

// The domain a cookie may have been set on: GA uses the widest one it can
// (".example.com"), but older tags may have used the exact host.
const cookieDomains = (hostname) => {
  const parts = hostname.split('.');
  const domains = [''];
  for (let i = 0; i < parts.length - 1; i += 1) {
    const domain = parts.slice(i).join('.');
    domains.push(`; domain=${domain}`, `; domain=.${domain}`);
  }
  return domains;
};

/** Expires every Google Analytics cookie (_ga, _ga_<id>, _gid, _gat...). */
export const clearAnalyticsCookies = () => {
  const names = document.cookie
    .split(';')
    .map((cookie) => cookie.split('=')[0].trim())
    .filter((name) => /^_g(a|id|at)(_|$)/.test(name));
  for (const name of names) {
    for (const domain of cookieDomains(window.location.hostname)) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    }
  }
};

/** Saves the choice and tells Google tags about it right away. */
export const saveConsent = (choice) => {
  if (!CHOICES.has(choice)) return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Storage blocked: the choice still applies for this page view.
  }
  window.gtag?.('consent', 'update', { analytics_storage: choice });
  if (choice === 'denied') clearAnalyticsCookies();
};

/** Reopens the banner, e.g. from a "Cookie settings" link. */
export const openConsentSettings = () => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
