import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_EXPERIENCES, normalizeExperience } from '../lib/experienceData';
import { useSectionMotion } from '../lib/sectionMotion';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const EXPERIENCE_SELECT = 'id,title,role,blurb,tag,glyph,sort_order,is_published';

const Experience = () => {
  const [experiences, setExperiences] = useState(DEFAULT_EXPERIENCES);
  const [activeId, setActiveId] = useState(DEFAULT_EXPERIENCES[0]?.id || '');
  const { viewport, sectionContainer, sectionItem, staggerTight } =
    useSectionMotion();
  const activeExperience = useMemo(
    () =>
      experiences.find((experience) => experience.id === activeId) ||
      experiences[0],
    [activeId, experiences]
  );

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
      setActiveId((currentId) =>
        nextExperiences.some((experience) => experience.id === currentId)
          ? currentId
          : nextExperiences[0].id
      );
    };

    loadExperiences();

    return () => {
      mounted = false;
    };
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
        <motion.div className="s-eyebrow" variants={sectionItem}>
          // CAREER_LOG
        </motion.div>
        <motion.div className="journey-head" variants={sectionItem}>
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
          <motion.div className="journey-nav" variants={staggerTight}>
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
                  <div className="journey-glyph">{activeExperience.glyph}</div>
                  <div>
                    <div className="journey-role">// role</div>
                    <h3 className="journey-company">{activeExperience.title}</h3>
                  </div>
                  <div>
                    <p className="journey-quote">"{activeExperience.blurb}"</p>
                    <div className="journey-tag-wrap">
                      <span className="journey-tag">{activeExperience.tag}</span>
                    </div>
                    <div className="journey-command"><b>$</b> cat ./{activeId}.md<span className="journey-cursor">▌</span></div>
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
