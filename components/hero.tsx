"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "../data/site";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        <motion.h1 className="text-4xl font-bold" variants={item}>
          {siteConfig.headline}
        </motion.h1>
        <motion.p className="text-lg text-muted-foreground" variants={item}>
          {siteConfig.subheadline}
        </motion.p>
        <motion.div className="flex gap-4 justify-center" variants={item}>
          <Link
            href="#projects"
            className="px-6 py-3 rounded bg-accent text-background font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            View Work
          </Link>
          <Link
            href="/contact"
            className="px-6 py-3 rounded border border-accent text-accent font-medium hover:bg-accent/10 focus:outline-none focus:ring-2 focus:ring-accent"
          >
            Contact
          </Link>
        </motion.div>
        {siteConfig.avatarUrl && (
          <motion.div variants={item} className="mt-10">
            <Image
              src={siteConfig.avatarUrl}
              alt={siteConfig.name}
              width={160}
              height={160}
              className="rounded-full object-cover mx-auto"
            />
          </motion.div>
        )}
      </motion.div>
    </section>
  );
}
