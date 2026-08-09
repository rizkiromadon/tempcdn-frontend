import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-5 pb-24 pt-24 text-center">
      <AlertTriangle className="h-6 w-6 text-hazard" />
      <h1 className="font-mono text-lg font-semibold text-bone">
        this route doesn&apos;t exist
      </h1>
      <p className="text-xs text-bone-dim">
        the page you&apos;re looking for was never on the dock.
      </p>
      <Button asChild variant="secondary" size="sm">
        <Link href="/">back home</Link>
      </Button>
    </div>
  );
}
