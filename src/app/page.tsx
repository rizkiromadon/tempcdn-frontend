import { UploadPanel } from "@/components/tempcdn/upload-panel";
import { LookupForm } from "@/components/tempcdn/lookup-form";
import { RecentDrops } from "@/components/tempcdn/recent-drops";
import { Timer, ShieldOff, Fingerprint } from "lucide-react";

const facts = [
  {
    icon: Timer,
    title: "24-hour default TTL",
    body: "Every object is scheduled for deletion the moment it lands. No manual cleanup, no forgotten files."
  },
  {
    icon: ShieldOff,
    title: "No accounts, no sessions",
    body: "There's nothing to sign into. Upload, get a link, share it, done."
  },
  {
    icon: Fingerprint,
    title: "Checksum deduplication",
    body: "Identical content is detected by SHA-256 before storage — the same file never occupies the dock twice."
  }
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:pt-14">
      <section className="mb-10 space-y-4 sm:mb-12">
        <h1 className="max-w-2xl font-mono text-[1.75rem] font-bold leading-tight text-bone sm:text-4xl">
          Files pass through.
          <br />
          <span className="text-hazard">They don&apos;t stay.</span>
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-bone-dim">
          Drop a file, get a CDN link, share it. Every upload burns down on a
          fixed timer — no accounts, no dashboards to manage, nothing left
          behind after expiry.
        </p>
      </section>

      <section className="mb-14">
        <UploadPanel />
      </section>

      <section className="mb-14 grid gap-3 sm:grid-cols-3">
        {facts.map((fact) => (
          <div key={fact.title} className="border border-steel-dim bg-surface p-4">
            <fact.icon className="mb-3 h-4 w-4 text-hazard" strokeWidth={1.75} />
            <h3 className="mb-1.5 font-mono text-xs font-semibold uppercase tracking-wide text-bone">
              {fact.title}
            </h3>
            <p className="text-xs leading-relaxed text-bone-dim">{fact.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-14 border-t border-steel-dim pt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-widest text-bone-faint">
            recent drops on this device
          </h2>
        </div>
        <RecentDrops />
      </section>

      <section className="border-t border-steel-dim pt-8">
        <h2 className="mb-3 font-mono text-xs font-semibold uppercase tracking-widest text-bone-faint">
          already have a file id?
        </h2>
        <div className="max-w-md">
          <LookupForm />
        </div>
      </section>
    </div>
  );
}
