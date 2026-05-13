import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useSectionMotion } from '../lib/sectionMotion';
import { BOOKING_URL } from '../lib/links';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { useWordSplit } from '../lib/useWordSplit';
import { useTextScramble } from '../lib/useTextScramble';
import { useGsapReveal } from '../lib/useGsapReveal';
import { modalCardVariants, modalChildVariants, modalOverlayMotion } from '../lib/modalMotion';
// PortfolioScrollSwap removed — using bento grid layout

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
    bento: 'bento-hero',
    num: '01'
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
    bento: 'bento-feature',
    num: '02'
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
    bento: 'bento-tall',
    num: '03'
  },
  {
    id: 'api-movie-reviews',
    title: 'API Movie Reviews',
    cat: 'Backend API · Platform Core',
    year: '2021',
    desc: 'Built backend APIs for review lifecycle, rating flow, media upload integration, and deployment-ready service operations.',
    problem:
      'The product needed one reliable backend contract to handle review lifecycle, ratings, and media assets for multiple frontend flows.',
    built:
      'Designed REST endpoints, structured relational models, integrated media upload services, and packaged deployment-ready backend infrastructure.',
    result:
      'Provided a reusable API foundation that supported product experimentation and faster frontend integration.',
    impact:
      'Enabled quicker feature iteration by centralizing core review logic into one reusable backend service.',
    outcomes: [
      'Reusable API contract for review and rating features.',
      'Cleaner integration path for frontend experimentation.',
      'Deployment-ready backend structure for iterative product work.',
    ],
    signals: [
      {
        label: 'Integration Speed',
        value: 'Faster',
        note: 'Frontend experiments moved faster with stable API contracts.',
      },
      {
        label: 'API Reuse',
        value: 'Higher',
        note: 'Core review and rating logic was reused across product scenarios.',
      },
      {
        label: 'Service Stability',
        value: 'Improved',
        note: 'Deployment-ready backend foundation reduced iteration risk.',
      },
    ],
    type: 'Backend Platform API',
    role: 'Backend Developer',
    focus: ['Review Lifecycle', 'Media Integration', 'API Reliability'],
    scope: ['Backend API', 'Data Model', 'Integration', 'Deployment'],
    stack: ['ExpressJS', 'PostgreSQL', 'Cloudinary', 'Heroku', 'Git'],
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
    bento: 'bento-compact',
    num: '05'
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
    bento: 'bento-core',
    num: '06'
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
    bento: 'bento-accent',
    num: '07'
  }
];

const MOBILE_PROJECT_LIMIT = 5;

const groupProjectChildren = (rows = [], valueKey = 'label') =>
  rows.reduce((acc, row) => {
    const projectId = row.project_id;
    if (!projectId) return acc;

    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(row[valueKey]);
    return acc;
  }, {});

const groupProjectSignals = (rows = []) =>
  rows.reduce((acc, row) => {
    const projectId = row.project_id;
    if (!projectId) return acc;

    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push({
      label: row.label,
      value: row.value,
      note: row.note,
    });
    return acc;
  }, {});

const projectFromCmsItem = (item, index, children = {}) => {
  return {
    id: item.id,
    title: item.title,
    cat: item.subtitle,
    year: String(item.year || ''),
    desc: item.summary,
    problem: String(item.problem || ''),
    built: String(item.built || ''),
    result: String(item.result || ''),
    impact: String(item.impact || ''),
    outcomes: children.outcomes?.[item.id] || [],
    signals: children.signals?.[item.id] || [],
    type: String(item.project_type || ''),
    role: String(item.role || ''),
    focus: children.focus?.[item.id] || [],
    scope: children.scope?.[item.id] || [],
    stack: children.stack?.[item.id] || [],
    live: String(item.live_url || '#'),
    case: String(item.case_url || '#'),
    bento: String(item.bento || 'bento-compact'),
    num: String(item.num || String(index + 1).padStart(2, '0')),
  };
};

const Portfolio = () => {
  const [projectItems, setProjectItems] = useState(projects);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showAllMobileProjects, setShowAllMobileProjects] = useState(false);
  const sectionRef = useRef(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusedRef = useRef(null);

  useWordSplit(sectionRef);
  useTextScramble(sectionRef);
  useGsapReveal(sectionRef);
  const { viewport, sectionContainer, sectionItem, staggerGrid, eyebrow, cardPop, reduceMotion } =
    useSectionMotion();

  const visibleProjects = isMobile && !showAllMobileProjects
    ? projectItems.slice(0, MOBILE_PROJECT_LIMIT)
    : projectItems;
  const visibleScopeLimit = isMobile ? 3 : 4;

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let mounted = true;

    const loadProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id,title,subtitle,summary,year,project_type,role,live_url,case_url,bento,num,problem,built,result,impact,sort_order,is_published')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!mounted || error || !data?.length) return;

      const projectIds = data.map((project) => project.id);
      const [
        focusResult,
        scopeResult,
        stackResult,
        outcomesResult,
        signalsResult,
      ] = await Promise.all([
        supabase.from('project_focus').select('project_id,label,sort_order').in('project_id', projectIds).order('sort_order', { ascending: true }),
        supabase.from('project_scope').select('project_id,label,sort_order').in('project_id', projectIds).order('sort_order', { ascending: true }),
        supabase.from('project_stack').select('project_id,label,sort_order').in('project_id', projectIds).order('sort_order', { ascending: true }),
        supabase.from('project_outcomes').select('project_id,body,sort_order').in('project_id', projectIds).order('sort_order', { ascending: true }),
        supabase.from('project_signals').select('project_id,label,value,note,sort_order').in('project_id', projectIds).order('sort_order', { ascending: true }),
      ]);

      if (!mounted) return;

      const children = {
        focus: groupProjectChildren(focusResult.data || []),
        scope: groupProjectChildren(scopeResult.data || []),
        stack: groupProjectChildren(stackResult.data || []),
        outcomes: groupProjectChildren(outcomesResult.data || [], 'body'),
        signals: groupProjectSignals(signalsResult.data || []),
      };

      setProjectItems(data.map((project, index) => projectFromCmsItem(project, index, children)));
    };

    loadProjects();

    return () => {
      mounted = false;
    };
  }, []);

  const openModal = useCallback((project) => {
    setSelectedProject(project);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedProject(null);
  }, []);

  // 3D tilt + spotlight glow on portfolio cards
  useEffect(() => {
    const cards = document.querySelectorAll('.port-card');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (prefersReducedMotion || !hasFinePointer) return;

    const cleanups = [];
    cards.forEach((card) => {
      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) / (rect.width / 2);
        const dy = (e.clientY - cy) / (rect.height / 2);

        // 3D tilt + lift
        gsap.to(card, {
          rotateX: dy * -6,
          rotateY: dx * 6,
          y: -8,
          transformPerspective: 900,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto',
        });

        // Mouse-tracking spotlight: update CSS custom properties
        const pctX = ((e.clientX - rect.left) / rect.width) * 100;
        const pctY = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', `${pctX}%`);
        card.style.setProperty('--my', `${pctY}%`);
        card.classList.add('is-hovered');
      };
      const onLeave = () => {
        gsap.to(card, {
          rotateX: 0, rotateY: 0, y: 0,
          duration: 0.55, ease: 'power3.out', overwrite: 'auto',
        });
        card.classList.remove('is-hovered');
      };
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        card.removeEventListener('mousemove', onMove);
        card.removeEventListener('mouseleave', onLeave);
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, [projectItems]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 960px)');

    const syncViewport = (event) => {
      const nextIsMobile = Boolean(event.matches);
      setIsMobile((prevIsMobile) => {
        if (prevIsMobile !== nextIsMobile) {
          setShowAllMobileProjects(!nextIsMobile);
        }

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

        <motion.div
          className="port-grid"
          variants={staggerGrid}
        >
          {visibleProjects.map((p) => (
            <motion.div
              key={p.id}
              className={`port-card ${p.bento}`}
              onClick={() => openModal(p)}
              onKeyDown={(event) => handleCardKeyDown(event, p)}
              role="button"
              tabIndex="0"
              aria-haspopup="dialog"
              aria-label={`Open project details for ${p.title}`}
              variants={cardPop}
              initial={false}
            >
              <div className="port-card-num">{p.num}</div>
              {p.year && <div className="port-year">{p.year}</div>}
              {p.cat && <div className="port-cat">{p.cat}</div>}
              <h3 className="port-name">{p.title}</h3>
              <p className="port-desc">{p.desc}</p>
              <div className="port-scope">Scope</div>
              <div className="port-stack">
                {p.scope.slice(0, visibleScopeLimit).map(s => (
                  <span key={s} className="port-tag">{s}</span>
                ))}
              </div>
              <span className="port-link" aria-hidden="true">Open Case ↗</span>
            </motion.div>
          ))}
        </motion.div>
        {isMobile && projectItems.length > MOBILE_PROJECT_LIMIT && (
          <motion.button
            type="button"
            className="port-mobile-toggle"
            onClick={() => setShowAllMobileProjects((prev) => !prev)}
            variants={sectionItem}
          >
            {showAllMobileProjects
              ? 'Show Less'
              : `View More Projects (${projectItems.length - MOBILE_PROJECT_LIMIT})`}
          </motion.button>
        )}
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
