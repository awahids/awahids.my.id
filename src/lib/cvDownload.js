const OPEN_EVENT = 'cv-download:open';

export const openCvDownload = (source) =>
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { source } }));

export const onCvDownloadOpen = (handler) => {
  const listener = (event) => handler(event.detail);
  window.addEventListener(OPEN_EVENT, listener);
  return () => window.removeEventListener(OPEN_EVENT, listener);
};
