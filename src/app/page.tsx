import Link from "next/link";
import { LiveStats } from "@/components/tempcdn/live-stats";
import { Button } from "@/components/ui/button";
import { Timer, ShieldOff, Fingerprint, ArrowRight } from "lucide-react";

const facts = [
  {
    icon: Timer,
    title: "24-hour default lifespan",
    body: "Every file is scheduled to fade away the moment it lands. No manual cleanup, nothing forgotten."
  },
  {
    icon: ShieldOff,
    title: "No accounts, no sessions",
    body: "There's nothing to sign into. Upload, get a link, share it, done."
  },
  {
    icon: Fingerprint,
    title: "Checksum deduplication",
    body: "Identical content is recognized by SHA-256 before storage — the same file is never kept twice."
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-14 sm:pt-20">
      <section className="mb-14 space-y-5 sm:mb-16">
        <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
          Files pass through.
          <br />
          <span className="text-bloom-strong">They don&apos;t stay.</span>
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-ink-soft">
          Drop a file, get a link, share it. Every upload quietly expires on a
          set timer — no accounts, no dashboards, nothing left behind.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-1">
          <Button size="lg" asChild>
            <Link href="/upload">
              Start uploading
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Link
            href="/docs"
            className="rounded-md text-sm font-medium text-ink-soft transition-colors duration-200 hover:text-bloom-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
          >
            Read the API docs
          </Link>
        </div>
      </section>

      <section className="mb-16 grid gap-4 sm:grid-cols-3">
        {facts.map((fact) => (
          <div
            key={fact.title}
            className="rounded-xl border border-line bg-paper p-5 shadow-soft"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-bloom-soft">
              <fact.icon className="h-4 w-4 text-bloom-strong" strokeWidth={1.75} />
            </div>
            <h3 className="mb-1.5 text-sm font-semibold text-ink">{fact.title}</h3>
            <p className="text-sm leading-relaxed text-ink-soft">{fact.body}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-line pt-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Network activity
        </h2>
        <LiveStats />
      </section>
    </div>
  );
}

