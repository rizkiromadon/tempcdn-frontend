"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getTerms, getPrivacy, TempCdnError } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import type { LegalDocType, LegalDocument } from "@/types/tempcdn";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; doc: LegalDocument };

const DOC_META: Record<
  LegalDocType,
  { label: string; breadcrumb: string; icon: React.ElementType; kicker: string }
> = {
  terms: {
    label: "Terms of Service",
    breadcrumb: "Terms",
    icon: FileText,
    kicker: "legal"
  },
  privacy: {
    label: "Privacy Policy",
    breadcrumb: "Privacy",
    icon: ShieldCheck,
    kicker: "legal"
  }
};

export function LegalDocumentView({ docType }: { docType: LegalDocType }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const meta = DOC_META[docType];
  const Icon = meta.icon;

  const refresh = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const doc = docType === "terms" ? await getTerms() : await getPrivacy();
      setState({ status: "ready", doc });
    } catch (err) {
      const message =
        err instanceof TempCdnError ? err.message : `Failed to load the ${meta.label.toLowerCase()}`;
      setState({ status: "error", message });
    }
  }, [docType, meta.label]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="mx-auto max-w-3xl px-5 pb-24 pt-14 sm:pt-20">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-1.5 text-xs text-ink-faint">
          <li>
            <Link href="/" className="transition-colors duration-200 hover:text-bloom-strong">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink-soft">
            {meta.breadcrumb}
          </li>
        </ol>
      </nav>

      <section className="mb-10 space-y-4 sm:mb-12">
        <div className="flex items-center gap-2 text-bloom-strong">
          <Icon className="h-4 w-4" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-wide">{meta.kicker}</span>
        </div>
        <h1 className="font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
          {meta.label}
        </h1>
        {state.status === "ready" && (
          <p className="font-mono text-xs text-ink-faint">
            Last updated {formatDate(state.doc.updated_at)}
          </p>
        )}
      </section>

      {state.status === "loading" ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : state.status === "error" ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-paper py-12 text-center">
          <p className="text-sm text-ink-faint">{state.message}</p>
          <Button size="sm" variant="secondary" onClick={refresh}>
            Try again
          </Button>
        </div>
      ) : (
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-soft">
          {state.doc.content}
        </div>
      )}
    </div>
  );
}
