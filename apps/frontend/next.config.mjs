import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@jd-match/shared-types'],
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:4000/:path*',
            },
        ]
    },
}

export default withNextIntl(nextConfig)
