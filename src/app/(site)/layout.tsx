import { SiteHeader } from "@/components/tempcdn/site-header";
import { SiteFooter } from "@/components/tempcdn/site-footer";

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
