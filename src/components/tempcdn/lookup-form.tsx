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
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste a file ID..."
          aria-label="File ID"
          className="h-10 w-full rounded-full border border-line bg-paper pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-bloom focus:outline-none focus:ring-4 focus:ring-bloom/10"
        />
      </div>
      <Button type="submit" variant="secondary" disabled={!value.trim()}>
        Look up
      </Button>
    </form>
  );
}
