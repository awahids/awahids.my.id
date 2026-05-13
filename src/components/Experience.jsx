import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { DEFAULT_EXPERIENCES, normalizeExperience } from '../lib/experienceData';
import { useSectionMotion } from '../lib/sectionMotion';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const EXPERIENCE_SELECT = 'id,title,role,blurb,tag,glyph,sort_order,is_published';

// Typed text hook — animates a target element character by character using anime.js
const useTypedText = (targetRef, text, deps) => {
  useEffect(() => {
    const el = targetRef.current;
    if (!el || !text) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) { el.textContent = text; return; }

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
    // Small initial delay so Framer Motion entrance finishes first
    timeoutId = setTimeout(type, 340);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};

const Experience = () => {
  const [experiences, setExperiences] = useState(DEFAULT_EXPERIENCES);
  const [activeId, setActiveId] = useState(DEFAULT_EXPERIENCES[0]?.id || '');
  const { viewport, sectionContainer, sectionItem, staggerTight, eyebrow, clipReveal } = useSectionMotion();

  const activeExperience = useMemo(
    () => experiences.find((e) => e.id === activeId) || experiences[0],
    [activeId, experiences]
  );

  // Refs for animated elements
  const navRef = useRef(null);
  const glyphRef = useRef(null);
  const cmdTextRef = useRef(null);
  const underlineRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;
    let mounted = true;
    const loadExperiences = async () => {
      const { data, error } = await supabase
        .from('experiences')
        .select(EXPERIENCE_SELECT)
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (!mounted || error || !data?.length) return;
      const nextExperiences = data.map(normalizeExperience);
      setExperiences(nextExperiences);
      setActiveId((cur) =>
        nextExperiences.some((e) => e.id === cur) ? cur : nextExperiences[0].id
      );
    };
    loadExperiences();
    return () => { mounted = false; };
  }, []);

  // Typed command line text
  const cmdText = activeId ? `$ cat ./${activeId}.md` : '';
  useTypedText(cmdTextRef, cmdText, [activeId]);

  // Glyph entrance animation whenever activeId changes
  useEffect(() => {
    const el = glyphRef.current;
    if (!el) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.fromTo(el,
      { scale: 0.4, opacity: 0, rotateZ: -15 },
      { scale: 1, opacity: 1, rotateZ: 0, duration: 0.55, ease: 'back.out(1.4)', delay: 0.1 }
    );
  }, [activeId]);

  // Sliding underline for active tab button
  useEffect(() => {
    const nav = navRef.current;
    const line = underlineRef.current;
    if (!nav || !line) return;

    const activeBtn = nav.querySelector('.journey-item.active');
    if (!activeBtn) return;

    const navRect = nav.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();

    gsap.to(line, {
      y: btnRect.top - navRect.top,
      height: btnRect.height,
      opacity: 1,
      duration: 0.35,
      ease: 'power3.out',
    });
  }, [activeId, experiences]);

  // Animate nav items with GSAP on first mount
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const btns = nav.querySelectorAll('.journey-item');
    if (!btns.length) return;

    if (prefersReducedMotion) {
      gsap.set(btns, { opacity: 1, x: 0 });
      return;
    }

    gsap.fromTo(btns,
      { x: -24, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.48,
        ease: 'power3.out',
        stagger: { each: 0.06, delay: 0.2 },
      }
    );
  }, []);

  if (!activeExperience) return null;

  return (
    <section className="s-exp" id="experience">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="s-eyebrow" variants={eyebrow}>
          // CAREER_LOG
        </motion.div>
        <motion.div className="journey-head" variants={clipReveal}>
          <h2 className="journey-title">
            The <span className="j-badge">journey</span>.<br />
            Backend-first <span className="j-serif">mindset</span>.<br />
            Fullstack in <span className="j-stroke">practice</span>.
          </h2>
          <div className="journey-meta">
            BASED IN CIKARANG, BEKASI <span className="j-dot">●</span><br />
          </div>
        </motion.div>

        <motion.div className="journey-layout" variants={sectionItem}>
          {/* Navigation with sliding underline */}
          <div className="journey-nav-wrap">
            {/* Animated underline indicator */}
            <div className="journey-active-line" ref={underlineRef} aria-hidden="true" />
            <motion.div className="journey-nav" ref={navRef} variants={staggerTight}>
              {experiences.map((experience, index) => (
                <motion.button
                  key={experience.id}
                  type="button"
                  className={`journey-item ${activeId === experience.id ? 'active' : ''}`}
                  onMouseEnter={() => setActiveId(experience.id)}
                  onFocus={() => setActiveId(experience.id)}
                  onClick={() => setActiveId(experience.id)}
                  variants={sectionItem}
                >
                  <div className="journey-item-left">
                    <span className="journey-item-num">0{index + 1}</span>
                    <span className="journey-item-title">{experience.title}</span>
                  </div>
                  <span className="journey-item-arrow">↗</span>
                </motion.button>
              ))}
            </motion.div>
          </div>

          <motion.div className="journey-console" variants={sectionItem}>
            <div className="journey-console-head">
              <div className="journey-lights">
                <span></span><span></span><span></span>
              </div>
              <div className="journey-path">~/career/{activeId}.log</div>
              <div className="journey-running">RUNNING_CMD</div>
            </div>
            <div className="journey-body">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeId}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
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
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Experience;
