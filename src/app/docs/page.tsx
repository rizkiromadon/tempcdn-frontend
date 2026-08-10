import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getApiBases } from "@/lib/api";
import { highlightJson, looksLikeJson } from "@/lib/json-highlight";
import { Terminal, UploadCloud, FileSearch, Trash2, Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "API Docs — TempCDN",
  description: "Endpoint reference for the TempCDN upload API."
};

type HttpMethod = "GET" | "POST" | "DELETE";

const methodStyle: Record<HttpMethod, string> = {
  GET: "border-sage/30 text-sage bg-sage-soft",
  POST: "border-bloom/30 text-bloom-strong bg-bloom-soft",
  DELETE: "border-coral/30 text-coral bg-coral-soft"
};

function MethodTag({ method }: { method: HttpMethod }) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center justify-center rounded-full border px-2.5 font-mono text-[10px] font-bold uppercase tracking-wide ${methodStyle[method]}`}
    >
      {method}
    </span>
  );
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  const isJson = looksLikeJson(children);
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-ink shadow-soft">
      {label && (
        <div className="border-b border-white/10 px-3.5 py-2 font-mono text-[10px] uppercase tracking-wide text-white/40">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-[12px] leading-relaxed text-white/70">
        <code>{isJson ? highlightJson(children) : children}</code>
      </pre>
    </div>
  );
}

function StatusRow({
  status,
  variant,
  children
}: {
  status: string;
  variant: "neutral" | "warning" | "danger";
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-line py-3 last:border-b-0">
      <Badge variant={variant} className="mt-0.5 shrink-0">
        {status}
      </Badge>
      <p className="text-sm leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  method,
  path,
  children
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  method: HttpMethod;
  path: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-10">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bloom-soft text-bloom-strong">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
        <div className="flex items-center gap-2 font-mono text-xs text-ink-soft">
          <MethodTag method={method} />
          <span className="text-mono-tight">{path}</span>
        </div>
      </div>
      <div className="space-y-4 pl-0 sm:pl-12">{children}</div>
    </section>
  );
}

const nav = [
  { id: "config", label: "Upload config" },
  { id: "upload", label: "Upload a file" },
  { id: "file-info", label: "Get file info" },
  { id: "file-delete", label: "Delete a file" }
];

export default async function DocsPage() {
  const bases = await getApiBases();
  const API_BASE = bases[0];

  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-14 sm:pt-20">
      <section className="mb-12 space-y-4 sm:mb-14">
        <div className="flex items-center gap-2 text-bloom-strong">
          <Terminal className="h-4 w-4" strokeWidth={2} />
          <span className="text-xs font-semibold uppercase tracking-wide">
            reference
          </span>
        </div>
        <h1 className="max-w-2xl font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">
          API docs
        </h1>
        <p className="max-w-lg text-base leading-relaxed text-ink-soft">
          Everything you need to upload, look up, and delete files through the
          TempCDN API. No authentication, no API keys — just a base URL.
        </p>
        <div className="max-w-lg rounded-xl border border-line bg-paper p-5 shadow-soft">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
            base url
          </div>
          <code className="text-mono-tight break-all font-mono text-sm text-bloom-strong">
            {API_BASE}
          </code>
          <p className="mt-3 text-sm leading-relaxed text-ink-faint">
            All endpoints below are relative to this base url.
            {bases.length > 1 && (
              <>
                {" "}Requests are load-balanced across {bases.length} servers with
                automatic failover; this is one of them.
              </>
            )}
          </p>
        </div>
      </section>

      {/* On-page nav */}
      <nav className="mb-14 flex flex-wrap gap-2">
        {nav.map((item) => (
          <Link
            key={item.id}
            href={`#${item.id}`}
            className="rounded-full border border-line bg-paper px-4 py-1.5 text-xs font-medium text-ink-soft shadow-soft transition-colors duration-200 hover:border-bloom/40 hover:text-bloom-strong focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bloom/15"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-14">
        <Section id="config" icon={Settings} title="Upload config" method="GET" path="/api/v1/config">
          <p className="text-sm leading-relaxed text-ink-soft">
            Returns the server&apos;s current upload constraints — max file size, allowed MIME
            types, blocked extensions, and retention TTL. The front-end fetches this once per
            session to size-check files client-side before uploading, so limits shown in the UI
            always reflect the server&apos;s actual configuration.
          </p>

          <CodeBlock label="request">{`curl ${API_BASE}/config`}</CodeBlock>

          <CodeBlock label="200 OK">{`{
  "max_upload_size_bytes": 134217728,
  "max_upload_size_mb": 128,
  "allowed_mime_types": [
    "image/*",
    "video/*",
    "application/pdf",
    "application/zip",
    "text/plain"
  ],
  "blocked_extensions": [
    ".exe",
    ".bat",
    ".sh",
    ".msi",
    ".dll",
    ".scr"
  ],
  "file_ttl_hours": 24
}`}</CodeBlock>

          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-faint">
              error responses
            </div>
            <div className="rounded-xl border border-line bg-paper px-4">
              <StatusRow status="500" variant="danger">
                Unexpected server-side failure.
              </StatusRow>
            </div>
          </div>
        </Section>

        <Section id="upload" icon={UploadCloud} title="Upload a file" method="POST" path="/api/v1/upload">
          <p className="text-sm leading-relaxed text-ink-soft">
            Accepts <code className="text-ink">multipart/form-data</code> with a single{" "}
            <code className="text-ink">file</code> field. No authentication required.
          </p>

          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-paper-sunk">
                  <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Field
                  </th>
                  <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Type
                  </th>
                  <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Required
                  </th>
                  <th className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 font-mono text-ink">file</td>
                  <td className="px-3 py-2 text-ink-soft">file</td>
                  <td className="px-3 py-2 text-ink-soft">Yes</td>
                  <td className="px-3 py-2 text-ink-soft">The file to upload.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
              validation rules
            </div>
            <ul className="list-inside list-disc space-y-1.5 text-sm leading-relaxed text-ink-soft">
              <li>File must not be empty and must not exceed the server&apos;s max upload size.</li>
              <li>File extension must not be on the blocked-extension list.</li>
              <li>
                Content type is detected by sniffing the file&apos;s magic bytes (not the
                client-supplied <code className="text-ink">Content-Type</code>) and must match an
                allowed MIME pattern.
              </li>
              <li>
                If the file&apos;s SHA-256 checksum matches an existing, non-expired file, no new
                object is stored — the existing record is returned with{" "}
                <code className="text-ink">duplicate: true</code>.
              </li>
            </ul>
          </div>

          <CodeBlock label="request">{`curl -X POST ${API_BASE}/upload \\
  -F "file=@photo.png;type=image/png"`}</CodeBlock>

          <CodeBlock label="200 OK">{`{
  "id": "b6b3f6d2-9b1a-4e8b-8a7a-2e6c9e6b0a11",
  "original_name": "photo.png",
  "content_type": "image/png",
  "size_bytes": 20481,
  "checksum_sha256": "e3b0c442...b7852b85",
  "object_key": "2026/08/09/b6b3f6d2-....png",
  "cdn_url": "https://cdn.tempcdn.example.com/2026/08/09/b6b3f6d2-....png",
  "created_at": "2026-08-09T10:15:00Z",
  "expires_at": "2026-08-10T10:15:00Z",
  "duplicate": false,
  "delete_token": "dt_9f2c1a7e4b3d8f6a0c5e2b7d1a4f8c3e"
}`}</CodeBlock>

          <div className="rounded-xl border border-bloom/20 bg-bloom-soft px-4 py-3">
            <p className="text-sm leading-relaxed text-ink-soft">
              <code className="text-ink">delete_token</code> is only ever returned here, in the
              upload response. Save it alongside the <code className="text-ink">id</code> — it&apos;s
              required to delete this file later, and it cannot be retrieved again afterwards
              (including from <code className="text-ink">GET /api/v1/files/{"{id}"}</code>).
            </p>
          </div>

          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-faint">
              error responses
            </div>
            <div className="rounded-xl border border-line bg-paper px-4">
              <StatusRow status="400" variant="warning">
                Missing <code className="text-ink">file</code> field, invalid multipart data,
                empty or oversized file, blocked extension, or disallowed content type.
              </StatusRow>
              <StatusRow status="503" variant="warning">
                Server reached its concurrent-upload limit. Retry shortly.
              </StatusRow>
              <StatusRow status="504" variant="danger">
                Upload processing exceeded the request deadline.
              </StatusRow>
              <StatusRow status="500" variant="danger">
                Unexpected server-side failure.
              </StatusRow>
            </div>
          </div>
        </Section>

        <Section id="file-info" icon={FileSearch} title="Get file info" method="GET" path="/api/v1/files/{id}">
          <p className="text-sm leading-relaxed text-ink-soft">
            Retrieves metadata for a previously uploaded file, identified by the{" "}
            <code className="text-ink">id</code> returned from the upload response.
          </p>

          <CodeBlock label="request">{`curl ${API_BASE}/files/b6b3f6d2-9b1a-4e8b-8a7a-2e6c9e6b0a11`}</CodeBlock>

          <CodeBlock label="200 OK">{`{
  "id": "b6b3f6d2-9b1a-4e8b-8a7a-2e6c9e6b0a11",
  "original_name": "photo.png",
  "content_type": "image/png",
  "size_bytes": 20481,
  "checksum_sha256": "e3b0c442...b7852b85",
  "object_key": "2026/08/09/b6b3f6d2-....png",
  "cdn_url": "https://cdn.tempcdn.example.com/2026/08/09/b6b3f6d2-....png",
  "created_at": "2026-08-09T10:15:00Z",
  "expires_at": "2026-08-10T10:15:00Z",
  "expired": false
}`}</CodeBlock>

          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-faint">
              error responses
            </div>
            <div className="rounded-xl border border-line bg-paper px-4">
              <StatusRow status="404" variant="warning">
                No file exists with the given ID.
              </StatusRow>
              <StatusRow status="410" variant="danger">
                File record exists but has already expired. The body still includes the metadata,
                with <code className="text-ink">expired: true</code>.
              </StatusRow>
              <StatusRow status="500" variant="danger">
                Unexpected server-side failure.
              </StatusRow>
            </div>
          </div>
        </Section>

        <Section id="file-delete" icon={Trash2} title="Delete a file" method="DELETE" path="/api/v1/files/{id}">
          <p className="text-sm leading-relaxed text-ink-soft">
            Deletes a file before its TTL expires. Requires the{" "}
            <code className="text-ink">delete_token</code> issued in the original{" "}
            <code className="text-ink">/upload</code> response — pass it as the{" "}
            <code className="text-ink">X-Delete-Token</code> header, or as a{" "}
            <code className="text-ink">delete_token</code> query parameter if setting a custom
            header isn&apos;t practical for your client. Knowing the file&apos;s{" "}
            <code className="text-ink">id</code> alone is no longer enough to delete it.
          </p>

          <div className="rounded-xl border border-line bg-paper-sunk px-4 py-3">
            <p className="text-sm leading-relaxed text-ink-soft">
              Knowing a file&apos;s <code className="text-ink">id</code> alone is not enough to
              delete it — you must have the matching{" "}
              <code className="text-ink">delete_token</code>. Files with no token on record (e.g.
              shared links you don&apos;t own) can&apos;t be deleted this way; they&apos;re still
              removed automatically once their TTL expires.
            </p>
          </div>

          <CodeBlock label="request (header)">{`curl -X DELETE ${API_BASE}/files/b6b3f6d2-9b1a-4e8b-8a7a-2e6c9e6b0a11 \\
  -H "X-Delete-Token: dt_9f2c1a7e4b3d8f6a0c5e2b7d1a4f8c3e"`}</CodeBlock>

          <CodeBlock label="request (query param alternative)">{`curl -X DELETE "${API_BASE}/files/b6b3f6d2-9b1a-4e8b-8a7a-2e6c9e6b0a11?delete_token=dt_9f2c1a7e4b3d8f6a0c5e2b7d1a4f8c3e"`}</CodeBlock>

          <CodeBlock label="200 OK">{`{ "deleted": true }`}</CodeBlock>

          <div>
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-ink-faint">
              error responses
            </div>
            <div className="rounded-xl border border-line bg-paper px-4">
              <StatusRow status="403" variant="danger">
                Missing, invalid, or already-blank <code className="text-ink">X-Delete-Token</code>{" "}
                / <code className="text-ink">delete_token</code>. This includes files that predate
                delete-token support — they have no token to check against and can no longer be
                deleted this way.
              </StatusRow>
              <StatusRow status="404" variant="warning">
                No file exists with the given ID.
              </StatusRow>
              <StatusRow status="410" variant="danger">
                File exists but has already expired.
              </StatusRow>
              <StatusRow status="500" variant="danger">
                Unexpected server-side failure.
              </StatusRow>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
