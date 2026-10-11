import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EXPERIENCES } from '../lib/experienceData';
import { gsap, Draggable, DUR, prefersReducedMotion, useIsoLayoutEffect } from '../lib/motion';
import { useGsapReveal } from '../lib/useGsapReveal';
import { useTextScramble } from '../lib/useTextScramble';


// Horizontal timeline only on wide screens with motion allowed; everyone else
// keeps the tabbed console.
const HORIZONTAL_QUERY = '(min-width: 961px) and (prefers-reduced-motion: no-preference)';

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};

// "Aug 2022 — Feb 2025 · West Jakarta" → period, location, start year
const splitTag = (tag = '') => {
  const [period = '', location = ''] = tag.split(' · ');
  const year = (tag.match(/\d{4}/) || [''])[0];
  return { period, location, year };
};

// Typed text hook — types a target element out character by character
const useTypedText = (targetRef, text, deps) => {
  useEffect(() => {
    const el = targetRef.current;
    if (!el || !text) return;

    if (prefersReducedMotion()) { el.textContent = text; return; }

    el.textContent = '';
    let cancelled = false;
    let timeoutId;

    const chars = text.split('');
    let i = 0;
    const type = () => {
      if (cancelled || i >= chars.length) return;
      el.textContent += chars[i++];
      timeoutId = setTimeout(type, 28 + Math.random() * 18);
    };
    // Small initial delay so the panel entrance finishes first
    timeoutId = setTimeout(type, 340);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

const Experience = () => {
  const experiences = EXPERIENCES;
  const [activeId, setActiveId] = useState(EXPERIENCES[0]?.id || '');

  const activeExperience = useMemo(
    () => experiences.find((e) => e.id === activeId) || experiences[0],
    [activeId, experiences]
  );

  // Refs for animated elements
  const sectionRef = useRef(null);
  const navRef = useRef(null);
  const panelRef = useRef(null);
  const glyphRef = useRef(null);
  const cmdTextRef = useRef(null);
  const underlineRef = useRef(null);
  const firstPanelRef = useRef(true);
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const fillRef = useRef(null);

  const horizontal = useMediaQuery(HORIZONTAL_QUERY);

  useGsapReveal(sectionRef);
  useTextScramble(sectionRef);

  // Typed command line text
  const cmdText = activeId ? `$ cat ./${activeId}.md` : '';
  useTypedText(cmdTextRef, cmdText, [activeId, horizontal]);

  // Horizontal timeline: the section pins and vertical scroll drives the
  // track's x. Dragging the track maps back onto window scroll, so the pin
  // stays the single source of truth for position.
  useIsoLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!horizontal || !section || !viewport || !track) return undefined;

    const mm = gsap.matchMedia(section);
    mm.add(HORIZONTAL_QUERY, () => {
      const cards = gsap.utils.toArray('.jh-card', track);
      const dots = gsap.utils.toArray('.jh-dot', section);
      const setFill = fillRef.current ? gsap.quickSetter(fillRef.current, 'scaleX') : null;
      const getDistance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      let active = -1;

      const setActive = (index) => {
        if (index === active) return;
        active = index;
        cards.forEach((card, i) => card.classList.toggle('is-active', i === index));
        dots.forEach((dot, i) => {
          dot.classList.toggle('is-active', i === index);
          dot.classList.toggle('is-reached', i <= index);
        });
      };

      const scrollTween = gsap.to(track, {
        x: () => -getDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + getDistance(),
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
        // Follow the smoothed tween (not raw scroll) so rail and cards agree.
        // `this` is the tween: ScrollTrigger renders it during construction,
        // before `scrollTween` is assigned.
        onUpdate() {
          const progress = this.progress();
          setFill?.(progress);
          setActive(Math.round(progress * (cards.length - 1)));
        },
      });
      const st = scrollTween.scrollTrigger;
      setFill?.(0);
      setActive(0);

      // Each card grows into the centre and settles back as it leaves; its
      // year drifts against the track for a little depth.
      cards.forEach((card) => {
        const year = card.querySelector('.jh-year');
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: card,
            containerAnimation: scrollTween,
            start: 'left right',
            end: 'right left',
            scrub: true,
          },
        });
        tl.fromTo(card, { scale: 0.92 }, { scale: 1, duration: 1 })
          .to(card, { scale: 0.92, duration: 1 });
        if (year) tl.fromTo(year, { xPercent: 35 }, { xPercent: -35, duration: 2 }, 0);
      });

      // Grab-and-fling: a detached proxy carries the Draggable/Inertia maths,
      // and every update scrolls the window to the matching pin position.
      const proxy = document.createElement('div');
      let startProgress = 0;
      let startX = 0;
      let pinned = false;
      function syncScroll() {
        const distance = getDistance();
        if (!pinned || !distance) return;
        const progress = gsap.utils.clamp(0, 1, startProgress - (this.x - startX) / distance);
        st.scroll(st.start + progress * (st.end - st.start));
      }
      const [drag] = Draggable.create(proxy, {
        type: 'x',
        trigger: viewport,
        inertia: true,
        cursor: 'grab',
        activeCursor: 'grabbing',
        onPress() {
          const distance = getDistance();
          // Only drive scroll while pinned, so a press before/after the pin
          // can't yank the page to the section.
          pinned = st.isActive;
          startProgress = st.progress;
          startX = this.x;
          this.applyBounds({
            minX: startX - (1 - startProgress) * distance,
            maxX: startX + startProgress * distance,
          });
        },
        onDrag: syncScroll,
        onThrowUpdate: syncScroll,
      });

      return () => drag.kill();
    });

    return () => mm.revert();
  }, [horizontal]);

  // Quick panel + glyph entrance whenever the active tab changes (not on mount —
  // the scroll reveal covers that).
  useIsoLayoutEffect(() => {
    if (firstPanelRef.current) { firstPanelRef.current = false; return undefined; }
    const panel = panelRef.current;
    if (!panel || prefersReducedMotion()) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(panel, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, clearProps: 'transform' });
      if (glyphRef.current) {
        gsap.fromTo(glyphRef.current,
          { scale: 0.6, opacity: 0 },
          { scale: 1, opacity: 1, duration: DUR.base, ease: 'back.out(1.4)', delay: 0.05, clearProps: 'transform' }
        );
      }
    }, panel);
    return () => ctx.revert();
  }, [activeId]);

  // Sliding underline for active tab button. offsetTop ignores the reveal's
  // transforms, and only `y` animates — height just snaps.
  useEffect(() => {
    const nav = navRef.current;
    const line = underlineRef.current;
    if (!nav || !line) return undefined;

    const activeBtn = nav.querySelector('.journey-item.active');
    if (!activeBtn) return undefined;

    gsap.set(line, { height: activeBtn.offsetHeight, opacity: 1 });
    const tween = gsap.to(line, {
      y: activeBtn.offsetTop,
      duration: prefersReducedMotion() ? 0 : 0.35,
      overwrite: true,
    });
    return () => tween.kill();
  }, [activeId, experiences, horizontal]);

  if (!activeExperience) return null;

  return (
    <section className={`s-exp${horizontal ? ' s-exp--h' : ''}`} id="experience" ref={sectionRef}>
      <div>
        <div className="s-eyebrow" data-gsap-reveal="left">
          // <span data-scramble="CAREER_LOG">CAREER_LOG</span>
        </div>
        <div className="journey-head">
          <h2 className="journey-title" data-gsap-reveal="split-lines">
            The <span className="j-badge">journey</span>.<br />
            Backend-first <span className="j-serif">mindset</span>.<br />
            Fullstack in <span className="j-stroke">practice</span>.
          </h2>
          <div className="journey-meta" data-gsap-reveal="up">
            BASED IN CIKARANG, BEKASI <span className="j-dot">●</span><br />
          </div>
        </div>

        {horizontal ? (
          <div className="jh">
            <div className="jh-rail" aria-hidden="true">
              <div className="jh-rail-line">
                <div className="jh-rail-fill" ref={fillRef} />
              </div>
              {experiences.map((experience, index) => (
                <span
                  key={experience.id}
                  className="jh-dot"
                  style={{ left: `${(index / Math.max(1, experiences.length - 1)) * 100}%` }}
                >
                  <span className="jh-dot-label">{splitTag(experience.tag).year}</span>
                </span>
              ))}
            </div>

            <div className="jh-viewport" ref={viewportRef}>
              <div className="jh-track" ref={trackRef}>
                <div className="jh-intro" aria-hidden="true">
                  <span className="jh-intro-count">0{experiences.length}</span>
                  <span className="jh-intro-label">roles, newest first</span>
                  <span className="jh-intro-hint">Scroll or drag &rarr;</span>
                </div>
                <ol className="jh-list">
                  {experiences.map((experience, index) => {
                    const { period, location, year } = splitTag(experience.tag);
                    return (
                      <li className="jh-card" key={experience.id}>
                        <article className="jh-card-inner" aria-labelledby={`jh-${experience.id}`}>
                          <div className="jh-card-top">
                            <span className="jh-num">0{index + 1} / 0{experiences.length}</span>
                            <span className="jh-glyph" aria-hidden="true">{experience.glyph}</span>
                          </div>
                          <div className="jh-year" aria-hidden="true">{year}</div>
                          <div className="jh-card-body">
                            <p className="jh-role">// {experience.role}</p>
                            <h3 className="jh-company" id={`jh-${experience.id}`}>{experience.title}</h3>
                            <p className="jh-blurb">{experience.blurb}</p>
                          </div>
                          <ul className="jh-chips">
                            {period && <li className="jh-chip">{period}</li>}
                            {location && <li className="jh-chip">{location}</li>}
                          </ul>
                        </article>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <div className="journey-layout">
            {/* Navigation with sliding underline */}
            <div className="journey-nav-wrap">
              {/* Animated underline indicator */}
              <div className="journey-active-line" ref={underlineRef} aria-hidden="true" />
              <div className="journey-nav" ref={navRef}>
                {experiences.map((experience, index) => (
                  <button
                    key={experience.id}
                    type="button"
                    className={`journey-item ${activeId === experience.id ? 'active' : ''}`}
                    onMouseEnter={() => setActiveId(experience.id)}
                    onFocus={() => setActiveId(experience.id)}
                    onClick={() => setActiveId(experience.id)}
                    data-gsap-reveal="left"
                  >
                    <div className="journey-item-left">
                      <span className="journey-item-num">0{index + 1}</span>
                      <span className="journey-item-title">{experience.title}</span>
                    </div>
                    <span className="journey-item-arrow">↗</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="journey-console" data-gsap-reveal="up">
              <div className="journey-console-head">
                <div className="journey-lights">
                  <span></span><span></span><span></span>
                </div>
                <div className="journey-path">~/career/{activeId}.log</div>
                <div className="journey-running">RUNNING_CMD</div>
              </div>
              <div className="journey-body">
                <div
                  ref={panelRef}
                  style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                >
                  <div className="journey-glyph" ref={glyphRef}>{activeExperience.glyph}</div>
                  <div>
                    <div className="journey-role">// role</div>
                    <h3 className="journey-company">{activeExperience.title}</h3>
                  </div>
                  <div>
                    <p className="journey-quote">"{activeExperience.blurb}"</p>
                    <div className="journey-tag-wrap">
                      <span className="journey-tag">{activeExperience.tag}</span>
                    </div>
                    <div className="journey-command">
                      <span ref={cmdTextRef} /><span className="journey-cursor">▌</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Experience;
