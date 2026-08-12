import Link from "next/link";

export function AdminFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
        <p>TempCDN admin dashboard.</p>
        <Link href="/" className="text-ink-soft transition-colors duration-200 hover:text-bloom-strong">
          ← Back to the public site
        </Link>
      </div>
    </footer>
  );
}
