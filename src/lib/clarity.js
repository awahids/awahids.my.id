import { CONSENT_CHANGE_EVENT, readConsent } from './consent.js';

// Microsoft Clarity: session recordings and heatmaps.
//
// Stricter than Google Analytics on purpose. A session recording replays what
// someone did on the page, so the tag is not even loaded until the visitor
// accepts analytics cookies; there is no cookieless mode before consent.
// Declining later tells Clarity to stop setting cookies (Consent API v2), and
// consent.js expires the _clck/_clsk cookies it already set.
//
// Typed text is masked by Clarity itself, and the containers that show a
// visitor's own words (FAQ chat, AI Lab brief, README generator, CV form)
// carry data-clarity-mask so their content is masked too.

const PROJECT_ID = /^[a-z0-9]{6,20}$/i;

let loadedId = '';

// The official Clarity snippet, unrolled: calls made before the tag loads are
// queued on window.clarity.q and replayed by the tag.
const loadTag = (projectId) => {
  if (loadedId) return;
  loadedId = projectId;
  window.clarity =
    window.clarity ||
    function clarity() {
      (window.clarity.q = window.clarity.q || []).push(arguments);
    };
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${projectId}`;
  document.head.appendChild(script);
};

// This site runs no ads, so ad storage is always denied.
const sendConsent = (granted) =>
  window.clarity?.('consentv2', { ad_Storage: 'denied', analytics_Storage: granted ? 'granted' : 'denied' });

/**
 * Starts Clarity for a valid project id: now if the visitor already accepted,
 * otherwise the moment they do. Returns false (and does nothing) without one,
 * so a missing VITE_CLARITY_PROJECT_ID simply leaves Clarity off.
 */
export const initClarity = (projectId) => {
  const id = String(projectId ?? '').trim();
  if (typeof window === 'undefined' || !PROJECT_ID.test(id)) return false;

  const apply = (choice) => {
    if (choice === 'granted') {
      loadTag(id);
      sendConsent(true);
    } else if (loadedId) {
      sendConsent(false);
    }
  };

  apply(readConsent());
  window.addEventListener(CONSENT_CHANGE_EVENT, (event) => apply(event.detail));
  return true;
};
