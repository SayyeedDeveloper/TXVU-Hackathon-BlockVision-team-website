import Link from "next/link";

const REPO = "https://github.com/SayyeedDeveloper/TXVU-Hackathon-BlockVision-team";

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "What we built",
    items: [
      "A detector + tracker + rules pipeline: YOLOv8n (COCO-pretrained, not fine-tuned) and ByteTrack turn each video into trajectories; one rule module per event class checks them against hand-drawn lanes, crosswalks and the stop line; a per-class cleanup step turns rule hits into [start, end, label] segments.",
      "A single fast decode pass: ffmpeg keeps every 3rd frame, downscales it to 1280 px and cuts a full-resolution crop of the traffic light, whose colour is classified by HSV thresholds.",
      "A causal Part B risk score from pairwise time-to-collision and sudden braking.",
      "A dev set: 59 events we labelled ourselves in Label Studio on the 4 sample videos, scored with the official evaluate.py.",
    ],
  },
  {
    title: "What worked",
    items: [
      "Decoding once with ffmpeg instead of OpenCV: the 4K 10-bit 4:2:2 footage went from slower than real time to ~3x real time, taking every sample video from over the 3x time budget to 1.4-2.3x.",
      "Tuning thresholds on our own labels: Score A 0.049 -> 0.122 on the dev set; congestion F1 0.12 -> 0.67.",
      "Holding one video out (C3902): jaywalking also improved there (0.26 -> 0.32), so the tuning generalises rather than memorising.",
      "Removing classes whose rules only produced false alarms (near_miss, wrong_way, illegal_u_turn): each false class would add a zero to the macro average.",
    ],
  },
  {
    title: "What did not",
    items: [
      "Accuracy is modest: Score A 0.122 on all dev videos and 0.054 on the held-out one. Expect roughly 0.05-0.10 on unseen videos.",
      "Five labelled classes are never detected (stop_line, illegal_turn, solid_line_crossing, illegal_u_turn, near_miss).",
      "failure_to_yield raises 28 false alarms; pedestrians waiting at the kerb are counted as jaywalking because lane polygons overlap the pavement.",
      "Scene geometry is chosen by file name; a video with a new framing (like C3902) falls back to the wrong layout, and there the traffic light reads 'unknown' 99% of the time.",
      "Part B cannot be evaluated: none of the sample videos contains an accident.",
    ],
  },
  {
    title: "What we would do next",
    items: [
      "Register the hand-drawn geometry to each video automatically (feature matching on a median background frame), removing the file-name lookup.",
      "Tighten the kerb edges of the lane polygons and require pedestrians to move into the road before counting jaywalking.",
      "Draw solid lines and turn restrictions so the stop_line, illegal_turn and solid_line_crossing rules can fire.",
      "Train a small clip classifier on public crash data (CCD, DoTA) to re-score accident and near-miss candidates.",
    ],
  },
];

export default function ReportPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-16 sm:px-6 lg:py-24">
      <div className="flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-wide text-status-orange">Report</span>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          What we built, what worked, what didn&apos;t.
        </h1>
        <p className="text-muted-foreground">
          One page, stated plainly. Numbers are from the official evaluate.py run against our own labels of
          the four sample videos.
        </p>
      </div>
      {SECTIONS.map((sec) => (
        <section key={sec.title} className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-semibold">{sec.title}</h2>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed text-muted-foreground">
            {sec.items.map((it) => (
              <li key={it}>{it}</li>
            ))}
          </ul>
        </section>
      ))}
      <section className="flex flex-col gap-2 border-t border-border/70 pt-6 text-sm">
        <h2 className="font-heading text-xl font-semibold">Links</h2>
        <Link className="text-status-cyan underline" href={REPO}>Repository (tag v1.0)</Link>
        <Link className="text-status-cyan underline" href={`${REPO}/tree/v1.0/weights`}>Weights (weights/yolov8n.pt)</Link>
        <Link className="text-status-cyan underline" href={`${REPO}/blob/v1.0/predictions_samples.json`}>predictions_samples.json</Link>
      </section>
    </div>
  );
}
