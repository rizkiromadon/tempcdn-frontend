import type { Metadata } from "next";
import { UploadPanel } from "@/components/tempcdn/upload-panel";
import { LookupForm } from "@/components/tempcdn/lookup-form";
import { RecentDrops } from "@/components/tempcdn/recent-drops";

export const metadata: Metadata = {
  title: "Upload — TempCDN",
  description: "Drop a file, get a link back. Expires automatically on a fixed timer."
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-14 sm:pt-20">
      <section className="mb-10 space-y-3 sm:mb-12">
        <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
          Drop your files here.
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-ink-soft">
          Files upload straight to storage, no account needed. You&apos;ll get
          a link back immediately — share it before the timer runs out.
        </p>
      </section>

      <section className="mb-14">
        <UploadPanel />
      </section>

      <section className="mb-14 border-t border-line pt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            recent uploads on this device
          </h2>
        </div>
        <RecentDrops />
      </section>

      <section className="border-t border-line pt-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          already have a file id?
        </h2>
        <div className="max-w-md">
          <LookupForm />
        </div>
      </section>
    </div>
  );
}
