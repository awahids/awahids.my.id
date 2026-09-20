import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';
import { BOOKING_URL } from '../lib/links';
import { useWordSplit } from '../lib/useWordSplit';
import { useTextScramble } from '../lib/useTextScramble';
import { useGsapReveal } from '../lib/useGsapReveal';
import { modalCardVariants, modalChildVariants, modalOverlayMotion } from '../lib/modalMotion';
import ProjectCoverflow from './ProjectCoverflow';

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
    cat: 'Fullstack · Service Platform',
    year: '2023',
    desc: 'Built a fullstack service platform for driving-course operations with conversion-focused pages, lead capture handling, content workflow, and stable production deployment.',
    problem: 
      'Arafah Group needed a clearer online presence to explain driving-course services, reduce manual inquiries, keep service content updated, and turn visitors into qualified leads.',
    built: 
      'Implemented responsive service pages, structured pricing content, lead capture handling, CMS-ready content workflow, backend service layer, and production deployment setup.',
    result: 
      'Created a clearer service funnel, improved lead submission flow, and gave the team a maintainable workflow for handling content updates and inbound leads.',
    impact: 
      'Strengthened digital trust and gave the business a more reliable path from visitor discovery to inbound inquiry.',
    outcomes: [
      'Clearer service messaging for first-time visitors.',
      'More structured inbound inquiry flow for the team.',
      'Faster content updates without repeated developer intervention.',
    ],
    signals: [
      {
        label: 'Lead Flow',
        value: 'Higher Clarity',
        note: 'Inquiry submissions became more structured and easier to follow up.',
      },
      {
        label: 'Content Ops',
        value: 'Faster Updates',
        note: 'Service and pricing updates could be published with less dev dependency.',
      },
      {
        label: 'Release Stability',
        value: 'Production-Ready',
        note: 'Deployment setup supported consistent release and maintenance flow.',
      },
    ],
    type: 'Service Platform',
    role: 'Fullstack Developer',
    focus: ['Lead Capture', 'Content Workflow', 'Deployment'],
    scope: ['Frontend', 'Lead Capture', 'Content Workflow', 'Deployment'],
    stack: ['Next.js', 'JavaScript', 'Vercel', 'IDCloudHost'],
    live: 'https://arafah-group.com',
    case: '#',
    num: '01',
  },
  {
    id: 'adawms',
    title: 'AdaWMS',
    cat: 'Warehouse · Fullstack System',
    year: '2024',
    desc: 'Built a fullstack warehouse system for stock movement, batch tracking, picking flow, and multi-role operational visibility.',
    problem: 
      'Warehouse and online-channel stock data were frequently out of sync, creating reconciliation overhead and slower operational decisions.',
    built: 
      'Delivered operational dashboards, inbound-outbound movement flow, role-based controls, backend APIs, and storage integrations for daily warehouse execution.',
    result: 
      'Synchronized stock visibility across workflows and reduced manual reconciliation effort for day-to-day warehouse operations.',
    impact: 
      'Warehouse, operations, and online-channel teams could work from the same operational data instead of fragmented stock records.',
    outcomes: [
      'Unified stock visibility across warehouse and online channels.',
      'Lower reconciliation overhead in daily operations.',
      'Faster operational decisions with cleaner warehouse data.',
    ],
    signals: [
      {
        label: 'Stock Sync',
        value: 'More Consistent',
        note: 'Warehouse and channel stock data were aligned across core workflows.',
      },
      {
        label: 'Ops Speed',
        value: 'Improved',
        note: 'Operational decisions could be made faster with cleaner dashboard visibility.',
      },
      {
        label: 'Reconciliation Load',
        value: 'Reduced',
        note: 'Manual stock-check and adjustment effort was significantly lowered.',
      },
    ],
    type: 'Warehouse Management System',
    role: 'Fullstack Developer',
    focus: ['Operations Dashboard', 'Role Access', 'API Services'],
    scope: ['Dashboard UI', 'Backend API', 'Database', 'Role Access', 'Deployment'],
    stack: ['NestJS', 'MySQL', 'AWS S3', 'ExpressJS', 'JWT'],
    live: 'http://adawms.com/',
    case: '#',
    num: '02',
  },
  {
    id: 'ngaji-app',
    title: 'Belajar Ngaji',
    cat: 'Education · Fullstack Web App',
    year: '2021',
    desc: 'Built an education web app with guided lesson flows, media playback, backend services, relational data modeling, and production deployment.',
    problem: 
      'Learners needed a simple digital flow to practice Quran reading basics without fragmented materials or confusing navigation.',
    built: 
      'Implemented lesson hierarchy, media playback support, backend content services, relational schema design, and containerized deployment setup.',
    result: 
      'Improved learning accessibility with a clearer self-study journey and a maintainable foundation for future lesson expansion.',
    impact: 
      'Lowered learning friction for first-time users and made future content growth easier to manage.',
    outcomes: [
      'Simpler self-study flow for beginner learners.',
      'Centralized lesson structure and media delivery.',
      'Scalable foundation for adding future learning content.',
    ],
    signals: [
      {
        label: 'Learning Flow',
        value: 'Clearer Journey',
        note: 'Users could navigate lessons with less confusion and friction.',
      },
      {
        label: 'Content Scalability',
        value: 'More Maintainable',
        note: 'Structured backend content model supported future lesson expansion.',
      },
      {
        label: 'Platform Reliability',
        value: 'Production-Ready',
        note: 'Containerized deployment improved repeatability and operational consistency.',
      },
    ],
    type: 'Education Platform',
    role: 'Fullstack Developer',
    focus: ['Learning Flow', 'Backend Service', 'Container Deployment'],
    scope: ['Frontend', 'Backend', 'Database', 'Containerization'],
    stack: ['Next.js', 'TypeScript', 'Golang', 'PostgreSQL', 'Docker'],
    live: 'https://belajar-ngaji.online/',
    case: '#',
    num: '03',
  },
  {
    id: 'tokokupon',
    title: 'Tokokupon.id',
    cat: 'Marketplace · Fullstack',
    year: '2024',
    desc: 'Built a marketplace web presence and admin CMS workflow so campaigns and content updates could ship faster without risky release overhead.',
    problem: 
      'The team needed a marketplace-facing presence and an admin workflow that could be updated quickly without interrupting production.',
    built: 
      'Implemented responsive acquisition pages, CMS-oriented admin capabilities, supporting API services, and deployment flow for continuous updates.',
    result: 
      'Enabled faster content rollout and clearer acquisition flow while keeping backend operations stable for ongoing growth.',
    impact: 
      'Reduced release friction for marketing and operations by making key marketplace content easier to update.',
    outcomes: [
      'Faster campaign and content rollout cycles.',
      'Clearer acquisition path for marketplace visitors.',
      'More stable release flow for ongoing product updates.',
    ],
    signals: [
      {
        label: 'Campaign Velocity',
        value: 'Increased',
        note: 'Marketing pages and campaign content could be updated more quickly.',
      },
      {
        label: 'CMS Agility',
        value: 'Improved',
        note: 'Operational updates became easier without interrupting production.',
      },
      {
        label: 'Release Confidence',
        value: 'More Stable',
        note: 'Deployment flow supported safer and more predictable releases.',
      },
    ],
    type: 'Marketplace Platform',
    role: 'Fullstack Developer',
    focus: ['Content Workflow', 'Admin Operations', 'Release Stability'],
    scope: ['Frontend', 'Admin CMS', 'Backend API', 'Database', 'Deployment'],
    stack: ['Next.js', 'NestJS', 'Ant Design', 'MySQL', 'Vercel'],
    live: 'https://tokokupon.com',
    case: '#',
    num: '04',
  },
  {
    id: 'wms-rasa-group',
    title: 'WMS Rasa Group',
    cat: 'Operations · WMS',
    year: '2025',
    desc: 'Built an internal fullstack WMS for inbound-outbound execution, inventory movement, batch control, and operational reporting.',
    problem: 
      'Operations relied on fragmented manual processes, making warehouse execution hard to monitor, audit, and scale reliably.',
    built: 
      'Developed the platform from scratch with operational dashboards, backend API architecture, PostgreSQL domain modeling, and automation hooks for warehouse controls.',
    result: 
      'Standardized internal warehouse workflows and established a scalable foundation for long-term operational expansion.',
    impact: 
      'Created better execution visibility and auditability, so warehouse decisions could be made faster with centralized operational data.',
    outcomes: [
      'Standardized inbound, outbound, and inventory execution flow.',
      'Improved audit visibility for warehouse movements.',
      'Scalable backend foundation for future operational expansion.',
    ],
    signals: [
      {
        label: 'Ops Visibility',
        value: 'Higher',
        note: 'Operational dashboards gave clearer execution status across warehouse activities.',
      },
      {
        label: 'Audit Readiness',
        value: 'Improved',
        note: 'Movement tracking and data structure supported stronger audit trails.',
      },
      {
        label: 'Process Standardization',
        value: 'Established',
        note: 'Core inbound-outbound-inventory workflows became more consistent.',
      },
    ],
    type: 'Internal Warehouse System',
    role: 'Senior IT Developer',
    focus: ['Process Standardization', 'API Architecture', 'Operational Reporting'],
    scope: ['Backend API', 'Dashboard', 'Database Design', 'Automation', 'Integration'],
    stack: ['NestJS', 'Prisma ORM', 'Vue.js', 'PostgreSQL', 'Docker'],
    live: '#',
    case: '#',
    num: '05',
  },
  {
    id: 'qala-temu',
    title: 'Qala Temu',
    cat: 'Appointment · Platform',
    year: '2025',
    desc: 'Built a fullstack appointment platform for scheduling, service discovery, admin operations, and end-to-end booking flow.',
    problem: 
      'Booking and scheduling relied on manual coordination, creating friction for end users and operational teams.',
    built: 
      'Implemented customer booking experience, admin dashboard, auth and role flows, NestJS API services, relational schema, and Dockerized deployment.',
    result: 
      'Delivered a production-ready appointment platform that improved booking clarity and reduced scheduling friction.',
    impact: 
      'Gave both customers and operators a clearer scheduling workflow with fewer manual coordination steps.',
    outcomes: [
      'Cleaner booking flow from discovery to appointment submission.',
      'Operational dashboard for managing schedules and services.',
      'Lower manual coordination across customer and admin workflows.',
    ],
    signals: [
      {
        label: 'Booking Clarity',
        value: 'Improved',
        note: 'Users could complete scheduling with fewer handoff steps.',
      },
      {
        label: 'Admin Throughput',
        value: 'More Efficient',
        note: 'Dashboard workflows made schedule and service management more practical.',
      },
      {
        label: 'Scheduling Friction',
        value: 'Reduced',
        note: 'Manual back-and-forth coordination decreased across user and operator flow.',
      },
    ],
    type: 'Appointment Platform',
    role: 'Fullstack Developer',
    focus: ['Booking Flow', 'Admin Management', 'Production Deployment'],
    scope: ['Booking UI', 'Admin Dashboard', 'API', 'Database', 'Deployment'],
    stack: ['React', 'NestJS', 'Prisma', 'PostgreSQL', 'Docker'],
    live: 'https://qala.digital',
    case: '#',
    num: '06',
  },
  {
    id: 'attendance-system',
    title: 'Geo Attendance System',
    cat: 'HR Tech · Attendance & Leave Platform',
    year: '2026',
    desc: 'Built a fullstack attendance and leave management system with geofenced check-in, mandatory selfie verification, and a two-tier approval workflow -- delivered in one week with AI-assisted development.',
    problem: 
      'The team needed a reliable way to verify employee attendance across multiple work locations, replace manual leave paperwork, and give managers and HR a faster approval and monitoring process -- all under a tight one-week delivery window.',
    built: 
      'Implemented geofenced check-in with admin-defined location points, mandatory selfie capture, leave/day-off/attendance-correction requests, a two-tier approval chain (supervisor and HR), and admin/HR dashboards for monitoring attendance, leave, and master data. Backend built with Go and Gin Gonic, frontend with Vue.js, PostgreSQL for data, and Dockerized deployment through Komodo -- with Claude Code accelerating implementation to hit the one-week deadline.',
    result: 
      'Delivered a production-ready attendance and leave platform in seven days, replacing manual attendance tracking with location-verified, photo-confirmed check-ins and a structured approval flow.',
    impact: 
      'Reduced attendance fraud risk, centralized leave and correction requests into one approval pipeline, and gave HR real-time visibility into attendance and leave across all work locations.',
    outcomes: [
      'Location-verified, selfie-confirmed check-ins across multiple work sites.',
      'Structured two-tier approval flow for leave, day-off, and attendance corrections.',
      'Centralized admin and HR dashboard for attendance, leave, and master data monitoring.',
    ],
    signals: [
      {
        label: 'Delivery Speed',
        value: '7 Days',
        note: 'Full system scoped, built, and deployed in one week with AI-assisted development using Claude Code.',
      },
      {
        label: 'Attendance Integrity',
        value: 'Location-Verified',
        note: 'Geofenced check-in points plus mandatory selfie capture reduced buddy-punching and location fraud.',
      },
      {
        label: 'Approval Flow',
        value: 'Two-Tier Routing',
        note: 'Leave, day-off, and correction requests route through supervisor then HR for structured sign-off.',
      },
    ],
    type: 'Attendance & HR Platform',
    role: 'Fullstack Developer',
    focus: ['Geofenced Check-in', 'Leave & Approval Workflow', 'Admin & HR Dashboard'],
    scope: ['Frontend', 'Backend API', 'Database', 'Deployment'],
    stack: ['Go', 'Gin Gonic', 'Vue.js', 'PostgreSQL', 'Docker', 'Komodo'],
    live: '#',
    case: '#',
    num: '07',
  },
];

const Portfolio = ({ lenisRef }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const sectionRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusedRef = useRef(null);

  useWordSplit(sectionRef);
  useTextScramble(sectionRef);
  useGsapReveal(sectionRef);
  const { viewport, sectionContainer, sectionItem, eyebrow, reduceMotion } =
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

  return (
    <section className="s-portfolio" id="portfolio">
      <motion.div
        ref={sectionRef}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="s-eyebrow" variants={eyebrow}>
          // <span data-scramble="SELECTED_WORK">SELECTED_WORK</span>
        </motion.div>
        <motion.h2 className="s-title" variants={sectionItem} data-word-split>
          Selected <span className="s-outline">Projects</span>
        </motion.h2>
        <motion.div
          className="section-lime-rule"
          variants={{
            hidden: { scaleX: 0, originX: 0 },
            visible: { scaleX: 1, originX: 0, transition: { type: 'spring', stiffness: 60, damping: 18, delay: 0.2 } },
          }}
        />
        <motion.p className="port-intro" variants={sectionItem}>
          Real projects across web apps, dashboards, backend systems, automation, and deployment.
        </motion.p>

        <ProjectCoverflow projects={projects} onOpen={openModal} lenisRef={lenisRef} />
      </motion.div>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            className="modal-overlay active"
            onClick={closeModal}
            {...modalOverlayMotion(reduceMotion)}
          >
            <motion.div
              className="modal-card"
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`project-modal-title-${selectedProject.id}`}
              tabIndex="-1"
              data-lenis-prevent
              data-lenis-prevent-wheel
              data-lenis-prevent-touch
              onClick={e => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              variants={modalCardVariants(reduceMotion)}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <button ref={closeButtonRef} className="modal-close" onClick={closeModal} aria-label="Close project details">✕</button>
              <motion.div className="modal-header" variants={modalChildVariants}>
                {selectedProject.cat && (
                  <div className="mh-cat">{selectedProject.cat}</div>
                )}
                <h2 id={`project-modal-title-${selectedProject.id}`} className="mh-title">{selectedProject.title}</h2>
                {selectedProject.year && (
                  <div className="mh-year">Release: {selectedProject.year}</div>
                )}
              </motion.div>
              <motion.div className="modal-content" variants={modalChildVariants}>
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
                  <article className="m-case-block">
                    <div className="m-case-lbl">Business Impact</div>
                    <p className="m-body-text">{selectedProject.impact}</p>
                  </article>
                  <article className="m-case-block">
                    <div className="m-case-lbl">Key Outcomes</div>
                    <ul className="m-impact-list">
                      {selectedProject.outcomes.map((outcome) => (
                        <li key={outcome}>{outcome}</li>
                      ))}
                    </ul>
                  </article>
                </div>
                <div className="modal-sidebar">
                  <div className="m-sidebar-section">
                    <div className="m-ss-lbl">Project Snapshot</div>
                    <div className="m-meta-grid">
                      <div className="m-meta-item">
                        <span>Type</span>
                        <strong>{selectedProject.type}</strong>
                      </div>
                      <div className="m-meta-item">
                        <span>Role</span>
                        <strong>{selectedProject.role}</strong>
                      </div>
                      <div className="m-meta-item">
                        <span>Focus</span>
                        <strong>{selectedProject.focus.join(' · ')}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="m-sidebar-section">
                    <div className="m-ss-lbl">Impact Signals</div>
                    <div className="m-signal-grid">
                      {selectedProject.signals.map((signal) => (
                        <div key={signal.label} className="m-signal-item">
                          <span className="m-signal-label">{signal.label}</span>
                          <strong className="m-signal-value">{signal.value}</strong>
                          <span className="m-signal-note">{signal.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>
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
                    <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="m-btn prime">Discuss Similar Project ↗</a>
                    {selectedProject.live !== '#' && (
                      <a href={selectedProject.live} target="_blank" rel="noopener noreferrer" className="m-btn ghost">View Live Product ↗</a>
                    )}
                    {selectedProject.case !== '#' && (
                      <a href={selectedProject.case} target="_blank" rel="noopener noreferrer" className="m-btn ghost">Case Study ↗</a>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Portfolio;
