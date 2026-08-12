import Link from "next/link";
import Image from "next/image";
import { Terminal, Infinity as InfinityIcon } from "lucide-react";

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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_HOST = (() => {
  try {
    return new URL(SITE_URL).host;
  } catch {
    return "localhost:3000";
  }
})();
const CONTACT_EMAIL = `hello@${SITE_HOST.replace(/^www\./, "")}`;

const projectLinks = [
  { href: "https://github.com/tempcdn/tempcdn", label: "Source on GitHub" },
  { href: `mailto:${CONTACT_EMAIL}`, label: CONTACT_EMAIL }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <Image
                src="/icons/logo-mark.png"
                alt="TempCDN logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-display text-sm font-bold text-ink">TempCDN</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
              We built TempCDN because we kept needing somewhere to dump a
              build artifact or a one-off file without spinning up an
              account first. It&apos;s stayed a small, free tool ever since.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-sage">
              <InfinityIcon className="h-3.5 w-3.5" strokeWidth={2} />
              No pricing page, never will be
            </div>
          </div>

          <nav aria-labelledby="footer-product-heading">
            <h3 id="footer-product-heading" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
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
          </nav>

          <nav aria-labelledby="footer-developers-heading">
            <h3 id="footer-developers-heading" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
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
          </nav>

          <nav aria-labelledby="footer-project-heading">
            <h3 id="footer-project-heading" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Project
            </h3>
            <ul className="space-y-2.5">
              {projectLinks.map((link) => (
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
          </nav>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} TempCDN. Built and run by a couple of people who wanted this to exist.
          </p>
          <div className="flex items-center gap-5">
            <Link
              href="/docs"
              className="inline-flex items-center gap-1.5 text-xs text-ink-soft transition-colors duration-200 hover:text-bloom-strong"
            >
              <Terminal className="h-3.5 w-3.5" strokeWidth={2} />
              API docs
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
