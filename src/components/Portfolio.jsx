import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const projects = [
  {
    id: 'arafah-group',
    title: 'Arafah Group',
    cat: 'Fullstack · Platform',
    year: '2023',
    desc: 'Website for driving course services in Bandung and surrounding areas, with focus on service information, pricing, and lead capture.',
    stack: ['Next.js', 'CSS', 'JavaScript', 'HTML', 'Vercel', 'IDCloudHost'],
    live: 'https://arafah-group.com',
    case: '#',
    bento: 'bento-hero',
    num: '01'
  },
  {
    id: 'adawms',
    title: 'AdaWMS',
    cat: 'Warehouse · Operations',
    year: '2024',
    desc: 'Inventory and warehouse management platform to keep stock data synchronized between warehouses and online shop channels.',
    stack: ['NestJS', 'MySQL', 'AWS S3', 'Postman', 'ExpressJS', 'NodeMailer', 'JWT', 'OAuth', 'Git'],
    live: 'http://adawms.com/',
    case: '#',
    bento: 'bento-feature',
    num: '02'
  },
  {
    id: 'ngaji-app',
    title: 'Belajar Ngaji',
    cat: 'Education · Web App',
    year: '2021',
    desc: 'Simple website to learn the basics of Quran reading with interactive lesson flow and media support.',
    stack: ['Next.js', 'TypeScript', 'Golang', 'Tailwind CSS', 'Gorm', 'PostgreSQL', 'Vercel', 'Docker', 'Quran API'],
    live: 'https://belajar-ngaji.online/',
    case: '#',
    bento: 'bento-tall',
    num: '03'
  },
  {
    id: 'api-movie-reviews',
    title: 'API Movie Reviews',
    cat: 'Backend · API',
    year: '2021',
    desc: 'Movie review API/platform project for creating and managing ratings and reviews, aligned with CV project stack.',
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
    desc: 'Landing page and CMS build for Tokokupon platform with production deployment and content management workflow.',
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
    desc: 'Fullstack warehouse management application initiated from scratch at Rasa Group with scalable backend architecture.',
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
    desc: 'Booking and appointment platform with a modern React frontend and scalable NestJS backend, built with relational data modeling and containerized deployment.',
    stack: ['Docker', 'React', 'NestJS', 'Prisma', 'PostgreSQL'],
    live: 'https://janji.online',
    case: '#',
    bento: 'bento-accent',
    num: '07'
  }
];

const Portfolio = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const { viewport, sectionContainer, sectionItem, staggerGrid, ease, reduceMotion } =
    useSectionMotion();

  const openModal = (project) => {
    setSelectedProject(project);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setSelectedProject(null);
    document.body.style.overflow = '';
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
          Recent <span className="s-outline">Projects</span>
        </motion.h2>
        <motion.p className="port-intro" variants={sectionItem} style={{ color: 'rgba(255,255,255,0.4)', marginTop: '12px', fontSize: '14px', maxWidth: '600px' }}>
          A selection of projects ranging from industrial warehouse systems and 
          management dashboards to marketplace platforms and API development.
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
              role="button"
              tabIndex="0"
              variants={sectionItem}
            >
              <div className="port-card-num">{p.num}</div>
              {p.year && <div className="port-year">{p.year}</div>}
              {p.cat && <div className="port-cat">{p.cat}</div>}
              <h3 className="port-name">{p.title}</h3>
              <p className="port-desc">{p.desc}</p>
              <div className="port-stack">
                {p.stack.slice(0, 3).map(s => (
                  <span key={s} className="port-tag">{s}</span>
                ))}
              </div>
              <button className="port-link">Open Case ↗</button>
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
              <button className="modal-close" onClick={closeModal}>✕</button>
              <div className="modal-header">
                {selectedProject.cat && (
                  <div className="mh-cat">{selectedProject.cat}</div>
                )}
                <h2 className="mh-title">{selectedProject.title}</h2>
                {selectedProject.year && (
                  <div className="mh-year">Release: {selectedProject.year}</div>
                )}
              </div>
              <div className="modal-content">
                <div>
                  <p className="m-body-text">{selectedProject.desc}</p>
                </div>
                <div className="modal-sidebar">
                  <div className="m-sidebar-section">
                    <div className="m-ss-lbl">Tech Stack</div>
                    <div className="m-ss-tags">
                      {selectedProject.stack.map(s => (
                        <span key={s} className="m-ss-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="m-actions">
                    {selectedProject.live !== '#' && (
                      <a href={selectedProject.live} target="_blank" rel="noopener" className="m-btn prime">Live Product ↗</a>
                    )}
                    {selectedProject.case !== '#' && (
                      <a href={selectedProject.case} target="_blank" rel="noopener" className="m-btn ghost">Case Study ↗</a>
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
