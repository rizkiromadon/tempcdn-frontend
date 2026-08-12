const cdnHost = process.env.NEXT_PUBLIC_TEMPCDN_CDN_HOST ?? "localhost";

const nextConfig = {
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: cdnHost },
      { protocol: "http", hostname: cdnHost }
    ]
  }
};

export default nextConfig;
