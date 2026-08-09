"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LookupForm() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const id = value.trim();
    if (!id) return;
    router.push(`/files/${id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-bone-faint" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="paste a file id..."
          aria-label="File ID"
          className="h-10 w-full border border-steel bg-void pl-9 pr-3 font-mono text-xs text-bone placeholder:text-bone-faint focus:border-hazard focus:outline-none"
        />
      </div>
      <Button type="submit" variant="secondary" disabled={!value.trim()}>
        look up
      </Button>
    </form>
  );
}
