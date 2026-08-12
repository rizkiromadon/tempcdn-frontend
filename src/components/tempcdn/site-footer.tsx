import Link from "next/link";
import Image from "next/image";
import { Terminal, Infinity as InfinityIcon } from "lucide-react";

const productLinks = [
  { href: "/upload", label: "Upload a file" },
  { href: "/docs#config", label: "Upload limits & retention" },
  { href: "/docs", label: "API documentation" }
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

const connectLinks = [
  { href: "https://github.com/tempcdn/tempcdn", label: "Source on GitHub" },
  { href: `mailto:${CONTACT_EMAIL}`, label: "Contact us" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div className="space-y-3">
            <Link href="/" className="group flex items-center gap-2.5">
              <Image
                src="/icons/logo-mark.svg"
                alt="TempCDN logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full transition-transform duration-200 group-hover:scale-105"
              />
              <span className="font-display text-sm font-bold text-ink">TempCDN</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-ink-soft">
              A lightweight file hosting service for developers who need to
              share a build artifact, asset, or one-off file quickly —
              no account required.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-xs font-medium text-sage">
              <InfinityIcon className="h-3.5 w-3.5" strokeWidth={2} />
              Free to use, no hidden tiers
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
                    className="inline-flex items-center gap-1.5 text-sm text-ink-soft transition-colors duration-200 hover:text-bloom-strong"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-connect-heading">
            <h3 id="footer-connect-heading" className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Connect
            </h3>
            <ul className="space-y-2.5">
              {connectLinks.map((link) => (
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

        <div className="mt-10 flex items-center border-t border-line pt-6">
          <p className="text-xs text-ink-faint">
            © {new Date().getFullYear()} TempCDN. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
