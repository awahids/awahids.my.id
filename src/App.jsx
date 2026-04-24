import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { TextPlugin } from 'gsap/TextPlugin';

import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Ticker from './components/Ticker';
import Experience from './components/Experience';
import Skills from './components/Skills';
import Portfolio from './components/Portfolio';
import Certificates from './components/Certificates';
import Contact from './components/Contact';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import { useSectionMotion } from './lib/sectionMotion';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, TextPlugin);

function App() {
  const [loading, setLoading] = useState(true);
  const {
    viewport: sectionViewport,
    sectionContainer,
    sectionItem,
    staggerTight,
  } = useSectionMotion();

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
          
          <main>
            <Hero />
            <Ticker />
            
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
                  Systems & <span className="s-outline">Scalability</span>
                </motion.h2>
                <motion.div className="about-text" variants={sectionItem}>
                  <p>
                    I am A Wahid Safhadi, a <strong>System Architect & Senior Backend Developer</strong> based in Indonesia.
                    I specialize in building the hidden architecture that powers modern web applications—focusing on 
                    <em> bulletproof data integrity, API performance, and technical scalability</em>.
                  </p>
                  <p style={{ marginTop: '12px' }}>
                    Currently leading high-stakes infrastructure initiatives at <strong>Rasa Group</strong>,
                    optimizing production backends to handle complex real-world operations without latency.
                  </p>
                </motion.div>
                <motion.div className="about-tags" variants={staggerTight}>
                  <motion.span className="about-tag" variants={sectionItem}>
                    Problem Solver
                  </motion.span>
                  <motion.span className="about-tag" variants={sectionItem}>
                    Team Lead
                  </motion.span>
                  <motion.span className="about-tag" variants={sectionItem}>
                    Coffee Driven
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
                    <div className="stat-b-lbl">Projects</div>
                  </motion.div>
                  <motion.div className="stat-b" variants={sectionItem}>
                    <div className="stat-b-num">5+</div>
                    <div className="stat-b-lbl">Certificates</div>
                  </motion.div>
                  <motion.div className="stat-b" variants={sectionItem}>
                    <div className="stat-b-num">100%</div>
                    <div className="stat-b-lbl">Delivery</div>
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
          </main>
          
          <Footer />
        </>
      )}
    </div>
  );
}

export default App;
