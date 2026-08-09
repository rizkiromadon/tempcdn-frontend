"use client";

import { useCallback, useState } from "react";
import { UploadDock } from "@/components/tempcdn/upload-dock";
import { UploadRow } from "@/components/tempcdn/upload-row";
import { uploadFile, TempCdnError } from "@/lib/api";
import type { UploadTask } from "@/types/tempcdn";
import { toast } from "sonner";

function makeClientId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function UploadPanel() {
  const [tasks, setTasks] = useState<UploadTask[]>([]);

  const updateTask = useCallback((clientId: string, patch: Partial<UploadTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.clientId === clientId ? { ...t, ...patch } : t))
    );
  }, []);

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
        updateTask(task.clientId, { status: "uploading" });
        const { promise } = uploadFile(task.file, (percent) =>
          updateTask(task.clientId, { progress: percent })
        );

        promise
          .then((result) => {
            updateTask(task.clientId, { status: "done", progress: 100, result });
            if (result.duplicate) {
              toast.info("Already on the dock", {
                description: `${task.file.name} matched an existing file`
              });
            } else {
              toast.success("Upload complete", { description: task.file.name });
            }
          })
          .catch((err: unknown) => {
            const message =
              err instanceof TempCdnError ? err.message : "Upload failed unexpectedly";
            updateTask(task.clientId, { status: "error", error: message });
            toast.error("Upload failed", { description: `${task.file.name}: ${message}` });
          });
      });
    },
    [updateTask]
  );

  function removeTask(clientId: string) {
    setTasks((prev) => prev.filter((t) => t.clientId !== clientId));
  }

  return (
    <div className="space-y-4">
      <UploadDock onFiles={handleFiles} />

      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((task) => (
            <UploadRow key={task.clientId} task={task} onRemove={removeTask} />
          ))}
        </div>
      )}
    </div>
  );
}
