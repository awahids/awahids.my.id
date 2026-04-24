import React from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const techStack = [
  "React", "Next.js", "TypeScript", "Node.js", "NestJS",
  "Laravel", "PostgreSQL", "MySQL", "Prisma", "Docker",
  "Vercel", "Nginx", "Cloudflare", "API Integration", "Automation",
  "GraphQL", "REST API", "JWT", "Git", "Scrum"
];

const Ticker = () => {
  const { viewport, sectionItem } = useSectionMotion();

  return (
    <motion.div
      className="ticker"
      initial="hidden"
      whileInView="visible"
      viewport={viewport}
      variants={sectionItem}
    >
      <div className="ticker-track">
        {/* We double the list for smooth infinite scrolling */}
        {[...techStack, ...techStack].map((tech, index) => (
          <div key={index} className="t-item">
            {tech} <span className="t-dot">·</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default Ticker;
