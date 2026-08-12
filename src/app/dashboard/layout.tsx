import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminFooter } from "@/components/admin/admin-footer";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminSidebarProvider } from "@/lib/use-admin-sidebar";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false }
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminSidebarProvider>
      <div className="flex min-h-svh">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader />
          <main id="main-content" className="relative z-0 flex-1">
            {children}
          </main>
          <AdminFooter />
        </div>
      </div>
    </AdminSidebarProvider>
  );
}
