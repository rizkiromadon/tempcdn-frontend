"use client";

import { useCallback, useMemo, useState } from "react";
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

interface UploadPanelProps {
  onUploaded?: () => void;
}

export function UploadPanel({ onUploaded }: UploadPanelProps) {
  const [tasks, setTasks] = useState<UploadTask[]>([]);
  const { config, loading: configLoading } = useTempCdnConfig();

  const updateTask = useCallback((clientId: string, patch: Partial<UploadTask>) => {
    setTasks((prev) => prev.map((t) => (t.clientId === clientId ? { ...t, ...patch } : t)));
  }, []);

  const runUpload = useCallback(
    (clientId: string, file: File) => {
      updateTask(clientId, { status: "uploading", error: undefined, progress: 0 });
      const { promise } = uploadFile(file, (percent) => updateTask(clientId, { progress: percent }));

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
        });
    },
    [updateTask, onUploaded]
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      const newTasks: UploadTask[] = files.map((file) => ({
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
        runUpload(task.clientId, task.file);
      });
    },
    [runUpload, updateTask, config]
  );

  function removeTask(clientId: string) {
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
    runUpload(clientId, task.file);
  }

  const summary = useMemo(() => {
    if (tasks.length === 0) return null;
    const done = tasks.filter((t) => t.status === "done").length;
    const failed = tasks.filter((t) => t.status === "error").length;
    const active = tasks.length - done - failed;
    return { done, failed, active, total: tasks.length };
  }, [tasks]);

  return (
    <div className="space-y-4">
      <UploadDock
        onFiles={handleFiles}
        maxSizeLabel={configLoading ? undefined : `up to ${formatBytes(config.max_upload_size_bytes)} per file`}
      />

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
                onClick={() => setTasks([])}
                className="text-xs font-medium text-ink-faint transition-all duration-150 hover:text-bloom-strong active:scale-95"
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
