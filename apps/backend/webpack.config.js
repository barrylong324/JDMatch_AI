const path = require('path')
const fs = require('fs')
const nodeExternals = require('webpack-node-externals')

class CopyPrismaEnginePlugin {
    apply(compiler) {
        compiler.hooks.afterEmit.tapAsync('CopyPrismaEnginePlugin', (compilation, callback) => {
            const searchPaths = [
                path.join(
                    __dirname,
                    '../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client',
                ),
                path.join(__dirname, '../../node_modules/.prisma/client'),
            ]

            let engineFile = null
            let srcPath = null

            for (const basePath of searchPaths) {
                if (fs.existsSync(basePath)) {
                    const files = fs.readdirSync(basePath)
                    const found = files.find(
                        (f) => f.endsWith('.dll.node') || f.endsWith('.so.node'),
                    )
                    if (found) {
                        engineFile = found
                        srcPath = path.join(basePath, found)
                        break
                    }
                }
            }

            if (engineFile && srcPath) {
                const dest = path.join(compiler.outputPath, engineFile)
                fs.copyFileSync(srcPath, dest)
                console.log(`✓ Copied Prisma engine: ${engineFile}`)
            } else {
                console.error('✗ Prisma engine file not found')
            }

            callback()
        })
    }
}

module.exports = function (options) {
    return {
        ...options,
        externals: [
            // Externalize all node_modules to avoid bundling issues with native binaries
            nodeExternals({
                allowlist: [
                    // Bundle workspace packages
                    /^@rag-ai\/.*/,
                    // Allow Prisma client and engine to be bundled
                    '@prisma/client',
                    'prisma',
                ],
            }),
        ],
        resolve: {
            ...options.resolve,
            alias: {
                // Ensure workspace packages are resolved correctly
                '@rag-ai/ai': path.resolve(__dirname, '../../packages/ai/src'),
                '@rag-ai/config': path.resolve(__dirname, '../../packages/config/src'),
                '@rag-ai/database': path.resolve(__dirname, '../../packages/database/src'),
                '@rag-ai/document-parser': path.resolve(
                    __dirname,
                    '../../packages/document-parser/src',
                ),
                '@rag-ai/shared-types': path.resolve(__dirname, '../../packages/shared-types/src'),
            },
        },
        plugins: [...(options.plugins || []), new CopyPrismaEnginePlugin()],
    }
}
