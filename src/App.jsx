import React, { lazy, Suspense, useEffect, useState } from 'react';
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

const Portfolio = lazy(() => import('./components/Portfolio'));
const WhatIBuild = lazy(() => import('./components/WhatIBuild'));
const Skills = lazy(() => import('./components/Skills'));
const Experience = lazy(() => import('./components/Experience'));
const Certificates = lazy(() => import('./components/Certificates'));
const Contact = lazy(() => import('./components/Contact'));

const SectionFallback = () => (
  <div className="section-fallback" aria-hidden="true">
    <div className="section-fallback-line"></div>
  </div>
);

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

function App() {
  const [loading, setLoading] = useState(true);
  const {
    viewport: sectionViewport,
    sectionContainer,
    sectionItem,
    staggerTight,
  } = useSectionMotion();

  useEffect(() => {
    document.body.classList.toggle('is-preloading', loading);
    return () => document.body.classList.remove('is-preloading');
  }, [loading]);

  useEffect(() => {
    if (loading) return undefined;

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
  }, [loading]);

  return (
    <div className={`app-container ${loading ? 'is-preloading' : ''}`}>
      {loading && <Preloader onComplete={() => setLoading(false)} />}
      
      {!loading && (
        <>
          <div className="scroll-progress">
            <div className="scroll-progress-bar"></div>
          </div>
          
          <CustomCursor />
          <Navbar />
          <MobileNav />
          <SocialRail />
          
          <main>
            <Hero />
            <Ticker />

            <Suspense fallback={<SectionFallback />}>
              <WhatIBuild />
            </Suspense>
            
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
                  Backend-First, <span className="s-outline">Fullstack</span>
                </motion.h2>
                <motion.div className="about-text" variants={sectionItem}>
                  <p>
                    I&apos;m Wahid, a <strong>fullstack developer with a backend-first mindset</strong>.
                    I build complete web products from frontend interfaces to API services,
                    database architecture, integrations, and deployment.
                  </p>
                  <p style={{ marginTop: '12px' }}>
                    My strongest area is translating messy business workflows into clean, usable,
                    and scalable systems, currently applied in production at <strong>Rasa Group</strong>.
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

            <Suspense fallback={<SectionFallback />}>
              <Portfolio />
            </Suspense>
            <Suspense fallback={<SectionFallback />}>
              <Skills />
            </Suspense>
            <Suspense fallback={<SectionFallback />}>
              <Experience />
            </Suspense>
            <Suspense fallback={<SectionFallback />}>
              <Certificates />
            </Suspense>
            <Suspense fallback={<SectionFallback />}>
              <Contact />
            </Suspense>
          </main>
          
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;
