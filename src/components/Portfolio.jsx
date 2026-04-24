import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';
import { BOOKING_URL } from '../lib/links';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (container) =>
  Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('aria-hidden')
  );

const projects = [
  {
    id: 'arafah-group',
    title: 'Arafah Group',
    cat: 'Fullstack · Marketing Platform',
    year: '2023',
    desc: 'Built a fullstack service platform for driving-course operations with responsive pages, lead capture flow, CMS updates, and deployment pipeline.',
    problem:
      'The business needed a stronger digital funnel to explain services clearly, keep content current, and convert visitors into inbound leads.',
    built:
      'Implemented responsive marketing pages, service and pricing structure, lead capture flow, and production deployment setup for stable release cycles.',
    result:
      'Made service offerings easier to understand and gave the team a reliable workflow for publishing updates and handling incoming leads.',
    scope: ['Frontend', 'Content Workflow', 'Backend Service', 'Deployment'],
    stack: ['Next.js', 'CSS', 'JavaScript', 'HTML', 'Vercel', 'IDCloudHost'],
    live: 'https://arafah-group.com',
    case: '#',
    bento: 'bento-hero',
    num: '01'
  },
  {
    id: 'adawms',
    title: 'AdaWMS',
    cat: 'Warehouse · Fullstack System',
    year: '2024',
    desc: 'Built a warehouse management product with stock movement workflows, dashboard screens, role-based operations, API services, and production data flows.',
    problem:
      'Warehouse and online-channel stock updates were often out of sync, creating reconciliation overhead and delayed operational decisions.',
    built:
      'Delivered a fullstack warehouse system with operational dashboard, stock movement workflow, role access controls, backend APIs, and integrated storage services.',
    result:
      'Created synchronized stock visibility across workflows and reduced manual reconciliation effort for day-to-day warehouse operations.',
    scope: ['Frontend Dashboard', 'Backend API', 'Database', 'Role Access', 'Deployment'],
    stack: ['NestJS', 'MySQL', 'AWS S3', 'Postman', 'ExpressJS', 'NodeMailer', 'JWT', 'OAuth', 'Git'],
    live: 'http://adawms.com/',
    case: '#',
    bento: 'bento-feature',
    num: '02'
  },
  {
    id: 'ngaji-app',
    title: 'Belajar Ngaji',
    cat: 'Education · Fullstack Web App',
    year: '2021',
    desc: 'Developed an education web app with interactive lesson UI, media playback flow, backend services, relational data model, and production deployment.',
    problem:
      'Learners needed a simple digital flow to practice Quran reading basics without complicated navigation or fragmented lesson content.',
    built:
      'Built interactive lesson flows, media playback support, backend data services, relational schema design, and containerized deployment for the platform.',
    result:
      'Improved learning accessibility with a clearer self-study journey and a maintainable technical foundation for future lesson expansion.',
    scope: ['Frontend', 'Backend', 'Database', 'Containerization'],
    stack: ['Next.js', 'TypeScript', 'Golang', 'Tailwind CSS', 'Gorm', 'PostgreSQL', 'Vercel', 'Docker', 'Quran API'],
    live: 'https://belajar-ngaji.online/',
    case: '#',
    bento: 'bento-tall',
    num: '03'
  },
  {
    id: 'api-movie-reviews',
    title: 'API Movie Reviews',
    cat: 'Backend API · Platform Core',
    year: '2021',
    desc: 'Implemented review service APIs, data modeling, media integration, and deployment setup that powered a complete movie-rating product flow.',
    problem:
      'The product required a single backend service to handle review lifecycle, ratings, and media assets for application consumption.',
    built:
      'Designed REST endpoints, structured relational data models, integrated media upload services, and packaged deployment-ready backend infrastructure.',
    result:
      'Provided a reusable API foundation that supported product experimentation and faster frontend integration across review workflows.',
    scope: ['Backend API', 'Data Model', 'Integration', 'Deployment'],
    stack: ['ExpressJS', 'PostgreSQL', 'Heroku', 'Postman', 'Git', 'Cloudinary'],
    live: 'https://github.com/awahids/API-panas.git',
    case: '#',
    bento: 'bento-wide',
    num: '04'
  },
  {
    id: 'tokokupon',
    title: 'Tokokupon.id',
    cat: 'Marketplace · Fullstack',
    year: '2024',
    desc: 'Delivered marketplace landing and admin CMS with responsive UI, service APIs, content management workflow, and production deployment setup.',
    problem:
      'The team needed a marketplace-facing presence and admin workflow that could be updated quickly without interrupting production.',
    built:
      'Implemented responsive landing experience, CMS-oriented admin capabilities, supporting API services, and deployment flow for continuous updates.',
    result:
      'Enabled faster content rollout and clearer user acquisition flow while keeping backend operations stable for ongoing product growth.',
    scope: ['Frontend', 'Admin CMS', 'Backend API', 'Database', 'Deployment'],
    stack: ['Next.js', 'NestJS', 'Ant Design', 'MySQL', 'HTML', 'CSS'],
    live: 'https://tokokupon.com',
    case: '#',
    bento: 'bento-compact',
    num: '05'
  },
  {
    id: 'wms-rasa-group',
    title: 'WMS Rasa Group',
    cat: 'Operations · WMS',
    year: '2025',
    desc: 'Built an internal warehouse platform from zero covering operational UI, API architecture, PostgreSQL schema, and scalable deployment foundations.',
    problem:
      'Operations relied on fragmented manual processes, making warehouse execution hard to monitor, audit, and scale reliably.',
    built:
      'Developed an internal fullstack WMS from scratch with operational interfaces, backend service architecture, PostgreSQL domain modeling, and process controls.',
    result:
      'Standardized internal warehouse workflows and established a scalable platform foundation for long-term operational expansion.',
    scope: ['Operational UI', 'Backend API', 'PostgreSQL', 'Business Workflow'],
    stack: ['NestJS', 'Prisma ORM', 'Vue.js', 'PostgreSQL'],
    live: '#',
    case: '#',
    bento: 'bento-core',
    num: '06'
  },
  {
    id: 'qala-temu',
    title: 'Qala Temu',
    cat: 'Appointment · Platform',
    year: '2025',
    desc: 'Built a fullstack appointment platform with booking UX, admin dashboard, authentication, API services, relational database modeling, and Docker deployment.',
    problem:
      'Booking and scheduling workflows needed a streamlined digital flow for both end users and internal operators.',
    built:
      'Implemented customer booking experience, admin dashboard, auth and role flows, NestJS API services, relational schema, and Dockerized deployment.',
    result:
      'Delivered a production-ready appointment platform that improved scheduling flow clarity and reduced operational friction.',
    scope: ['Frontend Experience', 'Admin Dashboard', 'Auth', 'Backend API', 'Deployment'],
    stack: ['Docker', 'React', 'NestJS', 'Prisma', 'PostgreSQL'],
    live: 'https://janji.online',
    case: '#',
    bento: 'bento-accent',
    num: '07'
  }
];

const Portfolio = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusedRef = useRef(null);
  const { viewport, sectionContainer, sectionItem, staggerGrid, ease, reduceMotion } =
    useSectionMotion();

  const openModal = useCallback((project) => {
    setSelectedProject(project);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedProject(null);
  }, []);

  useEffect(() => {
    if (!selectedProject) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    previousFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusHandle = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleModalKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
        return;
      }

      if (event.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = getFocusableElements(modal);
      if (!focusableElements.length) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const currentFocused = document.activeElement;

      if (event.shiftKey && currentFocused === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && currentFocused === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleModalKeyDown);

    return () => {
      window.cancelAnimationFrame(focusHandle);
      document.removeEventListener('keydown', handleModalKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusedRef.current?.focus?.();
    };
  }, [selectedProject, closeModal]);

  const handleCardKeyDown = (event, project) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal(project);
    }
  };

  return (
    <section className="s-portfolio" id="portfolio">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="s-eyebrow" variants={sectionItem}>
          // SELECTED_WORK
        </motion.div>
        <motion.h2 className="s-title" variants={sectionItem}>
          Selected <span className="s-outline">Fullstack Projects</span>
        </motion.h2>
        <motion.p className="port-intro" variants={sectionItem} style={{ color: 'rgba(255,255,255,0.4)', marginTop: '12px', fontSize: '14px', maxWidth: '600px' }}>
          Selected fullstack projects where I worked across frontend, backend,
          database, integration, and deployment.
        </motion.p>

        <motion.div
          className="port-grid"
          variants={staggerGrid}
        >
          {projects.map((p) => (
            <motion.div
              key={p.id}
              className={`port-card ${p.bento}`}
              onClick={() => openModal(p)}
              onKeyDown={(event) => handleCardKeyDown(event, p)}
              role="button"
              tabIndex="0"
              aria-haspopup="dialog"
              aria-label={`Open project details for ${p.title}`}
              variants={sectionItem}
            >
              <div className="port-card-num">{p.num}</div>
              {p.year && <div className="port-year">{p.year}</div>}
              {p.cat && <div className="port-cat">{p.cat}</div>}
              <h3 className="port-name">{p.title}</h3>
              <p className="port-desc">{p.desc}</p>
              <div className="port-stack">
                {p.scope.map(s => (
                  <span key={s} className="port-tag">{s}</span>
                ))}
              </div>
              <span className="port-link" aria-hidden="true">Open Case ↗</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            className="modal-overlay active"
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.28, ease }}
          >
            <motion.div
              className="modal-card"
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`project-modal-title-${selectedProject.id}`}
              tabIndex="-1"
              onClick={e => e.stopPropagation()}
              initial={reduceMotion ? { opacity: 1 } : { scale: 0.9, y: 20 }}
              animate={reduceMotion ? { opacity: 1 } : { scale: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 1 } : { scale: 0.9, y: 20 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : { type: 'spring', damping: 25, stiffness: 300 }
              }
            >
              <button ref={closeButtonRef} className="modal-close" onClick={closeModal} aria-label="Close project details">✕</button>
              <div className="modal-header">
                {selectedProject.cat && (
                  <div className="mh-cat">{selectedProject.cat}</div>
                )}
                <h2 id={`project-modal-title-${selectedProject.id}`} className="mh-title">{selectedProject.title}</h2>
                {selectedProject.year && (
                  <div className="mh-year">Release: {selectedProject.year}</div>
                )}
              </div>
              <div className="modal-content">
                <div className="m-case-sections">
                  <article className="m-case-block">
                    <div className="m-case-lbl">Overview</div>
                    <p className="m-body-text">{selectedProject.desc}</p>
                  </article>
                  <article className="m-case-block">
                    <div className="m-case-lbl">Problem</div>
                    <p className="m-body-text">{selectedProject.problem}</p>
                  </article>
                  <article className="m-case-block">
                    <div className="m-case-lbl">What I Built</div>
                    <p className="m-body-text">{selectedProject.built}</p>
                  </article>
                  <article className="m-case-block">
                    <div className="m-case-lbl">Result</div>
                    <p className="m-body-text">{selectedProject.result}</p>
                  </article>
                </div>
                <div className="modal-sidebar">
                  <div className="m-sidebar-section">
                    <div className="m-ss-lbl">Fullstack Scope</div>
                    <div className="m-ss-tags">
                      {selectedProject.scope.map((scope) => (
                        <span key={scope} className="m-ss-tag">{scope}</span>
                      ))}
                    </div>
                  </div>
                  <div className="m-sidebar-section">
                    <div className="m-ss-lbl">Tech Stack</div>
                    <div className="m-ss-tags">
                      {selectedProject.stack.map(s => (
                        <span key={s} className="m-ss-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="m-actions">
                    <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn ghost">Discuss Similar Project ↗</a>
                    {selectedProject.live !== '#' && (
                      <a href={selectedProject.live} target="_blank" rel="noopener noreferrer" className="m-btn prime">Live Product ↗</a>
                    )}
                    {selectedProject.case !== '#' && (
                      <a href={selectedProject.case} target="_blank" rel="noopener noreferrer" className="m-btn ghost">Case Study ↗</a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Portfolio;
