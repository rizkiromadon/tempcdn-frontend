import Link from "next/link";
import { Wind, Terminal, Infinity as InfinityIcon } from "lucide-react";

const productLinks = [
  { href: "/upload", label: "Upload a file" },
  { href: "/docs", label: "API docs" },
  { href: "/docs#config", label: "Upload limits" }
];

const developerLinks = [
  { href: "/docs#upload", label: "POST /upload" },
  { href: "/docs#file-info", label: "GET /files/{id}" },
  { href: "/docs#file-delete", label: "DELETE /files/{id}" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bloom-soft text-bloom-strong transition-colors duration-200 group-hover:bg-bloom group-hover:text-white">
                <Wind className="h-4 w-4" strokeWidth={2.25} />
              </div>
              <span className="font-display text-sm font-bold text-ink">TempCDN</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
              A simple way to move files from one place to another — drop
              something in, get a link back, and let it expire on its own.
              No accounts, no pricing tiers, free for good.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-sage">
              <InfinityIcon className="h-3.5 w-3.5" strokeWidth={2} />
              Free forever, no plans to change that
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Product
            </h3>
            <ul className="space-y-2.5">
              {productLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-soft transition-colors duration-200 hover:text-bloom-strong"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              For developers
            </h3>
            <ul className="space-y-2.5">
              {developerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-flex items-center gap-1.5 font-mono text-[13px] text-ink-soft transition-colors duration-200 hover:text-bloom-strong"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              How it works
            </h3>
            <ul className="space-y-2.5 text-sm text-ink-soft">
              <li>Files expire automatically on a fixed timer</li>
              <li>Identical files are deduplicated by checksum</li>
              <li>Traffic is load-balanced across multiple nodes</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} TempCDN. Files pass through — they don&apos;t stay.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 text-xs text-ink-soft transition-colors duration-200 hover:text-bloom-strong"
            >
              <Terminal className="h-3.5 w-3.5" strokeWidth={2} />
              REST API, no auth required
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
