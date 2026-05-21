import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useSectionMotion } from '../lib/sectionMotion';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { useWordSplit } from '../lib/useWordSplit';
import { useGsapReveal } from '../lib/useGsapReveal';
import { useTextScramble } from '../lib/useTextScramble';

const DEFAULT_OFFERINGS = [
  {
    title: 'Web Applications',
    desc: 'Responsive interfaces with clean component structure, smooth user flows, and frontend code that stays maintainable past v1.',
  },
  {
    title: 'Admin Dashboards',
    desc: 'Internal platforms your operations team will actually use — role-based, data-rich, built around real business workflows.',
  },
  {
    title: 'Backend APIs',
    desc: 'REST APIs built for production: auth, business rules, database relationships, and third-party integrations that hold under load.',
  },
  {
    title: 'Automation & Integration',
    desc: 'Webhook-driven pipelines, scheduled jobs, and API integrations that eliminate repetitive manual work across systems.',
  },
  {
    title: 'Architecture',
    desc: 'Database schemas, service boundaries, and role models designed to stay clean and readable as the product grows.',
  },
  {
    title: 'Deployment Setup',
    desc: 'Production-ready deployment — Vercel, Docker, Nginx, VPS — repeatable, stable, and CI/CD-friendly from day one.',
  },
];

const serviceFromCmsItem = (item) => ({
  title: String(item.title || '').trim(),
  desc: String(item.summary || '').trim(),
});

const WhatIBuild = () => {
  const [offerings, setOfferings] = useState(DEFAULT_OFFERINGS);
  const gridRef = useRef(null);
  const sectionRef = useRef(null);
  const { viewport, sectionContainer, sectionItem, staggerGrid, cardPop, eyebrow } = useSectionMotion();

  useWordSplit(sectionRef);
  useGsapReveal(sectionRef);
  useTextScramble(sectionRef);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let mounted = true;

    const loadServices = async () => {
      const { data, error } = await supabase
        .from('cms_items')
        .select('id,title,summary,sort_order,is_published')
        .eq('collection', 'services')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!mounted || error || !data?.length) return;

      const nextOfferings = data
        .map(serviceFromCmsItem)
        .filter((item) => item.title && item.desc);

      if (nextOfferings.length) {
        setOfferings(nextOfferings);
      }
    };

    loadServices();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const cards = grid.querySelectorAll('.build-card');
    const cleanups = [];

    cards.forEach((card) => {
      const numEl = card.querySelector('.build-card-num');
      const onEnter = () => {
        gsap.to(card, { scale: 1.03, duration: 0.28, ease: 'power2.out', overwrite: 'auto' });
        if (numEl) gsap.to(numEl, { color: 'var(--lime)', x: 5, duration: 0.22, ease: 'power2.out', overwrite: 'auto' });
      };
      const onLeave = () => {
        gsap.to(card, { scale: 1, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });
        if (numEl) gsap.to(numEl, { color: '', x: 0, duration: 0.28, ease: 'power3.out', overwrite: 'auto' });
      };
      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mouseleave', onLeave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [offerings]);

  return (
    <section className="s-build" id="services">
      <motion.div
        ref={sectionRef}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <div className="s-build-bg-label" data-gsap-reveal="fade-up" data-gsap-delay="0.1" aria-hidden="true">BUILD</div>
        <motion.div className="s-eyebrow" variants={eyebrow}>
          // <span data-scramble="WHAT_I_BUILD">WHAT_I_BUILD</span>
        </motion.div>
        <motion.h2 className="s-title" variants={sectionItem} data-word-split>
          End-to-End Web Product Development
        </motion.h2>
        <motion.div
          className="section-lime-rule"
          variants={{
            hidden: { scaleX: 0, originX: 0 },
            visible: { scaleX: 1, originX: 0, transition: { type: 'spring', stiffness: 60, damping: 18, delay: 0.2 } },
          }}
        />
        <motion.p className="build-intro" variants={sectionItem}>
          Full-product development across every layer — from the interface users see to the backend that keeps it running in production.
        </motion.p>

        <motion.div className="build-grid" variants={staggerGrid} ref={gridRef}>
          {offerings.map((item, index) => (
            <motion.article className="build-card" key={item.title} variants={cardPop}>
              <div className="build-card-num">{`0${index + 1}`}</div>
              <h3 className="build-card-title">{item.title}</h3>
              <p className="build-card-desc">{item.desc}</p>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default WhatIBuild;
