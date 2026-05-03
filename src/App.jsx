import React, { Suspense, lazy, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Hero from './components/Hero';
import Ticker from './components/Ticker';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import SocialRail from './components/SocialRail';
import { useSectionMotion } from './lib/sectionMotion';
import Portfolio from './components/Portfolio';
import WhatIBuild from './components/WhatIBuild';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Certificates from './components/Certificates';
import Contact from './components/Contact';
import FloatingFAQ from './components/FloatingFAQ';
import AdminExperience from './components/AdminExperience';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
import { AnomalousMatterHero } from './components/AnomalousHero';
const AI_LAB_PATH = '/ai-lab';
const ADMIN_PATH_PREFIX = '/admin';
const AILab = lazy(() => import('./components/AILab'));

const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|crawling|facebookexternalhit|slackbot|twitterbot|linkedinbot|discordbot|whatsapp|google-inspectiontool|lighthouse/i;

const shouldBypassPreloader = () => {
  if (typeof window === 'undefined') return false;

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const userAgent = window.navigator?.userAgent || '';
  const botLikeAgent = BOT_USER_AGENT_PATTERN.test(userAgent);

  return prefersReducedMotion || botLikeAgent;
};

const normalizePathname = (pathname = '') => {
  const normalized = pathname.replace(/\/+$/, '');
  return normalized || '/';
};

const isAiLabRoute = (pathname = '') =>
  normalizePathname(pathname) === AI_LAB_PATH;

const isAdminRoute = (pathname = '') => {
  const normalized = normalizePathname(pathname);
  return normalized === ADMIN_PATH_PREFIX || normalized.startsWith(`${ADMIN_PATH_PREFIX}/`);
};

function App() {
  const [currentPathname, setCurrentPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : ''
  );
  const aiLabPage = isAiLabRoute(currentPathname);
  const adminPage = isAdminRoute(currentPathname);
  const [loading, setLoading] = useState(
    () => !isAdminRoute(currentPathname) && !shouldBypassPreloader()
  );
  const effectiveLoading = adminPage ? false : loading;
  const {
    viewport: sectionViewport,
    sectionContainer,
    sectionItem,
    staggerTight,
  } = useSectionMotion();

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncPathname = () => {
      setCurrentPathname(window.location.pathname);
    };

    window.addEventListener('popstate', syncPathname);
    return () => window.removeEventListener('popstate', syncPathname);
  }, []);

  const navigateAdmin = (path) => {
    if (typeof window === 'undefined') return;

    const nextPath = path || '/admin/experience';
    if (window.location.pathname !== nextPath) {
      window.history.pushState(null, '', nextPath);
    }

    setCurrentPathname(nextPath);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    document.body.classList.toggle('is-preloading', effectiveLoading);
    return () => document.body.classList.remove('is-preloading');
  }, [effectiveLoading]);

  useEffect(() => {
    if (effectiveLoading || adminPage) return undefined;

    const progressTween = gsap.to('.scroll-progress-bar', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.body,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    });

    const floatingTopBtn = document.querySelector('.floating-top-btn');
    const floatingTopTrigger = floatingTopBtn
      ? ScrollTrigger.create({
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            floatingTopBtn.classList.toggle('is-visible', self.scroll() > 420);
          },
        })
      : null;

    const handleAnchorScroll = (event) => {
      const link = event.target.closest('a[href^="#"], [data-scroll-target]');
      if (!link) return;

      const selector = link.getAttribute('data-scroll-target') || link.getAttribute('href');
      if (!selector || selector === '#') return;

      const target = document.querySelector(selector);
      if (!target) return;

      event.preventDefault();

      const nav = document.querySelector('nav');
      const offsetY = selector === '#home' ? 0 : (nav?.offsetHeight || 0) + 12;

      // Update URL hash without jumping
      window.history.pushState(null, null, selector);

      // Scroll with GSAP
      gsap.to(window, {
        duration: 1.2,
        scrollTo: { y: target, offsetY, autoKill: false },
        ease: 'power4.inOut',
        overwrite: 'auto'
      });
    };

    document.addEventListener('click', handleAnchorScroll);

    return () => {
      document.removeEventListener('click', handleAnchorScroll);
      floatingTopTrigger?.kill();
      progressTween.scrollTrigger?.kill();
      progressTween.kill();
    };
  }, [adminPage, effectiveLoading]);

  return (
    <div className={`app-container ${effectiveLoading ? 'is-preloading' : ''}`}>
      {effectiveLoading && <Preloader onComplete={() => setLoading(false)} />}

      <div className="scroll-progress">
        <div className="scroll-progress-bar"></div>
      </div>

      <CustomCursor />
      {!adminPage && <Navbar isAiLabPage={aiLabPage} />}
      {!aiLabPage && !adminPage && <MobileNav />}
      {!aiLabPage && !adminPage && <SocialRail />}

      <main className={aiLabPage ? 'main-ai-lab-page' : ''}>
        {adminPage ? (
          <AdminExperience routePath={currentPathname} onNavigate={navigateAdmin} />
        ) : aiLabPage ? (
          <>
            <AnomalousMatterHero />
            <Suspense fallback={<section className="s-ai-lab" id="ai-lab" />}>
              <AILab />
            </Suspense>
          </>
        ) : (
          <>
            <Hero />
            <Ticker />

            <WhatIBuild />

            <motion.section
              id="about"
              className="s-about"
              initial="hidden"
              whileInView="visible"
              viewport={sectionViewport}
              variants={sectionContainer}
            >
              <div className="about-bg">A.W.S</div>
              <motion.div className="about-left" variants={sectionItem}>
                <motion.div className="s-eyebrow" variants={sectionItem}>
                  // BIOGRAPHY
                </motion.div>
                <motion.h2 className="s-title" variants={sectionItem}>
                  Backend-first. <span className="s-outline">Fullstack when it matters.</span>
                </motion.h2>
                <motion.div className="about-text" variants={sectionItem}>
                  <p>
                    I build complete web products, but my strongest layer is the system behind the screen:
                    <strong> APIs, database design, business logic, automation, and deployment</strong>.
                  </p>
                  <p style={{ marginTop: '12px' }}>
                    Good interfaces matter. Business systems still need reliable workflows,
                    clean data, and backend logic that survives real users. That is the approach
                    I apply in production at <strong>Rasa Group</strong>.
                  </p>
                </motion.div>
                <motion.div className="about-tags" variants={staggerTight}>
                  <motion.span className="about-tag" variants={sectionItem}>
                    Frontend to Deployment
                  </motion.span>
                  <motion.span className="about-tag" variants={sectionItem}>
                    Product-Oriented
                  </motion.span>
                  <motion.span className="about-tag" variants={sectionItem}>
                    Backend-First Strength
                  </motion.span>
                </motion.div>
              </motion.div>
              <motion.div className="about-right" variants={sectionItem}>
                <motion.div className="stats-2x2" variants={staggerTight}>
                  <motion.div className="stat-b" variants={sectionItem}>
                    <div className="stat-b-num">4+</div>
                    <div className="stat-b-lbl">Years Exp.</div>
                  </motion.div>
                  <motion.div className="stat-b" variants={sectionItem}>
                    <div className="stat-b-num">20+</div>
                    <div className="stat-b-lbl">Products Built</div>
                  </motion.div>
                  <motion.div className="stat-b" variants={sectionItem}>
                    <div className="stat-b-num">5+</div>
                    <div className="stat-b-lbl">Core Domains</div>
                  </motion.div>
                  <motion.div className="stat-b" variants={sectionItem}>
                    <div className="stat-b-num">100%</div>
                    <div className="stat-b-lbl">Project Ownership</div>
                  </motion.div>
                </motion.div>
                <motion.div className="edu-entry" variants={sectionItem}>
                  <div className="edu-school">Mataram University</div>
                  <div className="edu-degree">Bachelor in Engineering Informatics</div>
                  <div className="edu-year">Aug 2014 — Feb 2022</div>
                </motion.div>
              </motion.div>
            </motion.section>

            <Portfolio />
            <Skills />
            <Experience />
            <Certificates />
            <Contact />
          </>
        )}
      </main>

      {!adminPage && <Footer isAiLabPage={aiLabPage} />}
      {!adminPage && <FloatingFAQ />}
    </div>
  );
}

export default App;
