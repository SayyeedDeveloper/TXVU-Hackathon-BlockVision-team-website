const REPO = "https://github.com/SayyeedDeveloper/TXVU-Hackathon-BlockVision-team";
// Set NEXT_PUBLIC_DEMO_URL (e.g. in Vercel project settings) to the hosted upload
// demo; the page embeds it automatically.
const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_URL ?? "https://demo.sayyeed.dev";

export default function DemoPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-16 sm:px-6 lg:py-24">
      <div className="flex flex-col gap-3">
        <span className="font-mono text-xs uppercase tracking-wide text-status-orange">Live demo</span>
        <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Upload a clip, get the events back.
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Accepts an .mp4 from the same fixed camera (up to 500 MB); the first 15 seconds are analysed. The demo
          runs the exact submitted pipeline (tag v1.1) on a single CPU core and returns the event list, a
          timeline and the accident-risk curve; progress is shown while it runs (about 4 minutes).
        </p>
      </div>
      {DEMO_URL ? (
        <div className="flex flex-col gap-3">
          <a
            href={DEMO_URL}
            target="_blank"
            rel="noreferrer"
            className="w-fit rounded-md bg-status-cyan px-5 py-3 font-mono text-sm font-semibold text-black"
          >
            Open the demo in a new tab &rarr;
          </a>
          <iframe src={DEMO_URL} title="BlockVision live demo" className="h-[1100px] w-full rounded-md border border-border/70" />
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-md border border-border/70 bg-card/40 p-6 text-sm text-muted-foreground">
          <p>The hosted demo is being deployed. Meanwhile, the same pipeline runs locally in three commands:</p>
          <pre className="overflow-x-auto rounded bg-muted/40 p-4 font-mono text-xs text-foreground">
{`git clone ${REPO} && cd TXVU-Hackathon-BlockVision-team
pip install -r requirements.txt
python -c "import solution; print(solution.detect_events('your_clip.mp4'))"`}
          </pre>
          <p>
            Annotated output for all four sample videos is on the <a className="text-status-cyan underline" href="/results">Results</a> page.
          </p>
        </div>
      )}
    </div>
  );
}
