"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PlayCircle, BarChart3 } from "lucide-react";
import AbstractBackground from "@/components/AbstractBackground";

const STATS = [
  { n: "01", value: "11 / 14", label: "event classes predicted", color: "var(--status-cyan)" },
  { n: "02", value: "rules + YOLO", label: "detection engines", color: "var(--status-green)" },
  { n: "03", value: "59", label: "hand-labelled dev events", color: "var(--status-orange)" },
  { n: "04", value: "\u2264 2.3\u00d7", label: "video length to process (limit 3\u00d7)", color: "var(--status-red)" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.35 } },
};
const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col">
      <AbstractBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col gap-14 px-4 py-16 sm:px-6 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-3">
            <h1 className="font-heading text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
              BlockVision
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              A rule-based traffic-violation detection system for fixed CCTV
              intersections — vehicles and pedestrians in, labeled event
              segments out.
            </p>
          </div>

          <p className="font-mono text-xs text-muted-foreground">
            WIUT Hackathon 2026 — Computer Vision Track · A. Farxodov, A.
            Ismoilov, M. Tursunov
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 border border-foreground bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
            >
              <PlayCircle className="size-4" />
              Watch it detect
            </Link>
            <Link
              href="/results"
              className="inline-flex items-center gap-2 border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5"
            >
              <BarChart3 className="size-4" />
              See the results
            </Link>
          </div>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4"
        >
          {STATS.map((stat) => (
            <motion.div
              key={stat.n}
              variants={item}
              className="flex flex-col gap-2 bg-background px-1 py-5 sm:px-4"
            >
              <span className="font-mono text-[11px] text-muted-foreground">{stat.n}</span>
              <span className="font-heading text-xl font-semibold" style={{ color: stat.color }}>
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="flex flex-col gap-4 border-t border-border pt-10"
        >
          <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Abstract
          </h2>
          <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
            The system pairs a pretrained YOLO detector with deterministic,
            hand-written rule logic: tracked vehicle and pedestrian
            trajectories are checked against hand-drawn lane, crosswalk, and
            stop-line geometry to flag jaywalking, congestion, red-light running,
            stopped vehicles, and other violations as time-stamped events. No part
            of the pipeline is trained on the team&apos;s own footage.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
