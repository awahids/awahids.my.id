// One call sends an event to both analytics tools on the page: Plausible
// (keeps the event names its goals already use) and Google Analytics 4
// (gets the snake_case name GA4 expects, e.g. CVDownload -> cv_download).
//
// Props describe what happened, never who did it: no typed text, AI
// prompts, names or emails. Google's terms forbid sending personal data to
// GA, and neither report needs it.

export const toGaEventName = (name) =>
  String(name)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()
    .slice(0, 40);

export const trackEvent = (name, props = {}) => {
  if (typeof window === 'undefined') return;
  try {
    window.plausible?.(name, { props });
    window.gtag?.('event', toGaEventName(name), props);
  } catch {
    // An analytics script failing must never break the page.
  }
};
