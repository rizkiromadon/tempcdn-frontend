"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="light"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "bg-paper border border-line text-ink text-sm rounded-xl shadow-lifted",
          title: "text-ink font-semibold",
          description: "text-ink-soft",
          actionButton: "bg-bloom text-black",
          cancelButton: "bg-paper-sunk text-ink-soft",
          error: "border-coral/40",
          success: "border-sage/40"
        }
      }}
    />
  );
}
