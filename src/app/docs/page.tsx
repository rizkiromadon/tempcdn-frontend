import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Terminal,
  HeartPulse,
  Activity,
  UploadCloud,
  FileSearch,
  Trash2,
  AlertTriangle,
  ShieldAlert
} from "lucide-react";

export const metadata: Metadata = {
  title: "API Docs — TempCDN",
  description: "Endpoint reference for the TempCDN upload API."
};

type HttpMethod = "GET" | "POST" | "DELETE";

const methodStyle: Record<HttpMethod, string> = {
  GET: "border-signal/40 text-signal bg-signal/10",
  POST: "border-hazard/40 text-hazard bg-hazard/10",
  DELETE: "border-rust/40 text-rust-glow bg-rust/10"
};

function MethodTag({ method }: { method: HttpMethod }) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center justify-center rounded-sm border px-2 font-mono text-[10px] font-bold uppercase tracking-widest ${methodStyle[method]}`}
    >
      {method}
    </span>
  );
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div className="overflow-hidden rounded border border-steel-dim bg-surface-hatch">
      {label && (
        <div className="border-b border-steel-dim bg-surface-raised px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-bone-faint">
          {label}
        </div>
      )}
      <pre className="overflow-x-auto p-3 text-[11px] leading-relaxed text-bone-dim">
        <code>{children}</code>
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
    <div className="flex items-start gap-3 border-b border-steel-dim py-2.5 last:border-b-0">
      <Badge variant={variant} className="mt-0.5 shrink-0">
        {status}
      </Badge>
      <p className="text-xs leading-relaxed text-bone-dim">{children}</p>
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
    <section id={id} className="scroll-mt-20 border-t border-steel-dim pt-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-steel bg-void text-hazard">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <h2 className="font-mono text-sm font-bold uppercase tracking-wide text-bone">
          {title}
        </h2>
        <div className="flex items-center gap-2 font-mono text-xs text-bone-dim">
          <MethodTag method={method} />
          <span className="text-mono-tight">{path}</span>
        </div>
      </div>
      <div className="space-y-4 pl-0 sm:pl-11">{children}</div>
    </section>
  );
}

const nav = [
  { id: "health", label: "Health check" },
  { id: "metrics", label: "Metrics" },
  { id: "upload", label: "Upload a file" },
  { id: "file-info", label: "Get file info" },
  { id: "file-delete", label: "Delete a file" },
  { id: "errors", label: "Error format" },
  { id: "cors", label: "CORS" }
];

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-10 sm:pt-14">
      <section className="mb-10 space-y-4 sm:mb-12">
        <div className="flex items-center gap-2 text-hazard">
          <Terminal className="h-4 w-4" strokeWidth={2} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest">
            reference
          </span>
        </div>
        <h1 className="max-w-2xl font-mono text-[1.75rem] font-bold leading-tight text-bone sm:text-4xl">
          API Docs
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-bone-dim">
          TempCDN accepts anonymous uploads over a small JSON/multipart API.
          No authentication, no API keys — just a base URL.
        </p>
        <div className="max-w-lg border border-steel-dim bg-surface p-4">
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-bone-faint">
            base url
          </div>
          <code className="text-mono-tight break-all font-mono text-sm text-hazard">
            {"{API_BASE}"}/api/v1
          </code>
          <p className="mt-2 text-xs leading-relaxed text-bone-faint">
            Configured via <code className="text-bone-dim">NEXT_PUBLIC_TEMPCDN_API_BASE</code>.
            Defaults to <code className="text-bone-dim">http://localhost:8080/api/v1</code> in
            this app. <code className="text-bone-dim">/healthz</code> and{" "}
            <code className="text-bone-dim">/metrics</code> live one level up, outside{" "}
            <code className="text-bone-dim">/api/v1</code>.
          </p>
        </div>
      </section>

      {/* On-page nav */}
      <nav className="mb-14 flex flex-wrap gap-2">
        {nav.map((item) => (
          <Link
            key={item.id}
            href={`#${item.id}`}
            className="rounded-sm border border-steel-dim bg-surface px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-bone-dim transition-colors hover:border-hazard hover:text-hazard"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-14">
        <Section id="health" icon={HeartPulse} title="Health check" method="GET" path="/healthz">
          <p className="text-xs leading-relaxed text-bone-dim">
            Returns service liveness status. Useful for uptime checks and load balancer probes.
          </p>
          <CodeBlock label="200 OK">{`{ "status": "ok" }`}</CodeBlock>
        </Section>

        <Section id="metrics" icon={Activity} title="Metrics" method="GET" path="/metrics">
          <p className="text-xs leading-relaxed text-bone-dim">
            Prometheus text-format metrics: <code className="text-bone">tempcdn_uploads_total</code>,{" "}
            <code className="text-bone">tempcdn_upload_bytes_total</code>,{" "}
            <code className="text-bone">tempcdn_upload_errors_total</code>,{" "}
            <code className="text-bone">tempcdn_request_latency_seconds</code>, plus default
            Go/process metrics. This app reads the counters via{" "}
            <code className="text-bone">getTempCdnMetrics()</code> in{" "}
            <code className="text-bone">src/lib/api.ts</code> for the network stats panel on the
            home page.
          </p>
        </Section>

        <Section id="upload" icon={UploadCloud} title="Upload a file" method="POST" path="/api/v1/upload">
          <p className="text-xs leading-relaxed text-bone-dim">
            Accepts <code className="text-bone">multipart/form-data</code> with a single{" "}
            <code className="text-bone">file</code> field. No authentication required.
          </p>

          <div className="overflow-hidden rounded border border-steel-dim">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-steel-dim bg-surface-raised">
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-bone-faint">
                    Field
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-bone-faint">
                    Type
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-bone-faint">
                    Required
                  </th>
                  <th className="px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-bone-faint">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2 font-mono text-bone">file</td>
                  <td className="px-3 py-2 text-bone-dim">file</td>
                  <td className="px-3 py-2 text-bone-dim">Yes</td>
                  <td className="px-3 py-2 text-bone-dim">The file to upload.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-bone-faint">
              validation rules
            </div>
            <ul className="list-inside list-disc space-y-1.5 text-xs leading-relaxed text-bone-dim">
              <li>File must not be empty and must not exceed the server&apos;s max upload size.</li>
              <li>File extension must not be on the blocked-extension list.</li>
              <li>
                Content type is detected by sniffing the file&apos;s magic bytes (not the
                client-supplied <code className="text-bone">Content-Type</code>) and must match an
                allowed MIME pattern.
              </li>
              <li>
                If the file&apos;s SHA-256 checksum matches an existing, non-expired file, no new
                object is stored — the existing record is returned with{" "}
                <code className="text-bone">duplicate: true</code>.
              </li>
            </ul>
          </div>

          <CodeBlock label="request">{`curl -X POST {API_BASE}/upload \\
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
  "duplicate": false
}`}</CodeBlock>

          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-bone-faint">
              error responses
            </div>
            <div className="border border-steel-dim bg-surface px-3">
              <StatusRow status="400" variant="warning">
                Missing <code className="text-bone">file</code> field, invalid multipart data,
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

          <p className="text-xs leading-relaxed text-bone-faint">
            In this app, uploads go through <code className="text-bone-dim">uploadFile()</code> in{" "}
            <code className="text-bone-dim">src/lib/api.ts</code>, which uses{" "}
            <code className="text-bone-dim">XMLHttpRequest</code> to report progress.
          </p>
        </Section>

        <Section id="file-info" icon={FileSearch} title="Get file info" method="GET" path="/api/v1/files/{id}">
          <p className="text-xs leading-relaxed text-bone-dim">
            Retrieves metadata for a previously uploaded file, identified by the{" "}
            <code className="text-bone">id</code> returned from the upload response.
          </p>

          <CodeBlock label="request">{`curl {API_BASE}/files/b6b3f6d2-9b1a-4e8b-8a7a-2e6c9e6b0a11`}</CodeBlock>

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
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-bone-faint">
              error responses
            </div>
            <div className="border border-steel-dim bg-surface px-3">
              <StatusRow status="404" variant="warning">
                No file exists with the given ID.
              </StatusRow>
              <StatusRow status="410" variant="danger">
                File record exists but has already expired. The body still includes the metadata,
                with <code className="text-bone">expired: true</code>.
              </StatusRow>
              <StatusRow status="500" variant="danger">
                Unexpected server-side failure.
              </StatusRow>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-bone-faint">
            Backed by <code className="text-bone-dim">getFileInfo()</code> in{" "}
            <code className="text-bone-dim">src/lib/api.ts</code>, used on the{" "}
            <code className="text-bone-dim">/files/[id]</code> detail page.
          </p>
        </Section>

        <Section id="file-delete" icon={Trash2} title="Delete a file" method="DELETE" path="/api/v1/files/{id}">
          <p className="text-xs leading-relaxed text-bone-dim">
            Deletes a file before its TTL expires.
          </p>

          <CodeBlock label="request">{`curl -X DELETE {API_BASE}/files/b6b3f6d2-9b1a-4e8b-8a7a-2e6c9e6b0a11`}</CodeBlock>

          <CodeBlock label="200 OK">{`{ "deleted": true }`}</CodeBlock>

          <div>
            <div className="mb-1 font-mono text-[10px] uppercase tracking-widest text-bone-faint">
              error responses
            </div>
            <div className="border border-steel-dim bg-surface px-3">
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

          <p className="text-xs leading-relaxed text-bone-faint">
            Backed by <code className="text-bone-dim">deleteFile()</code> in{" "}
            <code className="text-bone-dim">src/lib/api.ts</code>.
          </p>
        </Section>

        <Section id="errors" icon={AlertTriangle} title="Error format" method="GET" path="(all endpoints)">
          <p className="text-xs leading-relaxed text-bone-dim">
            Every error response shares the same JSON shape:
          </p>
          <CodeBlock>{`{ "error": "human-readable error message" }`}</CodeBlock>
        </Section>

        <Section id="cors" icon={ShieldAlert} title="CORS" method="GET" path="(policy)">
          <ul className="list-inside list-disc space-y-1.5 text-xs leading-relaxed text-bone-dim">
            <li>
              <code className="text-bone">POST /api/v1/upload</code> and{" "}
              <code className="text-bone">DELETE /api/v1/files/{"{id}"}</code> use a strict CORS
              policy — the allowed origin is set server-side.
            </li>
            <li>
              <code className="text-bone">GET /api/v1/files/{"{id}"}</code> uses a permissive CORS
              policy (<code className="text-bone">*</code>), since file metadata isn&apos;t
              sensitive and is commonly read from arbitrary front-end origins.
            </li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
