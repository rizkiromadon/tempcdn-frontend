import type { Metadata } from "next";
import Link from "next/link";
import { UploadPanel } from "@/components/tempcdn/upload-panel";
import { LookupForm } from "@/components/tempcdn/lookup-form";
import { RecentDrops } from "@/components/tempcdn/recent-drops";

const TITLE = "Upload a File Free — Instant Share Link, No Account";
const DESCRIPTION =
  "Upload any file for free and get a shareable download link instantly. No account, no sign-up, and no credit card — files expire automatically on a fixed timer.";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/upload" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/upload"
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION
  }
};

const BREADCRUMB_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
    { "@type": "ListItem", position: 2, name: "Upload", item: `${SITE_URL}/upload` }
  ]
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-14 sm:pt-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB_JSON_LD) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-xs text-ink-faint">
          <li>
            <Link href="/" className="transition-colors duration-200 hover:text-bloom-strong">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink-soft">
            Upload
          </li>
        </ol>
      </nav>
      <section className="mb-10 space-y-3 sm:mb-12">
        <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
          Upload a file, get a temporary share link.
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-ink-soft">
          Files upload straight to storage, no account needed. You&apos;ll get
          a self-destructing download link back immediately — share it
          before the expiry timer runs out.
        </p>
      </section>

      <section className="mb-14">
        <UploadPanel />
      </section>

      <section className="mb-14 max-w-2xl text-sm leading-relaxed text-ink-soft">
        <p>
          This upload tool works the same as the TempCDN API: drop a file
          here and it&apos;s stored anonymously with an automatic expiry, no
          different from calling <code className="text-ink">POST /upload</code>{" "}
          directly. If you&apos;d rather script your uploads or wire file
          sharing into a CI job, the same free file hosting endpoint is
          documented on the <Link href="/docs" className="text-bloom-strong underline-offset-2 hover:underline">API docs page</Link>.
        </p>
      </section>

      <section className="mb-14 border-t border-line pt-10">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          recent uploads on this device
        </h2>
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
