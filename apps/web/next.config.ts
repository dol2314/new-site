import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 정적 파일로 내보내 Cloudflare Pages에 올린다 (서버 없음).
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  transpilePackages: ["@site/calc-core", "@site/data"],
  poweredByHeader: false,
};

export default nextConfig;
