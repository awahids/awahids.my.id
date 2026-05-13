import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BOOKING_URL } from '../lib/links';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (container) =>
  Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('aria-hidden')
  );

const ease = [0.16, 1, 0.3, 1];

const PROJECT_ACCENTS = [
  '#C8FF00', '#FF6B00', '#C8FF00', '#0076FF',
  '#FF2929', '#C8FF00', '#FF6B00',
];

const getAccent = (index) => PROJECT_ACCENTS[index % PROJECT_ACCENTS.length];

const PortfolioScrollSwap = ({
  projects,
  selectedProject,
  onOpenModal,
  closeModal,
  modalRef,
  closeButtonRef,
  reduceMotion,
}) => {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const stickyRef = useRef(null);

  const currentIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayedIndex, setDisplayedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(max-width: 960px)').matches
      : false
  );

  // Text element refs for GSAP transitions
  const numRef = useRef(null);
  const catRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const tagsRef = useRef(null);
  const actionsRef = useRef(null);
  // Mobile accent glow div
  const accentBgRef = useRef(null);

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 960px)');
    const sync = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', sync);
    else mq.addListener(sync);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', sync);
      else mq.removeListener(sync);
    };
  }, []);

  const getTextEls = useCallback(() =>
    [numRef, catRef, titleRef, descRef, tagsRef, actionsRef]
      .map((r) => r.current)
      .filter(Boolean),
    []
  );

  const triggerProjectTransition = useCallback((newIndex) => {
    currentIndexRef.current = newIndex;
    setActiveIndex(newIndex);

    if (reduceMotion) {
      setDisplayedIndex(newIndex);
      return;
    }

    const els = getTextEls();

    // Mobile: slide vertically; Desktop: slide horizontally
    const outProps = isMobile
      ? { y: -20, opacity: 0, duration: 0.18, ease: 'power2.in', stagger: 0.02 }
      : { x: -36, opacity: 0, duration: 0.20, ease: 'power2.in', stagger: 0.025 };

    const inFrom = isMobile ? { y: 24, opacity: 0 } : { x: 36, opacity: 0 };
    const inTo = isMobile
      ? { y: 0, opacity: 1, duration: 0.32, ease: 'power3.out', stagger: 0.03 }
      : { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out', stagger: 0.035 };

    const tl = gsap.timeline();

    if (els.length) {
      tl.to(els, outProps);
    }

    tl.call(() => {
      setDisplayedIndex(newIndex);
      // Animate mobile accent color
      if (accentBgRef.current) {
        const nextColor = getAccent(newIndex);
        gsap.to(accentBgRef.current, {
          '--pswap-glow': nextColor,
          duration: 0.6,
          ease: 'power2.out',
        });
        // Fallback: set inline style directly for browsers that can't tween CSS vars
        accentBgRef.current.style.setProperty('--pswap-glow', nextColor);
      }
    });

    if (els.length) {
      tl.fromTo(els, inFrom, inTo);
    }
  }, [reduceMotion, getTextEls, isMobile]);

  // GSAP pin + ScrollTrigger — works for both mobile and desktop
  useEffect(() => {
    if (!trackRef.current || !stickyRef.current || !projects.length) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: trackRef.current,
        start: 'top top',
        end: () => `+=${(projects.length - 1) * window.innerHeight}`,
        pin: stickyRef.current,
        pinSpacing: false,
        onUpdate: (self) => {
          const rawIdx = self.progress * projects.length;
          const idx = Math.min(Math.floor(rawIdx), projects.length - 1);

          if (idx !== currentIndexRef.current) {
            triggerProjectTransition(idx);
          }

          // Progress bar fill
          const fill = stickyRef.current?.querySelector('.pswap-progress-fill');
          if (fill) {
            fill.style.transform = `scaleX(${(idx + 1) / projects.length})`;
          }

          // Dots (both vertical desktop and horizontal mobile)
          const dots = stickyRef.current?.querySelectorAll('.pswap-dot');
          dots?.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === idx);
          });
        },
      });
    }, containerRef.current);

    return () => ctx.revert();
  }, [projects.length, triggerProjectTransition]);

  // Refresh when projects list changes (Supabase)
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [projects.length]);

  // Modal keyboard / focus management
  useEffect(() => {
    if (!selectedProject) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusHandle = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
      if (e.key !== 'Tab') return;
      const modal = modalRef.current;
      if (!modal) return;
      const focusableEls = getFocusableElements(modal);
      if (!focusableEls.length) { e.preventDefault(); modal.focus(); return; }
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusHandle);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedProject, closeModal, closeButtonRef, modalRef]);

  const p = projects[displayedIndex] || projects[activeIndex] || projects[0] || null;
  if (!p) return null;

  const scopeLimit = isMobile ? 4 : 5;
  const accent = getAccent(activeIndex);

  return (
    <section className="s-portfolio-swap" id="portfolio" ref={containerRef}>
      {/* Section header */}
      <div className="pswap-header">
        <div className="s-eyebrow">// SELECTED_WORK</div>
        <h2 className="s-title">
          Selected <span className="s-outline">Projects</span>
        </h2>
        <p className="port-intro">
          Real projects across web apps, dashboards, backend systems, automation, and deployment.
        </p>
      </div>

      {/* Scroll track */}
      <div
        className="pswap-track"
        ref={trackRef}
        style={{ height: `${projects.length * 100}vh` }}
      >
        <div className="pswap-sticky" ref={stickyRef}>

          {/* ── DESKTOP layout (>960px) ─────────────────────── */}
          {!isMobile && (
            <>
              <div className="pswap-left">
                <div className="pswap-progress-bar" aria-hidden="true">
                  <div className="pswap-progress-fill" />
                </div>
                <div className="pswap-project-num" aria-hidden="true" ref={numRef}>
                  {p.num}
                </div>
                <div className="pswap-meta">
                  {p.cat && <div className="pswap-cat" ref={catRef}>{p.cat}</div>}
                </div>
                <h3 className="pswap-title" ref={titleRef}>{p.title}</h3>
                <p className="pswap-desc" ref={descRef}>{p.desc}</p>
                <div className="pswap-tags" ref={tagsRef}>
                  {p.scope.slice(0, scopeLimit).map((s) => (
                    <span key={s} className="pswap-tag">{s}</span>
                  ))}
                </div>
                <div className="pswap-actions" ref={actionsRef}>
                  <button
                    type="button"
                    className="pswap-btn pswap-btn-prime"
                    onClick={() => onOpenModal(p)}
                    aria-haspopup="dialog"
                  >
                    Open Case ↗
                  </button>
                  {p.live !== '#' && (
                    <a href={p.live} target="_blank" rel="noopener noreferrer" className="pswap-btn pswap-btn-ghost">
                      View Live ↗
                    </a>
                  )}
                </div>
              </div>

              <div className="pswap-dots" aria-hidden="true">
                {projects.map((_, i) => (
                  <span key={i} className={`pswap-dot${i === activeIndex ? ' is-active' : ''}`} />
                ))}
              </div>
            </>
          )}

          {/* ── MOBILE layout (≤960px) ───────────────────────── */}
          {isMobile && (
            <div className="pswap-mobile">
              {/* Accent glow background */}
              <div
                className="pswap-mobile-glow"
                ref={accentBgRef}
                style={{ '--pswap-glow': accent }}
                aria-hidden="true"
              />

              {/* Top progress bar */}
              <div className="pswap-progress-bar pswap-progress-bar--mobile" aria-hidden="true">
                <div className="pswap-progress-fill" />
              </div>

              {/* Ghost number */}
              <div className="pswap-project-num pswap-project-num--mobile" aria-hidden="true" ref={numRef}>
                {p.num}
              </div>

              {/* Card content */}
              <div className="pswap-mobile-content">
                {p.cat && (
                  <div className="pswap-cat pswap-cat--mobile" ref={catRef}>{p.cat}</div>
                )}
                <h3 className="pswap-title pswap-title--mobile" ref={titleRef}>{p.title}</h3>
                <p className="pswap-desc pswap-desc--mobile" ref={descRef}>{p.desc}</p>
                <div className="pswap-tags" ref={tagsRef}>
                  {p.scope.slice(0, scopeLimit).map((s) => (
                    <span key={s} className="pswap-tag">{s}</span>
                  ))}
                </div>
                <div className="pswap-actions pswap-actions--mobile" ref={actionsRef}>
                  <button
                    type="button"
                    className="pswap-btn pswap-btn-prime"
                    onClick={() => onOpenModal(p)}
                    aria-haspopup="dialog"
                  >
                    Open Case ↗
                  </button>
                  {p.live !== '#' && (
                    <a href={p.live} target="_blank" rel="noopener noreferrer" className="pswap-btn pswap-btn-ghost">
                      View Live ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Horizontal dots — bottom */}
              <div className="pswap-dots pswap-dots--mobile" aria-label={`Project ${activeIndex + 1} of ${projects.length}`}>
                {projects.map((_, i) => (
                  <span key={i} className={`pswap-dot${i === activeIndex ? ' is-active' : ''}`} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div
            className="modal-overlay active"
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.28, ease }}
          >
            <motion.div
              className="modal-card"
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`project-modal-title-${selectedProject.id}`}
              tabIndex="-1"
              onClick={(e) => e.stopPropagation()}
              initial={reduceMotion ? { opacity: 1 } : { scale: 0.9, y: 20 }}
              animate={reduceMotion ? { opacity: 1 } : { scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { scale: 0.9, y: 20 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 300 }}
            >
              <button ref={closeButtonRef} className="modal-close" onClick={closeModal} aria-label="Close project details">✕</button>
              <div className="modal-header">
                {selectedProject.cat && <div className="mh-cat">{selectedProject.cat}</div>}
                <h2 id={`project-modal-title-${selectedProject.id}`} className="mh-title">{selectedProject.title}</h2>
                {selectedProject.year && <div className="mh-year">Release: {selectedProject.year}</div>}
              </div>
              <div className="modal-content">
                <div className="m-case-sections">
                  <article className="m-case-block">
                    <div className="m-case-lbl">Overview</div>
                    <p className="m-body-text">{selectedProject.desc}</p>
                  </article>
                  <article className="m-case-block">
                    <div className="m-case-lbl">Problem</div>
                    <p className="m-body-text">{selectedProject.problem}</p>
                  </article>
                  <article className="m-case-block">
                    <div className="m-case-lbl">What I Built</div>
                    <p className="m-body-text">{selectedProject.built}</p>
                  </article>
                  <article className="m-case-block">
                    <div className="m-case-lbl">Result</div>
                    <p className="m-body-text">{selectedProject.result}</p>
                  </article>
                  <article className="m-case-block">
                    <div className="m-case-lbl">Business Impact</div>
                    <p className="m-body-text">{selectedProject.impact}</p>
                  </article>
                  <article className="m-case-block">
                    <div className="m-case-lbl">Key Outcomes</div>
                    <ul className="m-impact-list">
                      {selectedProject.outcomes.map((outcome) => (
                        <li key={outcome}>{outcome}</li>
                      ))}
                    </ul>
                  </article>
                </div>
                <div className="modal-sidebar">
                  <div className="m-sidebar-section">
                    <div className="m-ss-lbl">Project Snapshot</div>
                    <div className="m-meta-grid">
                      <div className="m-meta-item"><span>Type</span><strong>{selectedProject.type}</strong></div>
                      <div className="m-meta-item"><span>Role</span><strong>{selectedProject.role}</strong></div>
                      <div className="m-meta-item"><span>Focus</span><strong>{selectedProject.focus.join(' · ')}</strong></div>
                    </div>
                  </div>
                  <div className="m-sidebar-section">
                    <div className="m-ss-lbl">Impact Signals</div>
                    <div className="m-signal-grid">
                      {selectedProject.signals.map((signal) => (
                        <div key={signal.label} className="m-signal-item">
                          <span className="m-signal-label">{signal.label}</span>
                          <strong className="m-signal-value">{signal.value}</strong>
                          <span className="m-signal-note">{signal.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="m-sidebar-section">
                    <div className="m-ss-lbl">Fullstack Scope</div>
                    <div className="m-ss-tags">
                      {selectedProject.scope.map((scope) => (
                        <span key={scope} className="m-ss-tag">{scope}</span>
                      ))}
                    </div>
                  </div>
                  <div className="m-sidebar-section">
                    <div className="m-ss-lbl">Tech Stack</div>
                    <div className="m-ss-tags">
                      {selectedProject.stack.map((s) => (
                        <span key={s} className="m-ss-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="m-actions">
                    <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn prime">Discuss Similar Project ↗</a>
                    {selectedProject.live !== '#' && (
                      <a href={selectedProject.live} target="_blank" rel="noopener noreferrer" className="m-btn ghost">View Live Product ↗</a>
                    )}
                    {selectedProject.case !== '#' && (
                      <a href={selectedProject.case} target="_blank" rel="noopener noreferrer" className="m-btn ghost">Case Study ↗</a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PortfolioScrollSwap;
