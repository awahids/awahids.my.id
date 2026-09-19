import React, { Suspense, lazy, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { useLenis } from './lib/useLenis';

import Preloader from './components/Preloader';
import Navbar from './components/Navbar';
import MobileNav from './components/MobileNav';
import Hero from './components/Hero';
import Ticker from './components/Ticker';
import Footer from './components/Footer';
import CustomCursor from './components/CustomCursor';
import SpotlightGlow from './components/SpotlightGlow';
import SocialRail from './components/SocialRail';
import { useSectionMotion } from './lib/sectionMotion';
import { useGsapReveal } from './lib/useGsapReveal';
import Portfolio from './components/Portfolio';
import WhatIBuild from './components/WhatIBuild';
import Skills from './components/Skills';
import Experience from './components/Experience';
import Certificates from './components/Certificates';
import Contact from './components/Contact';
import FloatingFAQ from './components/FloatingFAQ';
import CvDownloadModal from './components/CvDownloadModal';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
import { AnomalousMatterHero } from './components/AnomalousHero';
import {
  isAiLabRoute,
  isNotFoundRoute,
  isPrdGeneratorRoute,
  isReadmeGeneratorRoute,
  prdSlugFromPath,
} from './lib/routes';
const AILab = lazy(() => import('./components/AILab'));
const ReadmeGenerator = lazy(() => import('./components/ReadmeGenerator'));
const PrdGenerator = lazy(() => import('./components/PrdGenerator'));
const PrdPermalink = lazy(() => import('./components/PrdPermalink'));

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

const ABOUT = {
  eyebrow: 'BIOGRAPHY',
  title: 'Backend-first. Fullstack when it matters.',
  paragraphs: [
    'I build complete web products, but my strongest layer is what lives behind the screen: APIs, database design, business logic, automation, and the deployment that makes it real.',
    'Good UIs matter. But the system behind them matters more — reliable workflows, clean data models, and backend logic that survives real users. That is the standard I apply in production every day at Rasa Group.',
  ],
  tags: ['Frontend to Deployment', 'Product-Oriented', 'Backend-First Strength'],
  stats: [
    { value: '4+', label: 'Years Exp.' },
    { value: '20+', label: 'Projects Shipped' },
    { value: '5+', label: 'Core Domains' },
    { value: '100%', label: 'End-to-End Ownership' },
  ],
  education: {
    school: 'Mataram University',
    degree: 'Bachelor in Engineering Informatics',
    period: 'Aug 2014 — Feb 2022',
  },
};

const getAboutTitleParts = (title = '') => {
  const [lead, ...rest] = String(title || '').split('. ');
  const outline = rest.join('. ');

  return {
    lead: outline ? `${lead}.` : lead,
    outline,
  };
};

const DEFAULT_SITE_SETTINGS = {
  siteTitle: 'A Wahid Safhadi — Fullstack Developer with Backend-First Strength',
  seoDescription:
    'Fullstack developer building web apps, dashboards, APIs, automation, and scalable business systems from frontend to deployment.',
  ogImage: '/img/aw-pixel.png',
};

const AI_LAB_SETTINGS = {
  siteTitle: 'AI Lab — Architecture Brief Generator | A Wahid Safhadi',
  seoDescription:
    'Generate a technical architecture brief for your web product. A free AI-powered planning tool by fullstack developer A Wahid Safhadi.',
  ogImage: '/img/aw-pixel.png',
};

const README_GENERATOR_SETTINGS = {
  siteTitle: 'GitHub README Generator | A Wahid Safhadi',
  seoDescription:
    'Generate a GitHub profile README with self-hosted stats, streak, top-languages, activity graph, typing animation and skill icon cards.',
  ogImage: '/img/aw-pixel.png',
};

const PRD_GENERATOR_SETTINGS = {
  siteTitle: 'PRD Generator | A Wahid Safhadi',
  seoDescription:
    'Turn a short system description into a structured PRD with user flow, architecture and ERD diagrams.',
  ogImage: DEFAULT_SITE_SETTINGS.ogImage,
};

const NOT_FOUND_SETTINGS = {
  siteTitle: '404 — Page Not Found | A Wahid Safhadi',
  seoDescription: 'The requested page could not be found on A Wahid Safhadi portfolio.',
  ogImage: DEFAULT_SITE_SETTINGS.ogImage,
};

const getAbsoluteUrl = (value) => {
  if (typeof window === 'undefined') return value;

  try {
    return new URL(value, window.location.origin).toString();
  } catch {
    return value;
  }
};

const setMetaContent = ({ selector, attribute, value }) => {
  if (typeof document === 'undefined' || !value) return;

  const element = document.head.querySelector(selector);
  element?.setAttribute(attribute, value);
};

const applySiteSettings = (settings) => {
  if (typeof document === 'undefined') return;

  const title = settings.siteTitle || DEFAULT_SITE_SETTINGS.siteTitle;
  const description = settings.seoDescription || DEFAULT_SITE_SETTINGS.seoDescription;
  const ogImage = getAbsoluteUrl(settings.ogImage || DEFAULT_SITE_SETTINGS.ogImage);

  document.title = title;

  [
    ['meta[name="title"]', 'content', title],
    ['meta[name="description"]', 'content', description],
    ['meta[property="og:site_name"]', 'content', title],
    ['meta[property="og:title"]', 'content', title],
    ['meta[property="og:description"]', 'content', description],
    ['meta[property="og:image"]', 'content', ogImage],
    ['meta[name="twitter:title"]', 'content', title],
    ['meta[name="twitter:description"]', 'content', description],
    ['meta[name="twitter:image"]', 'content', ogImage],
  ].forEach(([selector, attribute, value]) => {
    setMetaContent({ selector, attribute, value });
  });
};

const NotFoundPage = () => (
  <section className="s-not-found" aria-labelledby="not-found-title">
    <div className="not-found-bg" aria-hidden="true">404</div>
    <motion.div
      className="not-found-inner"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      <p className="s-eyebrow">// PAGE_NOT_FOUND</p>
      <h1 id="not-found-title">This route does not exist.</h1>
      <p>
        The page may have moved, or the URL may be incorrect. Head back to the portfolio
        or jump straight into the selected project work.
      </p>
      <div className="not-found-actions">
        <a className="not-found-primary" href="/">Back Home</a>
        <a className="not-found-secondary" href="/#portfolio">View Projects</a>
      </div>
    </motion.div>
  </section>
);

function App() {
  const [currentPathname, setCurrentPathname] = useState(() =>
    typeof window !== 'undefined' ? window.location.pathname : ''
  );
  const aiLabPage = isAiLabRoute(currentPathname);
  const readmeGeneratorPage = isReadmeGeneratorRoute(currentPathname);
  const prdGeneratorPage = isPrdGeneratorRoute(currentPathname);
  const prdSlug = prdSlugFromPath(currentPathname);
  const prdPage = prdGeneratorPage || prdSlug !== '';
  // Standalone tool pages skip the preloader, smooth scroll and homepage chrome.
  const toolPage = readmeGeneratorPage || prdPage;
  const notFoundPage = isNotFoundRoute(currentPathname);
  const [loading, setLoading] = useState(
    () => !toolPage && !notFoundPage && !shouldBypassPreloader()
  );
  const effectiveLoading = toolPage || notFoundPage ? false : loading;
  const {
    viewport: sectionViewport,
    sectionContainer,
    sectionItem,
    staggerTight,
    eyebrow: sectionEyebrow,
    clipReveal: sectionClipReveal,
    cardPop: sectionCardPop,
  } = useSectionMotion();
  const about = ABOUT;
  const aboutTitle = getAboutTitleParts(about.title);

  const lenisEnabled = !effectiveLoading && !toolPage && !notFoundPage;
  const lenisRef = useLenis({ enabled: lenisEnabled });

  const aboutSectionRef = React.useRef(null);
  useGsapReveal(aboutSectionRef);

  const aboutReduceMotion = useReducedMotion();
  const { scrollYProgress: aboutScrollProgress } = useScroll({
    target: aboutSectionRef,
    offset: ['start end', 'end start'],
  });
  const aboutBgScale = useTransform(
    aboutScrollProgress,
    [0, 1],
    aboutReduceMotion ? [1, 1] : [0.7, 1.35]
  );

  // Stat counter animation
  useEffect(() => {
    if (effectiveLoading) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const statEls = document.querySelectorAll('.stat-b-num');
      statEls.forEach((el) => {
        const raw = el.textContent.trim();
        const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
        const suffix = raw.replace(/[0-9.]/g, '');
        if (isNaN(num)) return;

        if (prefersReducedMotion) return;

        const proxy = { val: 0 };
        gsap.to(proxy, {
          val: num,
          duration: 1.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate() {
            const display = Number.isInteger(num)
              ? Math.round(proxy.val)
              : proxy.val.toFixed(1);
            el.textContent = `${display}${suffix}`;
          },
        });
      });
    });

    return () => ctx.revert();
  }, [effectiveLoading]);

  useEffect(() => {
    applySiteSettings(
      notFoundPage
        ? NOT_FOUND_SETTINGS
        : aiLabPage
          ? AI_LAB_SETTINGS
          : readmeGeneratorPage
            ? README_GENERATOR_SETTINGS
            : prdPage
              ? PRD_GENERATOR_SETTINGS
              : DEFAULT_SITE_SETTINGS
    );
  }, [notFoundPage, aiLabPage, readmeGeneratorPage, prdPage]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncPathname = () => {
      setCurrentPathname(window.location.pathname);
    };

    window.addEventListener('popstate', syncPathname);
    return () => window.removeEventListener('popstate', syncPathname);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('is-preloading', effectiveLoading);
    return () => document.body.classList.remove('is-preloading');
  }, [effectiveLoading]);

  useEffect(() => {
    const active = !effectiveLoading && !toolPage && !notFoundPage;
    document.body.classList.toggle('is-gsap-motion', active);
    return () => document.body.classList.remove('is-gsap-motion');
  }, [effectiveLoading, toolPage, notFoundPage]);

  useEffect(() => {
    if (!effectiveLoading) {
      const id = window.setTimeout(() => ScrollTrigger.refresh(), 300);
      return () => window.clearTimeout(id);
    }
  }, [effectiveLoading]);

  useEffect(() => {
    if (effectiveLoading || toolPage || notFoundPage) return undefined;

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

      // Scroll via Lenis when active, fallback to GSAP scrollTo
      if (lenisRef.current) {
        lenisRef.current.scrollTo(target, {
          offset: -offsetY,
          duration: 1.2,
          easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        gsap.to(window, {
          duration: 1.2,
          scrollTo: { y: target, offsetY, autoKill: false },
          ease: 'power4.inOut',
          overwrite: 'auto',
        });
      }
    };

    document.addEventListener('click', handleAnchorScroll);

    return () => {
      document.removeEventListener('click', handleAnchorScroll);
      floatingTopTrigger?.kill();
      progressTween.scrollTrigger?.kill();
      progressTween.kill();
    };
  }, [toolPage, effectiveLoading, lenisRef, notFoundPage]);

  return (
    <div className={`app-container ${effectiveLoading ? 'is-preloading' : ''}`}>
      {effectiveLoading && <Preloader onComplete={() => setLoading(false)} />}

      <div className="scroll-progress">
        <div className="scroll-progress-bar"></div>
      </div>

      <CustomCursor />
      {!aiLabPage && !toolPage && !notFoundPage && <SpotlightGlow />}
      {!readmeGeneratorPage && (
        <Navbar isAiLabPage={aiLabPage} isNotFoundPage={notFoundPage || prdPage} />
      )}
      {!aiLabPage && !toolPage && !notFoundPage && <MobileNav />}
      {!aiLabPage && !toolPage && !notFoundPage && <SocialRail />}

      <main
        className={
          aiLabPage
            ? 'main-ai-lab-page'
            : readmeGeneratorPage
              ? 'main-readme-generator-page'
              : prdGeneratorPage
                ? 'main-prd-generator-page'
                : notFoundPage
                ? 'main-not-found-page'
                : ''
        }
      >
        {aiLabPage ? (
          <>
            <AnomalousMatterHero />
            <Suspense fallback={<section className="s-ai-lab" id="ai-lab" />}>
              <AILab />
            </Suspense>
          </>
        ) : readmeGeneratorPage ? (
          <Suspense fallback={<section className="s-readme-generator" />}>
            <ReadmeGenerator />
          </Suspense>
        ) : prdGeneratorPage ? (
          <Suspense fallback={<section className="s-prd-generator" />}>
            <PrdGenerator />
          </Suspense>
        ) : prdSlug ? (
          <Suspense fallback={<section className="s-prd-generator" />}>
            <PrdPermalink slug={prdSlug} />
          </Suspense>
        ) : notFoundPage ? (
          <NotFoundPage />
        ) : (
          <>
            <Hero />
            <Ticker />

            <WhatIBuild />

            <motion.section
              id="about"
              className="s-about"
              ref={aboutSectionRef}
              initial="hidden"
              whileInView="visible"
              viewport={sectionViewport}
              variants={sectionContainer}
            >
              <motion.div
                className="about-bg"
                data-gsap-reveal="fade-up"
                data-gsap-delay="0.1"
                style={{ scale: aboutBgScale }}
                aria-hidden="true"
              >
                A.W.S
              </motion.div>
              <motion.div className="about-left" variants={sectionItem}>
                <motion.div className="s-eyebrow" variants={sectionEyebrow}>
                  // {about.eyebrow.toUpperCase()}
                </motion.div>
                <motion.h2 className="s-title" variants={sectionClipReveal}>
                  {aboutTitle.lead}{' '}
                  {aboutTitle.outline && <span className="s-outline">{aboutTitle.outline}</span>}
                </motion.h2>
                <motion.div className="about-text" variants={sectionItem}>
                  {about.paragraphs.map((paragraph, index) => (
                    <p key={`${index}-${paragraph}`} style={index > 0 ? { marginTop: '12px' } : undefined}>
                      {paragraph}
                    </p>
                  ))}
                </motion.div>
                <motion.div className="about-tags" variants={staggerTight}>
                  {about.tags.map((tag) => (
                    <motion.span key={tag} className="about-tag" variants={sectionItem}>
                      {tag}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>
              <motion.div className="about-right" variants={sectionItem}>
                <motion.div className="stats-2x2" variants={staggerTight}>
                  {about.stats.map((stat) => (
                    <motion.div key={`${stat.value}-${stat.label}`} className="stat-b" variants={sectionCardPop}>
                      <div className="stat-b-num">{stat.value}</div>
                      <div className="stat-b-lbl">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
                <motion.div className="edu-entry" variants={sectionItem}>
                  <div className="edu-school">{about.education.school}</div>
                  <div className="edu-degree">{about.education.degree}</div>
                  <div className="edu-year">{about.education.period}</div>
                </motion.div>
              </motion.div>
            </motion.section>

            <Portfolio />
            <Skills lenisRef={lenisRef} />
            <Experience />
            <Certificates />
            <Contact />
          </>
        )}
      </main>

      {!toolPage && !notFoundPage && <Footer isAiLabPage={aiLabPage} />}
      {!toolPage && !notFoundPage && <FloatingFAQ />}
      {!toolPage && !notFoundPage && <CvDownloadModal />}
    </div>
  );
}

export default App;
