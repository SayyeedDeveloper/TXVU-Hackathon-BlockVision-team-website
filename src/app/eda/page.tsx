"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import RevealSection from "@/components/eda/RevealSection";
import DATA from "@/data/samples.json";
import { EVENT_COLORS, type EventClass } from "@/lib/eventColors";

const STATUS_COLORS = [
  "var(--status-cyan)",
  "var(--status-green)",
  "var(--status-orange)",
  "var(--status-red)",
  "var(--status-gray)",
];

// Real numbers from the 4 sample videos (src/data/samples.json, generated from
// the pipeline's own tracks and our Label Studio labels).
const NOTES: Record<string, string> = {
  C3896: "Daytime; main framing (lanes, crosswalks and stop line hand-drawn on this view)",
  C3897: "Daytime; identical framing to C3896",
  C3902: "Daytime; zoomed-out framing, crosswalks sit lower in the frame",
  C3905: "Evening; framing shifted slightly from C3896",
};
const SAMPLE_CLIPS = DATA.videos.map((v) => ({
  file: v.file,
  resolution: `${v.width}x${v.height}`,
  fps: v.fps,
  duration: `${v.duration}s`,
  note: NOTES[v.id],
}));

const OBJECT_COUNTS = ["car", "person", "bus", "truck", "motorcycle", "bicycle"].map((cls) => ({
  cls,
  count: DATA.videos.reduce((n, v) => n + ((v.tracksByClass as Record<string, number>)[cls] ?? 0), 0),
}));

const EVENT_COUNTS = Object.entries(DATA.labelCounts as Record<string, number>)
  .map(([cls, count]) => ({ cls, count }))
  .sort((a, b) => b.count - a.count);

const totalTracks = DATA.videos.reduce((n, v) => n + v.tracks, 0);
const longest = DATA.videos.reduce((a, v) => (v.longestTrackSec > a.longestTrackSec ? v : a));
const TRACK_STATS = [
  {
    label: "avg track length",
    value: `${(DATA.videos.reduce((n, v) => n + v.meanTrackSec, 0) / DATA.videos.length).toFixed(1)}s`,
    sub: "mean over the 4 videos (ByteTrack, every 3rd frame)",
  },
  { label: "tracks per video", value: `${Math.round(totalTracks / DATA.videos.length)}`, sub: "average across 4 clips" },
  { label: "total tracks", value: `${totalTracks}`, sub: "across the 18 min of footage" },
  { label: "longest track", value: `${longest.longestTrackSec}s`, sub: `in ${longest.file}` },
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 font-mono text-xs">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-foreground">{payload[0].value}</div>
    </div>
  );
}

export default function EdaPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-16 sm:px-6 lg:py-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-3"
      >
        <span className="font-mono text-xs uppercase tracking-wide text-status-orange">
          Exploratory data analysis
        </span>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          What the sample footage looks like.
        </h1>
        <p className="max-w-xl text-muted-foreground">
          The four sample clips, what our detector and tracker find in them, and
          the events we labelled by hand.
        </p>
        <div className="mt-2 flex flex-col gap-1 rounded-md border border-border/70 bg-card/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <span>
            Four clips, 18.4 minutes, all from one fixed camera: <b>3840x2160 @ 29.97 fps, H.264 High 4:2:2 10-bit</b>.
          </span>
          <span>
            Finding that shaped the pipeline: OpenCV decodes this format at ~25 fps (slower than real time) and
            NVIDIA&apos;s hardware decoder cannot read 4:2:2 H.264, so we decode once with multi-threaded ffmpeg and
            drop 2 of every 3 frames before colour conversion (~3x real time).
          </span>
          <span>
            Finding: the camera is re-framed between clips (C3896 = C3897, C3905 shifted, C3902 zoomed out), so
            scene geometry has to be drawn per framing.
          </span>
        </div>
      </motion.div>

      {/* 1. Dataset overview */}
      <RevealSection className="flex flex-col gap-6">
        <h2 className="font-heading text-xl font-semibold">Dataset overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SAMPLE_CLIPS.map((clip) => (
            <Card key={clip.file} className="border border-border/70 bg-card/60 shadow-none">
              <CardHeader>
                <CardTitle className="font-mono text-sm">{clip.file}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 pt-1 text-xs text-muted-foreground">
                <span>{clip.resolution} · {clip.fps}fps · {clip.duration}</span>
                <span className="mt-1 text-foreground/80">{clip.note}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Same junction and camera in every clip; the differences are framing and lighting.</p>
      </RevealSection>

      <Separator />

      {/* 2. Object detection stats */}
      <RevealSection className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold">
          Object detection stats
        </h2>
        <p className="text-sm text-muted-foreground">
          Detected object counts by class across the sample set.
        </p>
        <Card className="border border-border/70 bg-card/60 shadow-none">
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={OBJECT_COUNTS} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="cls"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 10, fontFamily: "var(--font-mono)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={40}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {OBJECT_COUNTS.map((entry, i) => (
                      <Cell key={entry.cls} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Unique ByteTrack tracks by class across all 4 clips (a car that is tracked twice counts twice). Pedestrians make up ~40% of tracks, which is why jaywalking dominates the events.</p>
      </RevealSection>

      <Separator />

      {/* 3. Event class distribution */}
      <RevealSection className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold">
          Event class distribution
        </h2>
        <p className="text-sm text-muted-foreground">
          Hand-labelled events per class in the sample videos: heavily imbalanced.
        </p>
        <Card className="border border-border/70 bg-card/60 shadow-none">
          <CardContent className="pt-4">
            <div className="h-[420px] w-full min-w-[420px] overflow-x-auto sm:min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={EVENT_COUNTS}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="cls"
                    type="category"
                    width={140}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.3 }} />
                  <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                    {EVENT_COUNTS.map((entry) => (
                      <Cell key={entry.cls} fill={EVENT_COLORS[entry.cls as EventClass]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Our own Label Studio labels (59 events). Jaywalking is 54% of all events; accident, wrong_way, road_obstacle and fire_smoke never occur in the samples.</p>
      </RevealSection>

      <Separator />

      {/* 4. Track quality */}
      <RevealSection className="flex flex-col gap-4">
        <h2 className="font-heading text-xl font-semibold">Track quality</h2>
        <p className="text-sm text-muted-foreground">
          How long and how many tracks ByteTrack produces per video.
        </p>
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border lg:grid-cols-4">
          {TRACK_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 bg-background px-5 py-6">
              <span className="font-heading text-2xl font-semibold text-status-green">
                {stat.value}
              </span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="font-mono text-[10px] text-status-gray">{stat.sub}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Tracks break when objects are occluded (buses, trucks), so one vehicle often gets several IDs.</p>
      </RevealSection>
    </div>
  );
}
