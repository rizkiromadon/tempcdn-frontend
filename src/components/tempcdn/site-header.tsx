import Link from "next/link";
import { Radio } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="relative z-10 border-b border-steel-dim bg-surface/90 backdrop-blur">
      <div className="h-1 w-full bg-hazard-stripes" />
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link href="/" className="group flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-steel bg-void text-hazard transition-colors group-hover:border-hazard">
            <Radio className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-mono text-sm font-bold uppercase tracking-widest text-bone">
              TempCDN
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-bone-faint sm:inline">
              transit storage / self-destructs
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/upload"
            className="font-mono text-xs uppercase tracking-widest text-bone-dim transition-colors hover:text-hazard"
          >
            Upload
          </Link>
          <Link
            href="/docs"
            className="font-mono text-xs uppercase tracking-widest text-bone-dim transition-colors hover:text-hazard"
          >
            API Docs
          </Link>
        </nav>
      </div>
    </header>
  );
}
