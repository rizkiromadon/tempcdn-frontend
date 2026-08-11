import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found — TempCDN",
  description: "The page you're looking for doesn't exist or may have moved.",
  robots: { index: false, follow: true }
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 pb-24 pt-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-soft">
        <AlertTriangle className="h-5 w-5 text-amber" />
      </div>
      <h1 className="font-display text-lg font-semibold text-ink">
        This page doesn&apos;t exist
      </h1>
      <p className="text-sm text-ink-soft">
        The page you&apos;re looking for never made it here.
      </p>
      <Button asChild variant="secondary" size="sm">
        <Link href="/">Back home</Link>
      </Button>
    </div>
  );
}
