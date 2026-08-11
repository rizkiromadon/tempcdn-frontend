import type { Metadata } from "next";
import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin Login | TempCDN",
  robots: { index: false, follow: false }
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col justify-center px-5 py-20 sm:py-28">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl font-bold text-ink">Admin dashboard</h1>
        <p className="mt-1.5 text-sm text-ink-soft">Sign in with your admin credentials.</p>
      </div>
      <Card>
        <CardHeader className="border-b-0 pb-0">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Log in
          </span>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
