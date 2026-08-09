// Host that uploaded files are actually served from (see .env.example).
// Falls back to "localhost" for local dev against a plain-HTTP backend.
const cdnHost = process.env.NEXT_PUBLIC_TEMPCDN_CDN_HOST ?? "localhost";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Scoped to the real CDN host only — a wildcard ("**") would let
    // next/image's built-in optimizer proxy-fetch any HTTPS URL, which is
    // unnecessary now that next/image is actually in use (FilePreview) and
    // is safer to avoid by default.
    remotePatterns: [
      { protocol: "https", hostname: cdnHost },
      { protocol: "http", hostname: cdnHost }
    ]
  }
};

export default nextConfig;
