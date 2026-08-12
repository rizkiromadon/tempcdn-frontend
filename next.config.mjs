const cdnHost = process.env.NEXT_PUBLIC_TEMPCDN_CDN_HOST ?? "localhost";

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: cdnHost },
      { protocol: "http", hostname: cdnHost }
    ]
  }
};

export default nextConfig;
