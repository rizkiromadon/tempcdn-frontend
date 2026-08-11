import Link from "next/link";
import { LiveStats } from "@/components/tempcdn/live-stats";
import { AdvantageBelt } from "@/components/tempcdn/advantage-belt";
import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal, Infinity as InfinityIcon, Radio } from "lucide-react";
import { getApiBases } from "@/lib/api";

export default async function HomePage() {
  const bases = await getApiBases();
  const uploadUrl = `${bases[0]}/upload`;
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-14 sm:pb-20 sm:pt-20">
          <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-sage/30 bg-sage-soft px-3 py-1 text-xs font-medium text-sage">
            <InfinityIcon className="h-3.5 w-3.5" strokeWidth={2} />
            Free forever — no plans, no card required
          </div>

          <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
            Files pass through.
            <br />
            <span className="text-bloom-strong">They don&apos;t stay.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-ink-soft">
            Drop a file, get a link, share it. TempCDN deletes the upload
            automatically once its timer runs out, so you don&apos;t have
            to remember to clean up after yourself. Works fine from a
            browser tab, and just as well from a curl command in a CI job.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Button size="lg" asChild>
              <Link href="/upload">
                Start uploading
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-ink-soft transition-colors duration-200 hover:text-bloom-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
            >
              <Terminal className="h-3.5 w-3.5" strokeWidth={2} />
              Read the API docs
            </Link>
          </div>

          <div className="mt-10 max-w-lg overflow-hidden rounded-xl border border-line bg-ink shadow-soft">
            <div className="flex items-center gap-1.5 border-b border-white/10 px-3.5 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-coral/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-sage/70" />
              <span className="ml-2 font-mono text-[10px] uppercase tracking-wide text-white/40">
                one request, no api key
              </span>
            </div>
            <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed text-white/80">
              <code>
                <span className="text-white/40"># any node in the pool works — requests round-robin automatically</span>
                {"\n"}
                curl -F file=@release.tar.gz {uploadUrl}
              </code>
            </pre>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="mb-16 sm:mb-20">
        <div className="mx-auto max-w-5xl px-5">
          <h2 className="mb-1 font-display text-xl font-bold text-ink sm:text-2xl">
            What you get
          </h2>
          <p className="mb-6 max-w-lg text-sm leading-relaxed text-ink-soft">
            Nothing fancy — just the parts that matter when you need to
            hand a file off and move on.
          </p>
        </div>
        <AdvantageBelt />
      </section>

      {/* Stats */}
      <section className="mx-auto max-w-5xl border-t border-line px-5 pt-10 pb-24">
        <div className="mb-5 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sage opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sage" />
          </span>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            What&apos;s happening on the network
          </h2>
          <span className="inline-flex items-center gap-1 text-[11px] text-ink-faint">
            <Radio className="h-3 w-3" strokeWidth={2} />
            refreshes on its own
          </span>
        </div>
        <LiveStats />
      </section>
    </div>
  );
}
