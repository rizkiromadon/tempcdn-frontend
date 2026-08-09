import type { Metadata } from "next";
import { UploadPanel } from "@/components/tempcdn/upload-panel";
import { LookupForm } from "@/components/tempcdn/lookup-form";
import { RecentDrops } from "@/components/tempcdn/recent-drops";

export const metadata: Metadata = {
  title: "Upload — TempCDN",
  description: "Drop a file, get a CDN link. Burns down on a fixed timer."
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:pt-14">
      <section className="mb-10 space-y-3 sm:mb-12">
        <h1 className="max-w-2xl font-mono text-[1.75rem] font-bold leading-tight text-bone sm:text-4xl">
          Drop it on the dock.
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-bone-dim">
          Files upload straight to storage, no account needed. You&apos;ll get
          a CDN link back immediately — share it before the timer runs out.
        </p>
      </section>

      <section className="mb-14">
        <UploadPanel />
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
