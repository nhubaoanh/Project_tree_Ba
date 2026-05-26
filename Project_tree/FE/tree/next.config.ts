import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Tắt static export để hỗ trợ dynamic routes
  // output: "export",
  
  // Thêm trailing slash để fix routing issues
  trailingSlash: true,
  
  // Tắt image optimization cho static export
  images: {
    unoptimized: true,
  },
  
  // Tắt strict mode trong production để tránh double render
  reactStrictMode: process.env.NODE_ENV === "development",
};

export default nextConfig;
