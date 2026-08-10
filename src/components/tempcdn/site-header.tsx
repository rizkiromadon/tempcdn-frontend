import Link from "next/link";
import { Wind } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-mist/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-bloom-soft text-bloom-strong transition-colors duration-200 group-hover:bg-bloom group-hover:text-white">
            <Wind className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display text-sm font-bold text-ink">TempCDN</span>
            <span className="hidden text-[11px] text-ink-faint sm:inline">
              files that pass through
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/upload"
            className="rounded-md text-sm text-ink-soft transition-colors duration-200 hover:text-bloom-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
          >
            Upload
          </Link>
          <Link
            href="/docs"
            className="rounded-md text-sm text-ink-soft transition-colors duration-200 hover:text-bloom-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
          >
            API docs
          </Link>
        </nav>
      </div>
    </header>
  );
}

