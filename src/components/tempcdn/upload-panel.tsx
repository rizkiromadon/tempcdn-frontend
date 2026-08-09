"use client";

import { useCallback, useMemo, useState } from "react";
import { UploadDock } from "@/components/tempcdn/upload-dock";
import { UploadRow } from "@/components/tempcdn/upload-row";
import { uploadFile, TempCdnError } from "@/lib/api";
import { pushRecentEntry } from "@/lib/history";
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
            toast.info("Already on the dock", {
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
      newTasks.forEach((task) => runUpload(task.clientId, task.file));
    },
    [runUpload]
  );

  function removeTask(clientId: string) {
    setTasks((prev) => prev.filter((t) => t.clientId !== clientId));
  }

  function retryTask(clientId: string) {
    const task = tasks.find((t) => t.clientId === clientId);
    if (task) runUpload(clientId, task.file);
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
      <UploadDock onFiles={handleFiles} />

      {tasks.length > 0 && (
        <div className="space-y-2">
          {summary && summary.total > 1 && (
            <div className="flex items-center justify-between border border-steel-dim bg-surface px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-bone-faint">
                {summary.active > 0
                  ? `uploading ${summary.total - summary.active}/${summary.total}`
                  : `${summary.done} stored${summary.failed ? `, ${summary.failed} failed` : ""}`}
              </span>
              <button
                onClick={() => setTasks([])}
                className="font-mono text-[10px] uppercase tracking-wide text-bone-faint transition-colors hover:text-hazard"
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
