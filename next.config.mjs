/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@electric-sql/pglite', '@neondatabase/serverless'],
};

export default nextConfig;
