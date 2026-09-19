import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { onCvDownloadOpen } from '../lib/cvDownload';
import { modalCardVariants, modalOverlayMotion } from '../lib/modalMotion';

const EMPTY_FORM = { name: '', email: '', note: '', website: '' };
const DOWNLOAD_NAME = 'CV_A_Wahid_Safhadi.pdf';

const startDownload = (url) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = DOWNLOAD_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const CvDownloadModal = () => {
  const reduceMotion = useReducedMotion();
  const [request, setRequest] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState('idle');
  const [downloadUrl, setDownloadUrl] = useState('');
  const cardRef = useRef(null);
  const nameRef = useRef(null);
  const previousFocus = useRef(null);

  const close = useCallback(() => setRequest(null), []);

  useEffect(
    () =>
      onCvDownloadOpen((detail) => {
        previousFocus.current = document.activeElement;
        setForm(EMPTY_FORM);
        setStatus('idle');
        setDownloadUrl('');
        setRequest(detail);
      }),
    []
  );

  useEffect(() => {
    if (!request) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = window.requestAnimationFrame(() => nameRef.current?.focus());

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab' || !cardRef.current) return;
      const focusable = Array.from(
        cardRef.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled])')
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus.current?.focus?.();
    };
  }, [request, close]);

  const setField = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status === 'sending') return;

    // Honeypot: real visitors never see this field. Pretend it worked, send nothing.
    if (form.website) {
      setStatus('done');
      return;
    }

    setStatus('sending');

    if (!isSupabaseConfigured || !supabase) {
      setStatus('error');
      return;
    }

    const { data, error } = await supabase.functions.invoke('cv-download', {
      body: {
        name: form.name.trim(),
        email: form.email.trim(),
        note: form.note.trim(),
        source: request.source,
      },
    });
    if (error || !data?.url) {
      setStatus('error');
      return;
    }

    window.plausible?.('CVDownload', { props: { source: request.source } });
    setDownloadUrl(data.url);
    startDownload(data.url);
    setStatus('done');
  };

  const firstName = form.name.trim().split(/\s+/)[0];

  return (
    <AnimatePresence>
      {request && (
        <motion.div className="modal-overlay active" onClick={close} {...modalOverlayMotion(reduceMotion)}>
          <motion.div
            className="cvm-card"
            ref={cardRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cvm-title"
            onClick={(event) => event.stopPropagation()}
            variants={modalCardVariants(reduceMotion)}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <button type="button" className="modal-close" onClick={close} aria-label="Close">✕</button>

            {status === 'done' ? (
              <div className="cvm-done" role="status">
                <h2 id="cvm-title" className="cvm-title">Thanks{firstName ? `, ${firstName}` : ''}.</h2>
                <p className="cvm-lead">Your download should start now. If it didn't, use the button below.</p>
                <div className="cvm-actions">
                  <a className="btn-prime" href={downloadUrl} download={DOWNLOAD_NAME}>Download again</a>
                  <button type="button" className="btn-ghost cvm-plain" onClick={close}>Close</button>
                </div>
              </div>
            ) : (
              <form className="cvm-form" onSubmit={handleSubmit}>
                <h2 id="cvm-title" className="cvm-title">Download my CV</h2>
                <p className="cvm-lead">Leave your details and the PDF downloads right away.</p>

                <label className="cvm-field">
                  <span>Name</span>
                  <input ref={nameRef} type="text" name="name" autoComplete="name" required maxLength={120}
                    value={form.name} onChange={setField('name')} />
                </label>
                <label className="cvm-field">
                  <span>Email</span>
                  <input type="email" name="email" autoComplete="email" required maxLength={254}
                    value={form.email} onChange={setField('email')} />
                </label>
                <label className="cvm-field">
                  <span>Company or what you're hiring for <em>(optional)</em></span>
                  <input type="text" name="note" autoComplete="organization" maxLength={300}
                    value={form.note} onChange={setField('note')} />
                </label>

                <div className="cvm-trap" aria-hidden="true">
                  <label>Website
                    <input type="text" name="website" tabIndex={-1} autoComplete="off"
                      value={form.website} onChange={setField('website')} />
                  </label>
                </div>

                {status === 'error' && (
                  <p className="cvm-error" role="alert">
                    Couldn't save your details, so the CV wasn't downloaded. Check your connection and try again.
                  </p>
                )}

                <button type="submit" className="btn-prime cvm-submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Download CV'}
                </button>
                <p className="cvm-note">Only used to follow up about work. Never shared or sold.</p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CvDownloadModal;
