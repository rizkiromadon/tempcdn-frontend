import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFooter } from "@/components/admin/admin-footer";

export const metadata: Metadata = {
  title: "Admin Dashboard | TempCDN",
  robots: { index: false, follow: false }
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AdminHeader />
      <main id="main-content" className="relative z-0 flex-1">
        {children}
      </main>
      <AdminFooter />
    </>
  );
}
