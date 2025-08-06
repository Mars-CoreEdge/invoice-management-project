/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['node-quickbooks', 'intuit-oauth'],
  },
}

module.exports = nextConfig 