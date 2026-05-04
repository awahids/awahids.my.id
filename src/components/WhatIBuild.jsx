import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSectionMotion } from '../lib/sectionMotion';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';

const DEFAULT_OFFERINGS = [
  {
    title: 'Web Applications',
    desc: 'Responsive web apps with clean UI, structured user flows, and maintainable frontend architecture.',
  },
  {
    title: 'Admin Dashboards',
    desc: 'Internal tools for users, operations, reporting, approvals, and role-based business workflows.',
  },
  {
    title: 'Backend APIs',
    desc: 'REST APIs, authentication, authorization, business logic, and integrations for production use.',
  },
  {
    title: 'Automation & Integration',
    desc: 'Webhook flows, third-party API integrations, and automation pipelines that reduce manual work.',
  },
  {
    title: 'Architecture',
    desc: 'Database modeling, app structure, role access, and backend patterns that stay maintainable at scale.',
  },
  {
    title: 'Deployment Setup',
    desc: 'Production deployment with Vercel, Docker, VPS, Nginx, Cloudflare, and CI/CD-ready workflows.',
  },
];

const serviceFromCmsItem = (item) => ({
  title: String(item.title || '').trim(),
  desc: String(item.summary || '').trim(),
});

const WhatIBuild = () => {
  const [offerings, setOfferings] = useState(DEFAULT_OFFERINGS);
  const { viewport, sectionContainer, sectionItem, staggerGrid } = useSectionMotion();

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return undefined;

    let mounted = true;

    const loadServices = async () => {
      const { data, error } = await supabase
        .from('cms_items')
        .select('id,title,summary,sort_order,is_published')
        .eq('collection', 'services')
        .eq('is_published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (!mounted || error || !data?.length) return;

      const nextOfferings = data
        .map(serviceFromCmsItem)
        .filter((item) => item.title && item.desc);

      if (nextOfferings.length) {
        setOfferings(nextOfferings);
      }
    };

    loadServices();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="s-build" id="services">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={sectionContainer}
      >
        <motion.div className="s-eyebrow" variants={sectionItem}>
          // WHAT_I_BUILD
        </motion.div>
        <motion.h2 className="s-title" variants={sectionItem}>
          End-to-End Web Product <span className="s-outline">Development</span>
        </motion.h2>
        <motion.p className="build-intro" variants={sectionItem}>
          I work across the full product layer: interface, backend logic, database,
          integrations, automation, and deployment.
        </motion.p>

        <motion.div className="build-grid" variants={staggerGrid}>
          {offerings.map((item, index) => (
            <motion.article className="build-card" key={item.title} variants={sectionItem}>
              <div className="build-card-num">{`0${index + 1}`}</div>
              <h3 className="build-card-title">{item.title}</h3>
              <p className="build-card-desc">{item.desc}</p>
            </motion.article>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default WhatIBuild;
