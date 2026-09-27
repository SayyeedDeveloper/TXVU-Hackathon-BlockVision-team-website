"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import PipelineStep, { type Step } from "@/components/PipelineStep";

const EVENT_CLASSES = [
  "accident",
  "near_miss",
  "red_light",
  "wrong_way",
  "illegal_u_turn",
  "stopped_vehicle",
  "jaywalking",
  "failure_to_yield",
  "illegal_turn",
  "solid_line_crossing",
  "stop_line",
  "congestion",
  "road_obstacle",
  "fire_smoke",
];

const MODELS_LICENSES = [
  {
    what: "Ultralytics YOLOv8n, COCO-pretrained weights",
    license: "AGPL-3.0",
    use: "object detector (not fine-tuned)",
  },
  {
    what: "ByteTrack (bundled with ultralytics)",
    license: "MIT",
    use: "multi-object tracking",
  },
  {
    what: "FFmpeg via imageio-ffmpeg",
    license: "LGPL/GPL (binary), BSD-2 (wrapper)",
    use: "video decoding",
  },
  {
    what: "Own annotations of the 4 sample videos",
    license: "ours",
    use: "dev-set scoring only",
  },
];

const STEPS: Step[] = [
  {
    number: "01",
    title: "Detection & tracking",
    color: "var(--status-cyan)",
    description:
      "A single ffmpeg pass reads every 3rd frame of the source 4K video, downscaled to 1280px, plus a full-resolution crop of the traffic light head. YOLOv8n — the public COCO-pretrained weights, not fine-tuned — detects the six relevant COCO classes (person, bicycle, car, motorcycle, bus, truck) on the downscaled frames, and ByteTrack links those detections into persistent trajectories in full 4K pixel space.",
  },
  {
    number: "02",
    title: "Scene geometry",
    color: "var(--status-gray)",
    description:
      "Because the camera is fixed and never pans or zooms, the scene itself only needs to be understood once. Lane polygons, crosswalk zones, and the stop line are hand-drawn a single time per camera view and stored as constants, then reused for every frame of that video.",
  },
  {
    number: "03",
    title: "Traffic light state",
    color: "var(--status-orange)",
    description:
      "The traffic-light crop taken during the same decode pass is classified frame-by-frame via HSV color thresholding — no model needed. This runs alongside detection rather than as a separate pass, since both come out of the one ffmpeg read.",
  },
  {
    number: "04",
    title: "Rule evaluation",
    color: "var(--status-red)",
    description:
      "Each of the 14 event classes has its own rule module that takes trajectories and scene geometry as input and applies plain conditional logic — no learning involved. Thresholds live in one config file and were tuned against the team's own labels of three sample videos, with the fourth held out. Three rules (near_miss, wrong_way, illegal_u_turn) only produced false alarms, so the submission leaves them out and predicts 11 classes.",
    detail:
      "jaywalking fires when a pedestrian's foot position sits inside a lane polygon but outside every crosswalk polygon for at least 3 seconds · congestion fires when at least 12 vehicles crawl below a speed threshold at the same time · red_light fires when a vehicle crosses the stop line segment at the exact moment the classified light state is red.",
  },
  {
    number: "05",
    title: "Post-processing",
    color: "var(--status-green)",
    description:
      "Rules fire once per object, but the annotation convention is one segment per event, so segments are cleaned up per class: overlapping segments of the same class are merged, fragments closer than a class-specific gap are joined (1 s for jaywalking, 10 s for congestion), segments shorter than a class-specific minimum are dropped (4 s for jaywalking, 20 s for congestion), and everything is clipped to the video length. What's left is the final [start_sec, end_sec, label] event list.",
  },
  {
    number: "06",
    title: "Accident-risk estimation",
    color: "var(--status-cyan)",
    description:
      "A bonus, strictly causal loop runs its own detector and tracker on every 3rd frame the harness streams to it — it never reads the source file or Part A's output. Risk is pairwise time-to-collision between tracked objects (5 seconds or less counts as high) blended with sudden-deceleration spikes, smoothed into a per-frame score between 0 and 1 that decays back toward 0 when nothing is happening.",
  },
];

export default function ApproachPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-16 px-4 py-16 sm:px-6 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-3"
      >
        <span className="font-mono text-xs uppercase tracking-wide text-status-orange">
          Problem & approach
        </span>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Watching a junction, deterministically.
        </h1>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4"
      >
        <h2 className="font-heading text-xl font-semibold">The problem</h2>
        <p className="leading-relaxed text-muted-foreground">
          A fixed CCTV camera watches a road junction — no panning, no
          zooming, no camera motion at all. From that single static view, the
          system has to detect fourteen types of traffic events and report
          each one as a time segment: a start second, an end second, and a
          label. As a bonus task, it also produces a causal accident-risk
          score for every frame.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {EVENT_CLASSES.map((cls) => (
            <Badge
              key={cls}
              variant="outline"
              className="h-auto border-border/70 px-2.5 py-1 font-mono text-[0.7rem] text-muted-foreground"
            >
              {cls}
            </Badge>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4"
      >
        <h2 className="font-heading text-xl font-semibold">The core idea</h2>
        <p className="leading-relaxed text-muted-foreground">
          Keep the learned component as small as possible. A pretrained YOLO
          model — trained on COCO, so it already knows people, bicycles, cars,
          motorcycles, buses, and trucks — only ever answers one question:{" "}
          <em>what is where</em> in a given frame. Everything else is
          deterministic: tracking identity across frames, understanding where
          the lanes, crosswalks, and stop lines are, and deciding whether a
          specific rule was violated is geometry and hand-written logic, not
          learning. Nothing in this pipeline is trained on the team&apos;s own
          footage.
        </p>
        <p className="leading-relaxed text-muted-foreground">
          The camera never moves, so lanes, crosswalks, and the stop line are
          constants that can be written down once — most event classes then
          reduce to &quot;where did this object go, and when.&quot; With no
          labels provided by the organizers and around 60 self-labelled
          events to validate against, a rule-based pipeline was the one the
          team could actually check the correctness of.
        </p>
      </motion.section>

      <Separator />

      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-semibold">
          The pipeline, stage by stage
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Six stages take raw video from a fixed camera to a clean list of
          labeled events.
        </p>
        <div className="flex flex-col">
          {STEPS.map((step, i) => (
            <PipelineStep
              key={step.number}
              step={step}
              index={i}
              isLast={i === STEPS.length - 1}
            />
          ))}
        </div>
      </div>

      <Separator />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-4"
      >
        <h2 className="font-heading text-xl font-semibold">
          Models, datasets & licenses
        </h2>
        <p className="text-sm text-muted-foreground">
          Everything is open weights, offline, and deterministic — no
          external training data was used.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-4 font-medium">What</th>
                <th className="py-2 pr-4 font-medium">License</th>
                <th className="py-2 font-medium">Use</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {MODELS_LICENSES.map((row) => (
                <tr key={row.what} className="border-b border-border/40">
                  <td className="py-2.5 pr-4 text-foreground/90">{row.what}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{row.license}</td>
                  <td className="py-2.5">{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>
    </div>
  );
}
