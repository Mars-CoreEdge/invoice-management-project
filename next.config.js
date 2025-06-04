/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    QUICKBOOKS_CLIENT_ID: 'ABRZKV0y73YEqiuQNZYwZm7ycQspsMJwlO8TWwD3XDj8D3zqhY',
    QUICKBOOKS_CLIENT_SECRET: 'MS1VHy2IWJWwYvCCoVHoHLgaCbD5ghCktrL9xcTn',
    QUICKBOOKS_SANDBOX_BASE_URL: 'https://sandbox-quickbooks.api.intuit.com',
    OPENAI_API_KEY: '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',
  },
  experimental: {
    serverComponentsExternalPackages: ['node-quickbooks', 'intuit-oauth'],
  },
}

module.exports = nextConfig 