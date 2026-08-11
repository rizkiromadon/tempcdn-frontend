"use client";

import { useCallback, useEffect, useState } from "react";
import { SlidersHorizontal, Plus, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminGuard } from "@/components/admin/admin-guard";
import { getUploadSettings, updateUploadSettings, TempCdnError } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import type { AdminSession, UploadSettings } from "@/types/tempcdn";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; settings: UploadSettings };

/**
 * A labeled list of short string values (MIME patterns or extensions) that
 * can be added via the text input + Enter/button, or removed by clicking
 * the × on a chip. Deliberately bespoke rather than a new dependency,
 * matching the project's existing "no dialog primitive, build small
 * one-off UI" approach (see api-keys/page.tsx's Overlay).
 */
function TagListEditor({
  label,
  helpText,
  placeholder,
  values,
  onChange
}: {
  label: string;
  helpText: string;
  placeholder: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  function commitDraft() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    if (values.includes(trimmed)) {
      setDraft("");
      return;
    }
    onChange([...values, trimmed]);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitDraft();
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      // Backspacing on an empty input removes the last chip, mirroring the
      // common "chip input" convention (Gmail recipients, etc.) so removal
      // doesn't always require reaching for the mouse.
      onChange(values.slice(0, -1));
    }
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-ink-soft">{label}</label>
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5 focus-within:ring-4 focus-within:ring-bloom/15">
        {values.map((value, i) => (
          <span
            key={`${value}-${i}`}
            className="inline-flex items-center gap-1 rounded-full border border-line bg-paper-sunk py-0.5 pl-2.5 pr-1 font-mono text-xs text-ink"
          >
            {value}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove ${value}`}
              className="rounded-full p-0.5 text-ink-faint transition-colors hover:bg-line hover:text-ink"
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={values.length === 0 ? placeholder : ""}
          className="h-7 min-w-[8rem] flex-1 bg-transparent px-1 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none"
        />
        {draft.trim() && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={commitDraft}
            aria-label="Add"
            className="h-7 w-7 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        )}
      </div>
      <p className="mt-1.5 text-xs text-ink-faint">{helpText}</p>
    </div>
  );
}

function UploadSettingsContent({ session }: { session: AdminSession }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // Form fields, only meaningful once state.status === "ready". Kept
  // separate from `state.settings` so edits don't require re-deriving the
  // loaded state on every keystroke, and so "has this changed from what's
  // saved" (isDirty below) is a simple comparison against the last-loaded
  // snapshot.
  const [maxSizeMB, setMaxSizeMB] = useState("");
  const [allowedMimeTypes, setAllowedMimeTypes] = useState<string[]>([]);
  const [blockedExtensions, setBlockedExtensions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const settings = await getUploadSettings(session.token);
      setState({ status: "ready", settings });
      setMaxSizeMB(String(settings.max_upload_size_mb));
      setAllowedMimeTypes(settings.allowed_mime_types);
      setBlockedExtensions(settings.blocked_extensions);
    } catch (err) {
      const message =
        err instanceof TempCdnError ? err.message : "Failed to load upload settings";
      setState({ status: "error", message });
    }
  }, [session.token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isDirty =
    state.status === "ready" &&
    (String(state.settings.max_upload_size_mb) !== maxSizeMB ||
      JSON.stringify(state.settings.allowed_mime_types) !== JSON.stringify(allowedMimeTypes) ||
      JSON.stringify(state.settings.blocked_extensions) !== JSON.stringify(blockedExtensions));

  function resetToSaved() {
    if (state.status !== "ready") return;
    setMaxSizeMB(String(state.settings.max_upload_size_mb));
    setAllowedMimeTypes(state.settings.allowed_mime_types);
    setBlockedExtensions(state.settings.blocked_extensions);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsedSize = Number(maxSizeMB);
    if (!Number.isFinite(parsedSize) || parsedSize <= 0) {
      setFormError("Max upload size must be a positive number.");
      return;
    }
    if (allowedMimeTypes.length === 0) {
      setFormError("Add at least one allowed MIME type — an empty list would reject every upload.");
      return;
    }
    const badExtension = blockedExtensions.find((ext) => !ext.startsWith("."));
    if (badExtension) {
      setFormError(`"${badExtension}" must start with a "." (e.g. ".exe").`);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateUploadSettings(session.token, {
        max_upload_size_mb: Math.trunc(parsedSize),
        allowed_mime_types: allowedMimeTypes,
        blocked_extensions: blockedExtensions
      });
      setState({ status: "ready", settings: updated });
      setMaxSizeMB(String(updated.max_upload_size_mb));
      setAllowedMimeTypes(updated.allowed_mime_types);
      setBlockedExtensions(updated.blocked_extensions);
      toast.success("Upload settings saved");
    } catch (err) {
      const message =
        err instanceof TempCdnError ? err.message : "Failed to save upload settings";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-8 sm:py-10">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
            <SlidersHorizontal className="h-5 w-5 text-bloom-strong" strokeWidth={1.75} />
            Upload Settings
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            Limits enforced on every upload — changes apply immediately, no redeploy required.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Limits
          </span>
          {state.status === "ready" && (
            <span className="font-mono text-xs text-ink-faint">
              Updated {formatDate(state.settings.updated_at)}
            </span>
          )}
        </CardHeader>
        <CardContent>
          {state.status === "loading" ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
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
                  htmlFor="max-size"
                  className="mb-1.5 block text-xs font-medium text-ink-soft"
                >
                  Max upload size (MB)
                </label>
                <input
                  id="max-size"
                  type="number"
                  min={1}
                  max={10240}
                  step={1}
                  inputMode="numeric"
                  value={maxSizeMB}
                  onChange={(e) => setMaxSizeMB(e.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-paper px-3 text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
                />
                <p className="mt-1.5 text-xs text-ink-faint">
                  Positive integer, up to 10240 MB (10 GiB).
                </p>
              </div>

              <TagListEditor
                label="Allowed MIME types"
                placeholder="e.g. image/*, application/pdf"
                helpText='Supports "type/*" wildcards. Must contain at least one entry.'
                values={allowedMimeTypes}
                onChange={setAllowedMimeTypes}
              />

              <TagListEditor
                label="Blocked extensions"
                placeholder="e.g. .exe, .bat"
                helpText={`Each entry must start with "." — matched both as the file's final extension and as a substring earlier in the filename (e.g. "evil.exe.png" is also blocked). May be left empty.`}
                values={blockedExtensions}
                onChange={setBlockedExtensions}
              />

              {formError && (
                <p className={cn("text-sm text-coral", "animate-fade-in")}>{formError}</p>
              )}

              <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
                <div className="text-xs text-ink-faint">
                  {state.settings.updated_by && (
                    <span>Last changed by admin {state.settings.updated_by}</span>
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
    </div>
  );
}

export default function UploadSettingsPage() {
  return <AdminGuard>{(session) => <UploadSettingsContent session={session} />}</AdminGuard>;
}
