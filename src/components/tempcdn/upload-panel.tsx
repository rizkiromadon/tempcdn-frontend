"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { UploadDock } from "@/components/tempcdn/upload-dock";
import { UploadRow } from "@/components/tempcdn/upload-row";
import { uploadFile, TempCdnError } from "@/lib/api";
import { pushRecentEntry } from "@/lib/history";
import { useTempCdnConfig } from "@/lib/use-config";
import { validateFileAgainstConfig, formatBytes } from "@/lib/utils";
import type { UploadTask } from "@/types/tempcdn";
import { toast } from "sonner";

function makeClientId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const MAX_CONCURRENT_UPLOADS = 4;
const MAX_FILES_PER_DROP = 50;

interface UploadPanelProps {
  onUploaded?: () => void;
}

export function UploadPanel({ onUploaded }: UploadPanelProps) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const { config, loading: configLoading } = useTempCdnConfig();

  const abortersRef = useRef<Map<string, () => void>>(new Map());

  const pendingQueueRef = useRef<string[]>([]);
  const activeCountRef = useRef(0);
  const filesByClientIdRef = useRef<Map<string, File>>(new Map());

  const updateTask = useCallback((clientId: string, patch: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((t) => (t.clientId === clientId ? { ...t, ...patch } : t)));
  }, []);

  const runUpload = useCallback(
    (clientId: string, file: File) => {
      activeCountRef.current += 1;
      updateTask(clientId, { status: "uploading", error: undefined, progress: 0 });
      const { promise, abort } = uploadFile(file, (percent) => updateTask(clientId, { progress: percent }));
      abortersRef.current.set(clientId, abort);

      promise
        .then((result) => {
          updateTask(clientId, { status: "done", progress: 100, result });
          pushRecentEntry(result);
          onUploaded?.();
          if (result.duplicate) {
            toast.info("Already uploaded", {
              description: `${file.name} matched an existing file`
            });
          } else {
            toast.success("Upload complete", { description: file.name });
          }
        })
        .catch((err: unknown) => {
          const message = err instanceof TempCdnError ? err.message : "Upload failed unexpectedly";
          updateTask(clientId, { status: "error", error: message });
          toast.error("Upload failed", { description: `${file.name}: ${message}` });
        })
        .finally(() => {
          abortersRef.current.delete(clientId);
          filesByClientIdRef.current.delete(clientId);
          activeCountRef.current = Math.max(0, activeCountRef.current - 1);
          startNextRef.current();
        });
    },
    [updateTask, onUploaded]
  );

  const startNextRef = useRef<() => void>(() => {});

  const startNext = useCallback(() => {
    while (
      activeCountRef.current < MAX_CONCURRENT_UPLOADS &&
      pendingQueueRef.current.length > 0
    ) {
      const nextId = pendingQueueRef.current.shift();
      if (!nextId) break;
      const file = filesByClientIdRef.current.get(nextId);
      if (!file) continue;
      runUpload(nextId, file);
    }
  }, [runUpload]);

  startNextRef.current = startNext;

  const enqueue = useCallback(
    (clientId: string, file: File) => {
      filesByClientIdRef.current.set(clientId, file);
      pendingQueueRef.current.push(clientId);
      startNext();
    },
    [startNext]
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      let toAdd = files;
      if (files.length > MAX_FILES_PER_DROP) {
        toAdd = files.slice(0, MAX_FILES_PER_DROP);
        toast.warning("Too many files at once", {
          description: `Only the first ${MAX_FILES_PER_DROP} were queued — drop the rest separately.`
        });
      }

      const newTasks: UploadTask[] = toAdd.map((file) => ({
        clientId: makeClientId(),
        file,
        status: "queued",
        progress: 0
      }));

      setTasks((prev) => [...newTasks, ...prev]);

      newTasks.forEach((task) => {
        const validation = validateFileAgainstConfig(task.file, config);
        if (!validation.valid) {
          updateTask(task.clientId, { status: "error", error: validation.reason });
          toast.error("File rejected", { description: `${task.file.name}: ${validation.reason}` });
          return;
        }
        enqueue(task.clientId, task.file);
      });
    },
    [enqueue, updateTask, config]
  );

  function removeTask(clientId: string) {
    const abort = abortersRef.current.get(clientId);
    if (abort) {
      abort();
      abortersRef.current.delete(clientId);
    }
    pendingQueueRef.current = pendingQueueRef.current.filter((id) => id !== clientId);
    filesByClientIdRef.current.delete(clientId);
    setTasks((prev) => prev.filter((t) => t.clientId !== clientId));
  }

  function retryTask(clientId: string) {
    const task = tasks.find((t) => t.clientId === clientId);
    if (!task) return;
    const validation = validateFileAgainstConfig(task.file, config);
    if (!validation.valid) {
      updateTask(clientId, { status: "error", error: validation.reason });
      toast.error("File rejected", { description: `${task.file.name}: ${validation.reason}` });
      return;
    }
    updateTask(clientId, { status: "queued", error: undefined });
    enqueue(clientId, task.file);
  }

  const summary = useMemo(() => {
    if (tasks.length === 0) return null;
    const done = tasks.filter((t) => t.status === "done").length;
    const failed = tasks.filter((t) => t.status === "error").length;
    const active = tasks.length - done - failed;
    return { done, failed, active, total: tasks.length };
  }, [tasks]);

  const statusAnnouncement = useMemo(() => {
    if (!summary) return "";
    if (summary.active > 0) {
      return `Uploading ${summary.total - summary.active} of ${summary.total} files.`;
    }
    if (summary.total === 1) {
      return summary.failed > 0 ? "Upload failed." : "Upload complete.";
    }
    return `${summary.done} of ${summary.total} files uploaded${
      summary.failed ? `, ${summary.failed} failed` : ""
    }.`;
  }, [summary]);

  return (
    <div className="space-y-4">
      <UploadDock
        onFiles={handleFiles}
        maxSizeLabel={configLoading ? undefined : `up to ${formatBytes(config.max_upload_size_bytes)} per file`}
        acceptedMimeTypes={configLoading ? undefined : config.allowed_mime_types}
      />

      {}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {statusAnnouncement}
      </div>

      {tasks.length > 0 && (
        <div className="space-y-2 animate-fade-up">
          {summary && summary.total > 1 && (
            <div className="flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-2.5 animate-fade-up">
              <span className="text-xs text-ink-faint">
                {summary.active > 0
                  ? `uploading ${summary.total - summary.active}/${summary.total}`
                  : `${summary.done} uploaded${summary.failed ? `, ${summary.failed} failed` : ""}`}
              </span>
              <button
                onClick={() => {
                  abortersRef.current.forEach((abort) => abort());
                  abortersRef.current.clear();
                  pendingQueueRef.current = [];
                  filesByClientIdRef.current.clear();
                  setTasks([]);
                }}
                className="rounded-md text-xs font-medium text-ink-faint transition-all duration-150 hover:text-bloom-strong active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
              >
                clear list
              </button>
            </div>
          )}
          {tasks.map((task) => (
            <UploadRow key={task.clientId} task={task} onRemove={removeTask} onRetry={retryTask} />
          ))}
        </div>
      )}
    </div>
  );
}
