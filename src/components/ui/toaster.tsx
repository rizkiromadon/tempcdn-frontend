"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "bg-surface-raised border border-steel text-bone font-mono text-xs rounded-none shadow-panel",
          title: "text-bone font-semibold",
          description: "text-bone-dim",
          actionButton: "bg-hazard text-void",
          cancelButton: "bg-steel-dim text-bone-dim",
          error: "border-rust/50",
          success: "border-signal/50"
        }
      }}
    />
  );
}
