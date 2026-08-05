"use client";

import { motion, type Variants } from "framer-motion";

import { workshops } from "@/data/workshops";
import { WorkshopCard } from "./WorkshopCard";

const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

export function WorkshopGrid() {
  return (
    <motion.ul
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
    >
      {workshops.map((workshop) => (
        <WorkshopCard key={workshop.number} workshop={workshop} />
      ))}
    </motion.ul>
  );
}