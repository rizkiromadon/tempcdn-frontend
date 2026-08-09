import type { ReactNode } from "react";

/**
 * Minimal, dependency-free JSON syntax highlighter.
 *
 * Tokenizes a JSON string with a single regex pass and wraps each token
 * in a span colored to match the app's soft-modern palette
 * palette (see tailwind.config.ts). Falls back to plain text for anything
 * that isn't valid-looking JSON (e.g. curl commands), so it's safe to run
 * on any CodeBlock content.
 */

const TOKEN_RE =
  /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b-?\d+(\.\d+)?([eE][+-]?\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)/g;

export function highlightJson(source: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  TOKEN_RE.lastIndex = 0;
  while ((match = TOKEN_RE.exec(source)) !== null) {
    const [token] = match;
    const start = match.index;

    if (start > lastIndex) {
      nodes.push(source.slice(lastIndex, start));
    }

    nodes.push(
      <span key={key++} className={classForToken(token)}>
        {token}
      </span>
    );

    lastIndex = start + token.length;
  }

  if (lastIndex < source.length) {
    nodes.push(source.slice(lastIndex));
  }

  return nodes;
}

function classForToken(token: string): string {
  const isKey = token.startsWith('"') && /:\s*$/.test(token);
  if (isKey) return "text-sky-300";
  if (token.startsWith('"')) return "text-amber-200";
  if (token === "true" || token === "false") return "text-rose-300";
  if (token === "null") return "text-white/40";
  return "text-emerald-300"; // numbers
}

/** Quick heuristic: does this string look like a JSON object/array? */
export function looksLikeJson(source: string): boolean {
  const trimmed = source.trim();
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  );
}
