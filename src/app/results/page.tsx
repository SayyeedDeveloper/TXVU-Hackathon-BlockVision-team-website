"use client";

import { motion } from "framer-motion";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RevealSection from "@/components/eda/RevealSection";
import ClipMedia from "@/components/results/ClipMedia";
import TimelineStrip, { type TimelineEvent } from "@/components/results/TimelineStrip";
import { EVENT_CLASSES, EVENT_COLORS } from "@/lib/eventColors";
import DATA from "@/data/samples.json";

// Real output of the submitted pipeline (predictions_samples.json) and our own
// Label Studio labels of the 4 sample videos (my_labels.json). All 4 clips come
// from the same fixed camera.
type Clip = (typeof DATA.videos)[number];
const CLIPS = DATA.videos as Clip[];
const asEvents = (evs: { cls: string; start: number; end: number }[]) => evs as TimelineEvent[];

const CAPTIONS: Record<string, string> = {
  C3896: "Daytime, main camera framing. Congestion and the one red-light run are caught; turn and stop-line events are missed.",
  C3897: "Daytime, same framing as C3896. Many failure_to_yield false alarms where cars pass pedestrians waiting at the kerb.",
  C3902: "Held out (never used for tuning), zoomed-out framing. Our hand-drawn geometry does not match this view, so it is the honest test.",
  C3905: "Evening, slightly shifted framing. Congestion matches the label closely (tIoU 0.73); a stop-line violation is missed.",
};

const LIMITATIONS = [
  {
    title: "Pedestrians at the kerb flagged as jaywalking",
    description:
      "Lane polygons slightly overlap the pavement edge, so people waiting to cross (feet just inside the polygon) trigger jaywalking. Visible in C3905 around 71-88 s. Fix: shrink lanes at the kerb or require movement into the road.",
  },
  {
    title: "Geometry is per camera framing",
    description:
      "The camera is re-framed between clips. C3902 falls back to C3896's layout, so its traffic-light crop reads 'unknown' 99% of the time and lanes are offset; the held-out Score A drops to 0.054. Fix: register the geometry to each video automatically.",
  },
  {
    title: "Five classes never detected",
    description:
      "stop_line, illegal_turn, solid_line_crossing, illegal_u_turn and near_miss score 0: the scene has no solid-line or turn-restriction geometry, and the near-miss and U-turn rules only produced false alarms, so they are removed from the submission.",
  },
];

function RiskTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 font-mono text-xs">
      <div className="text-muted-foreground">t = {label}s</div>
      <div className="text-status-cyan">risk = {payload[0].value.toFixed(2)}</div>
    </div>
  );
}

const cardContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ResultsPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-16 sm:px-6 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-3"
      >
        <span className="font-mono text-xs uppercase tracking-wide text-status-orange">
          Results
        </span>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          What the pipeline sees, on the sample clips.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Concrete output on the 4 sample videos — including where it
          doesn&apos;t work yet.
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {[
            { v: DATA.scores.all.scoreA.toFixed(3), l: "Score A, all 4 videos (our labels)" },
            { v: DATA.scores.heldOut.scoreA.toFixed(3), l: "Score A, held-out C3902: the honest estimate" },
            { v: DATA.scores.untunedAll.toFixed(3), l: "Score A before threshold tuning" },
          ].map((m) => (
            <div key={m.l} className="rounded-md border border-border/70 bg-card/40 px-4 py-3">
              <div className="font-mono text-2xl text-status-cyan">{m.v}</div>
              <div className="text-xs text-muted-foreground">{m.l}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 1. Per-video results */}
      <motion.div
        variants={cardContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.1 }}
        className="grid gap-8 lg:grid-cols-2"
      >
        {CLIPS.map((clip) => (
          <motion.div key={clip.id} variants={cardItem}>
            <Card className="flex h-full flex-col gap-4 border border-border/70 bg-card/60 p-0 shadow-none">
              <ClipMedia videoSrc={clip.video} clip={clip.file} />
              <CardContent className="flex flex-col gap-3 pb-4">
                <CardTitle className="flex items-center gap-2 font-mono text-sm">
                  {clip.file}
                  {clip.heldOut && (
                    <Badge variant="outline" className="border-status-orange/50 font-mono text-[0.6rem] text-status-orange">
                      held out
                    </Badge>
                  )}
                </CardTitle>
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Model output</div>
                <TimelineStrip duration={clip.duration} events={asEvents(clip.pred)} />
                <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Our labels</div>
                <TimelineStrip duration={clip.duration} events={asEvents(clip.labels)} />
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {CAPTIONS[clip.id]}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <RevealSection className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold">Per-class score (official evaluate.py)</h2>
        <p className="text-sm text-muted-foreground">
          F1 at temporal-IoU thresholds 0.3 / 0.5 / 0.7 against our own labels of all 4 videos
          (59 events). Thresholds were tuned on C3896, C3897 and C3905; C3902 was held out.
        </p>
        <div className="overflow-x-auto rounded-md border border-border/70">
          <table className="w-full font-mono text-xs">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                {["class", "F1@0.3", "F1@0.5", "F1@0.7", "mean", "TP/FP/FN@0.5"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DATA.scores.all.classes.map((c) => (
                <tr key={c.cls} className="border-t border-border/50">
                  <td className="px-3 py-2">{c.cls}</td>
                  <td className="px-3 py-2">{c.f1_03.toFixed(2)}</td>
                  <td className="px-3 py-2">{c.f1_05.toFixed(2)}</td>
                  <td className="px-3 py-2">{c.f1_07.toFixed(2)}</td>
                  <td className="px-3 py-2 text-status-cyan">{c.mean.toFixed(2)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.tp}/{c.fp}/{c.fn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </RevealSection>

      <Separator />

      {/* 2. Risk score example */}
      <RevealSection className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold">
          Accident-risk score over time
        </h2>
        <p className="text-sm text-muted-foreground">
          Part B risk for <span className="font-mono">C3905.MP4</span> (max per second),
          computed from time-to-collision and braking signals with no lookahead:
          each point only sees frames up to that moment. None of the sample videos
          contains an accident, so Part B cannot be scored on them; peaks here are
          close-passing traffic, i.e. potential false alarms.
        </p>
        <Card className="border border-border/70 bg-card/60 shadow-none">
          <CardContent className="pt-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={CLIPS.find((c) => c.id === "C3905")!.risk} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="t"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={32}
                    label={{ value: "seconds", position: "insideBottom", offset: -4, fill: "var(--muted-foreground)", fontSize: 10 }}
                  />
                  <YAxis
                    domain={[0, 1]}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<RiskTooltip />} cursor={{ stroke: "var(--status-cyan)", strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="risk"
                    stroke="var(--status-cyan)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </RevealSection>

      <Separator />

      {/* 3. Known limitations */}
      <RevealSection className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-heading text-xl font-semibold">Known limitations</h2>
          <p className="text-sm text-muted-foreground">
            Where the current pipeline is noisy or wrong — worth stating
            plainly rather than glossing over.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {LIMITATIONS.map((item) => (
            <Card
              key={item.title}
              className="border border-dashed border-border/70 bg-card/40 shadow-none"
            >
              <CardHeader>
                <CardTitle className="text-sm">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-1 text-xs leading-relaxed text-muted-foreground">
                {item.description}
              </CardContent>
            </Card>
          ))}
        </div>
      </RevealSection>

      <Separator />

      {/* 4. Legend */}
      <RevealSection className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold">How to read this</h2>
        <div className="flex flex-wrap gap-2">
          {EVENT_CLASSES.map((cls) => (
            <Badge
              key={cls}
              variant="outline"
              className="h-auto gap-1.5 border-border/70 px-2.5 py-1 font-mono text-[0.7rem] text-muted-foreground"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: EVENT_COLORS[cls] }}
              />
              {cls}
            </Badge>
          ))}
        </div>
      </RevealSection>
    </div>
  );
}
