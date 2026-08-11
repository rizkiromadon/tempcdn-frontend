import { SiteHeader } from "@/components/tempcdn/site-header";
import { SiteFooter } from "@/components/tempcdn/site-footer";

/**
 * Layout for every public-facing page (home, /upload, /docs, /files/[id]).
 * Scoped to this route group so /dashboard (outside (site)) gets its own
 * AdminHeader/AdminFooter instead - see app/dashboard/layout.tsx.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" className="relative z-0 flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
