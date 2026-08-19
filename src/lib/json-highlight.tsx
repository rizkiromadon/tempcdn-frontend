import type { ReactNode } from "react";

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
  if (isKey) return "text-ink font-medium";
  if (token.startsWith('"')) return "text-ink-soft";
  if (token === "true" || token === "false") return "text-ink";
  if (token === "null") return "text-ink-faint";
  return "text-ink-soft";
}

export function looksLikeJson(source: string): boolean {
  const trimmed = source.trim();
  return (
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"))
  );
}
