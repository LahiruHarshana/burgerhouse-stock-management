/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { serverMinification: true },
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'mongodb-client-encryption': 'mongodb-client-encryption', aws4: 'aws4' }];
    return config;
  },
};
export default nextConfig;
