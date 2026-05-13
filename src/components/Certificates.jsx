import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useSectionMotion } from '../lib/sectionMotion';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { useTextScramble } from '../lib/useTextScramble';
import { useGsapReveal } from '../lib/useGsapReveal';

const certs = [
  {
    issuer: 'GLINTS X BINAR',
    name: 'Backend Developer, Learn to make API using JavaScript (Node.js) and ExpressJS framework for 3 months',
    year: 'Dec 2021'
  },
  {
    issuer: 'ORACLE ACADEMY',
    name: 'Pemroggraming Database with SQL',
    year: 'Sep 2021'
  },
  {
    issuer: 'ORACLE ACADEMY',
    name: 'Design Database',
    year: 'Aug 2021'
  },
  {
    issuer: 'PROGATE',
    name: 'Javascript Course',
    year: 'Jul 2021'
  },
  {
    issuer: 'PROGATE',
    name: 'Sass Course',
    year: 'Jul 2021'
  }
];

const certFromCmsItem = (item) => ({
  issuer: item.subtitle,
  name: item.title,
  year: item.summary,
  url: item.payload?.url || '',
});

const Certificates = () => {
  const [certItems, setCertItems] = useState(certs);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllMobile, setShowAllMobile] = useState(false);
  const gridRef = useRef(null);
  const sectionRef = useRef(null);
  const { viewport, sectionContainer, sectionItem, staggerGrid, eyebrow, cardPop } = useSectionMotion();

  useTextScramble(sectionRef);
  useGsapReveal(sectionRef);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;
    let mounted = true;
    const loadCertificates = async () => {
      const { data, error } = await supabase
        .from('cms_items')
        .select('id,title,subtitle,summary,payload,sort_order,is_published')
        .eq('collection', 'certificates')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (!mounted || error || !data?.length) return;
      setCertItems(data.map(certFromCmsItem));
    };
    loadCertificates();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 720px)');
    const syncViewport = (event) => {
      const nextIsMobile = Boolean(event.matches);
      setIsMobile((prevIsMobile) => {
        if (prevIsMobile !== nextIsMobile) setShowAllMobile(!nextIsMobile);
        return nextIsMobile;
      });
    };
    syncViewport(mediaQuery);
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', syncViewport);
    } else {
      mediaQuery.addListener(syncViewport);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', syncViewport);
      } else {
        mediaQuery.removeListener(syncViewport);
      }
    };
  }, []);

  // GSAP hover: lift + icon spin (avoids CSS transform conflict with FM)
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (prefersReducedMotion || !hasFinePointer) return undefined;

    const cards = Array.from(grid.querySelectorAll('.cert-card'));
    const cleanups = [];

    cards.forEach((card) => {
      const icon = card.querySelector('.cert-icon');

      const onEnter = () => {
        gsap.to(card, { y: -10, scale: 1.025, duration: 0.32, ease: 'power3.out', overwrite: 'auto' });
        if (icon) gsap.to(icon, { rotation: 12, scale: 1.12, duration: 0.32, ease: 'back.out(2)', overwrite: 'auto' });
      };
      const onLeave = () => {
        gsap.to(card, { y: 0, scale: 1, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
        if (icon) gsap.to(icon, { rotation: 0, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
      };

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mouseleave', onLeave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [certItems.length, isMobile]);

  const visibleCerts = isMobile && !showAllMobile ? certItems.slice(0, 3) : certItems;

  return (
    <section className="s-cert" id="certificates">
      <motion.div
        ref={sectionRef}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="s-eyebrow" variants={eyebrow}>
          // <span data-scramble="RECOGNITIONS">RECOGNITIONS</span>
        </motion.div>
        <motion.h2 className="s-title" variants={sectionItem}>
          Licenses & <span className="s-outline">Certificates</span>
        </motion.h2>
        <motion.div
          className="section-lime-rule"
          variants={{
            hidden: { scaleX: 0, originX: 0 },
            visible: { scaleX: 1, originX: 0, transition: { type: 'spring', stiffness: 60, damping: 18, delay: 0.2 } },
          }}
        />
        <motion.p className="cert-intro" variants={sectionItem}>
          Supporting credentials across backend development, database systems,
          JavaScript, and cloud fundamentals.
        </motion.p>

        <motion.div className="cert-grid" ref={gridRef} variants={staggerGrid}>
          {visibleCerts.map((c, i) => (
            <motion.div
              key={i}
              className="cert-card"
              variants={cardPop}
              initial={false}
            >
              <div className="cert-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 15l-2 5 2 2 2-2-2-5z" />
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <circle cx="12" cy="11" r="4" />
                </svg>
              </div>
              <div className="cert-issuer">{c.issuer}</div>
              <div className="cert-year">{c.year}</div>
              <h3 className="cert-name">{c.name}</h3>
              <div className="cert-card-view">
                <span>View Details</span> ↗
              </div>
            </motion.div>
          ))}
        </motion.div>

        {isMobile && certItems.length > 3 && (
          <motion.button
            type="button"
            className="cert-mobile-toggle"
            onClick={() => setShowAllMobile((prev) => !prev)}
            variants={sectionItem}
          >
            {showAllMobile ? 'Show Less' : `View More (${certItems.length - 3})`}
          </motion.button>
        )}
      </motion.div>
    </section>
  );
};

export default Certificates;
