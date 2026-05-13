import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import SkillsScene from './SkillsScene';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSectionMotion } from '../lib/sectionMotion';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { useWordSplit } from '../lib/useWordSplit';
import { useParallaxBg } from '../lib/useParallaxBg';
import { useGsapReveal } from '../lib/useGsapReveal';
import { useTextScramble } from '../lib/useTextScramble';

const skillsData = [
  {
    name: 'Frontend Layer',
    prof: 'UI + Client Experience',
    num: '01',
    chips: ['React', 'Next.js', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'HTML', 'CSS', 'Vue.js'],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
    )
  },
  {
    name: 'Backend Layer',
    prof: 'API + Business Logic',
    num: '02',
    chips: ['Node.js', 'NestJS', 'ExpressJS', 'Laravel', 'Golang', 'Gin Gonic', 'TypeORM', 'Prisma'],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M20 7h-7L10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2z"/></svg>
    )
  },
  {
    name: 'Database Layer',
    prof: 'Data + Reliability',
    num: '03',
    chips: ['PostgreSQL', 'MySQL', 'MongoDB', 'Sequelize', 'Prisma ORM', 'GORM'],
    icon: (
      <svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
    )
  },
  {
    name: 'Deployment & Automation',
    prof: 'Production Operations',
    num: '04',
    chips: ['Docker', 'Vercel', 'VPS', 'Nginx', 'Cloudflare', 'n8n', 'Git', 'Postman', 'JWT'],
    icon: (
      <svg viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
    )
  }
];

const fallbackSkillIcon = (
  <svg viewBox="0 0 24 24">
    <path d="M12 2 2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const skillFromCmsItem = (item, index) => {
  const payload = item.payload || {};

  return {
    name: item.title,
    prof: item.subtitle,
    num: String(payload.num || String(index + 1).padStart(2, '0')),
    chips: Array.isArray(payload.chips) ? payload.chips : [],
    icon: fallbackSkillIcon,
  };
};

const Skills = () => {
  const rootRef = useRef(null);
  const sectionRef = rootRef; // reuse same ref for wordSplit and parallaxBg
  const [skillItems, setSkillItems] = useState(skillsData);
  const [isMobile, setIsMobile] = useState(false);
  const { viewport, sectionContainer, sectionItem, staggerGrid, eyebrow, cardPop } = useSectionMotion();

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const sync = (e) => setIsMobile(e.matches);
    sync(mq);
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useWordSplit(sectionRef);
  useParallaxBg(sectionRef);
  useGsapReveal(sectionRef);
  useTextScramble(sectionRef);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let mounted = true;

    const loadSkills = async () => {
      const { data, error } = await supabase
        .from('cms_items')
        .select('id,title,subtitle,payload,sort_order,is_published')
        .eq('collection', 'skills')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!mounted || error || !data?.length) return;
      setSkillItems(data.map(skillFromCmsItem));
    };

    loadSkills();

    return () => {
      mounted = false;
    };
  }, []);

  // GSAP hover effects — replace anime.js entirely
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (prefersReducedMotion || !hasFinePointer) return undefined;

    const cards = Array.from(root.querySelectorAll('.skill-card'));
    const cleanups = [];

    cards.forEach((card) => {
      const chips = Array.from(card.querySelectorAll('.skill-chip'));
      const icon = card.querySelector('.skill-card-icon svg');

      const onEnter = () => {
        // Lift card (GSAP overrides FM's final transform safely)
        gsap.to(card, { y: -10, duration: 0.35, ease: 'power3.out', overwrite: 'auto' });

        // Icon spin
        if (icon) {
          gsap.to(icon, { rotation: 12, scale: 1.15, duration: 0.35, ease: 'back.out(2)', overwrite: 'auto' });
        }

        // Chips stagger reveal
        if (chips.length) {
          gsap.fromTo(chips,
            { y: 6, opacity: 0.4 },
            { y: 0, opacity: 1, duration: 0.3, ease: 'power2.out', stagger: 0.025, overwrite: 'auto' }
          );
        }
      };

      const onLeave = () => {
        gsap.to(card, { y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
        if (icon) {
          gsap.to(icon, { rotation: 0, scale: 1, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
        }
      };

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mouseleave', onLeave);
      });
    });

    // Mobile: stagger reveal chips on viewport enter
    const isMobileDisplay = window.matchMedia('(max-width: 768px)').matches;
    if (isMobileDisplay) {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const chips = entry.target.querySelectorAll('.skill-chip');
            gsap.fromTo(chips,
              { y: 8, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.03, delay: 0.1 }
            );
            obs.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.2 }
      );
      cards.forEach((card) => observer.observe(card));
      cleanups.push(() => observer.disconnect());
    }

    return () => cleanups.forEach((fn) => fn());
  }, [skillItems.length]);

  // GSAP ScrollTrigger: animate skill card numbers on enter
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    const ctx = gsap.context(() => {
      const nums = Array.from(root.querySelectorAll('.skill-card-num'));
      nums.forEach((num, i) => {
        ScrollTrigger.create({
          trigger: num,
          start: 'top 88%',
          once: true,
          onEnter() {
            gsap.delayedCall(i * 0.08, () => num.classList.add('is-visible'));
          },
        });
      });
    }, root);

    return () => ctx.revert();
  }, [skillItems.length]);

  // GSAP ScrollTrigger: chip rows drift horizontally as user scrolls (alternating dirs)
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return undefined;

    const ctx = gsap.context(() => {
      const chipLists = Array.from(root.querySelectorAll('.skill-card-list'));
      chipLists.forEach((list, i) => {
        const dir = i % 2 === 0 ? -28 : 28;
        gsap.fromTo(
          list,
          { x: -dir },
          {
            x: dir,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5,
            },
          }
        );
      });
    }, root);

    return () => ctx.revert();
  }, [skillItems.length]);

  return (
    <section className="s-skills" id="skills">
      <SkillsScene isMobile={isMobile} />
      <motion.div
        ref={rootRef}
        className="skills-content"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <div className="s-skills-bg-label" data-gsap-reveal="fade-up" data-gsap-delay="0.1" aria-hidden="true">STACK</div>
        <motion.div className="s-eyebrow" variants={eyebrow}>
          // <span data-scramble="TECH_STACK_BY_LAYER">TECH_STACK_BY_LAYER</span>
        </motion.div>
        <div className="skills-copy" data-parallax="0.18">
          <motion.h2 className="skills-copy-title" variants={sectionItem} data-word-split>
            Fullstack Capability by Layer.
          </motion.h2>
          <motion.div
            className="section-lime-rule"
            variants={{
              hidden: { scaleX: 0, originX: 0 },
              visible: { scaleX: 1, originX: 0, transition: { type: 'spring', stiffness: 60, damping: 18, delay: 0.15 } },
            }}
          />
          <motion.span className="skills-copy-sub" variants={sectionItem}>
            Frontend, backend, database, deployment, and automation.
          </motion.span>
          <motion.p className="skills-copy-desc" variants={sectionItem}>
            Connected layers used to ship one working product, from UI experience and API
            architecture to data modeling, production operations, and automation workflows.
          </motion.p>
        </div>

        <motion.div
          className="skills-grid"
          variants={staggerGrid}
        >
          {skillItems.map((skill, index) => (
            <motion.div
              key={index}
              className="skill-card"
              variants={cardPop}
            >
              <div className="skill-card-icon">{skill.icon}</div>
              <div className="skill-card-num">{skill.num}</div>
              <div className="skill-card-content">
                <h3 className="skill-card-name">{skill.name}</h3>
                <div className="skill-card-prof">{skill.prof}</div>
                <div className="skill-card-list">
                  {skill.chips.map(chip => (
                    <span key={chip} className="skill-chip">{chip}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Skills;
