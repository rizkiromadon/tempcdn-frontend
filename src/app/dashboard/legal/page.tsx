"use client";

import { useCallback, useEffect, useState } from "react";
import { ScrollText, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/components/admin/admin-guard";
import {
  getAdminTerms,
  updateAdminTerms,
  getAdminPrivacy,
  updateAdminPrivacy,
  TempCdnError
} from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import type { AdminSession, LegalDocType, LegalDocument } from "@/types/tempcdn";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; doc: LegalDocument };

const TABS: Array<{ id: LegalDocType; label: string }> = [
  { id: "terms", label: "Terms of Service" },
  { id: "privacy", label: "Privacy Policy" }
];

function DocumentEditor({ session, docType }: { session: AdminSession; docType: LegalDocType }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const getFn = docType === "terms" ? getAdminTerms : getAdminPrivacy;
  const updateFn = docType === "terms" ? updateAdminTerms : updateAdminPrivacy;
  const label = docType === "terms" ? "terms of service" : "privacy policy";

  const refresh = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const doc = await getFn(session.token);
      setState({ status: "ready", doc });
      setContent(doc.content);
    } catch (err) {
      const message =
        err instanceof TempCdnError ? err.message : `Failed to load the ${label}`;
      setState({ status: "error", message });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token, docType]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isDirty = state.status === "ready" && state.doc.content !== content;

  function resetToSaved() {
    if (state.status !== "ready") return;
    setContent(state.doc.content);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!content.trim()) {
      setFormError("Content must not be empty.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateFn(session.token, { content });
      setState({ status: "ready", doc: updated });
      setContent(updated.content);
      toast.success(`${docType === "terms" ? "Terms of service" : "Privacy policy"} saved`);
    } catch (err) {
      const message = err instanceof TempCdnError ? err.message : `Failed to save the ${label}`;
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Content
        </span>
        {state.status === "ready" && (
          <span className="font-mono text-xs text-ink-faint">
            Updated {formatDate(state.doc.updated_at)}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {state.status === "loading" ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : state.status === "error" ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm text-ink-faint">{state.message}</p>
            <Button size="sm" variant="secondary" onClick={refresh}>
              Try again
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor={`${docType}-content`}
                className="mb-1.5 block text-xs font-medium text-ink-soft"
              >
                Document content
              </label>
              <textarea
                id={`${docType}-content`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={18}
                placeholder={`Write the ${label}…`}
                className="w-full resize-y rounded-lg border border-line bg-paper px-3 py-2.5 font-mono text-sm leading-relaxed text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
              />
              <p className="mt-1.5 text-xs text-ink-faint">
                Plain text. Rendered as-is (with line breaks preserved) on the public{" "}
                <code className="text-ink">/{docType}</code> page.
              </p>
            </div>

            {formError && (
              <p className={cn("text-sm text-coral", "animate-fade-in")}>{formError}</p>
            )}

            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <div className="text-xs text-ink-faint">
                {state.doc.updated_by && (
                  <span>Last changed by admin {state.doc.updated_by}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isDirty && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={resetToSaved}
                    disabled={saving}
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Discard changes
                  </Button>
                )}
                <Button type="submit" size="sm" disabled={saving || !isDirty}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

function LegalDocumentsContent({ session }: { session: AdminSession }) {
  const [activeTab, setActiveTab] = useState<LegalDocType>("terms");

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
            <ScrollText className="h-5 w-5 text-bloom-strong" strokeWidth={1.75} />
            Legal Documents
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Content shown on the public{" "}
            <code className="text-ink-soft">/terms</code> and{" "}
            <code className="text-ink-soft">/privacy</code> pages — changes apply immediately.
          </p>
        </div>
      </div>

      <div className="mb-5 inline-flex rounded-full border border-line bg-paper p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-medium transition-colors duration-200",
              activeTab === tab.id
                ? "bg-bloom-soft text-bloom-strong"
                : "text-ink-soft hover:text-ink"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <DocumentEditor key={activeTab} session={session} docType={activeTab} />
    </div>
  );
}

export default function LegalDocumentsPage() {
  return <AdminGuard>{(session) => <LegalDocumentsContent session={session} />}</AdminGuard>;
}
