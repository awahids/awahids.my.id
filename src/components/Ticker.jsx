import React from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';

const techStack = [
  "TypeScript", "JavaScript", "PHP", "HTML", "CSS", "Go",
  "NestJS", "ExpressJS", "Bootstrap", "Laravel", "Gin Gonic",
  "TypeORM", "GORM", "Sequelize", "MySQL", "PostgreSQL",
  "MongoDB", "Oracle Apex", "Git", "Jira", "Scrum",
  "GraphQL Server", "Postman", "JWT"
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
