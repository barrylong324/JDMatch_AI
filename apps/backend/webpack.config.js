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
                    // Prefer Windows .dll.node over Linux .so.node
                    const dll = files.find((f) => f.endsWith('.dll.node'))
                    const so = files.find((f) => f.endsWith('.so.node'))
                    const found = dll || so
                    if (found) {
                        engineFile = found
                        srcPath = path.join(basePath, found)
                        break
                    }
                }
            }

            if (engineFile && srcPath) {
                const dest = path.join(compiler.outputPath, engineFile)
                try {
                    // Only copy if destination doesn't exist or is different (avoids EBUSY on Windows hot reload)
                    if (!fs.existsSync(dest)) {
                        fs.copyFileSync(srcPath, dest)
                        console.log(`✓ Copied Prisma engine: ${engineFile}`)
                    } else {
                        console.log(`✓ Prisma engine already exists: ${engineFile}`)
                    }
                } catch (err) {
                    // EBUSY on Windows: engine is locked by running process, skip
                    if (err.code === 'EBUSY') {
                        console.log(`⚠ Engine file busy, skipping copy (already loaded)`)
                    } else {
                        throw err
                    }
                }
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
                    /^@jd-match\/.*/,
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
                '@jd-match/ai': path.resolve(__dirname, '../../packages/ai/src'),
                '@jd-match/config': path.resolve(__dirname, '../../packages/config/src'),
                '@jd-match/database': path.resolve(__dirname, '../../packages/database/src'),
                '@jd-match/shared-types': path.resolve(
                    __dirname,
                    '../../packages/shared-types/src',
                ),
            },
        },
        plugins: [...(options.plugins || []), new CopyPrismaEnginePlugin()],
    }
}
