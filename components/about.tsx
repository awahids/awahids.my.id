"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { siteConfig } from "../data/site";

export function About() {
  return (
    <section id="about" className="container mx-auto py-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.4 }}
        className="grid md:grid-cols-2 gap-8 items-center"
      >
        <Image
          src={siteConfig.avatarUrl}
          alt={siteConfig.name}
          width={200}
          height={200}
          className="rounded-full mx-auto"
        />
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">About</h2>
          <p className="text-muted-foreground">{siteConfig.bio}</p>
        </div>
      </motion.div>
    </section>
  );
}
