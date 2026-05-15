/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@xenova/transformers", "sharp", "onnxruntime-node"],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
