const fs = require('fs')
const path = require('path')

// Find and copy Prisma query engine to dist folder
const searchPaths = [
    path.join(
        __dirname,
        '../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client',
    ),
    path.join(__dirname, '../../node_modules/.prisma/client'),
]

// Map platform to preferred engine extension (order matters: try preferred first)
const platformEngineOrder = {
    win32: ['.dll.node', '.so.node', '.darwin.node'],
    linux: ['.so.node', '.dll.node', '.darwin.node'],
    darwin: ['.darwin.node', '.so.node', '.dll.node'],
}

const engineExtensions = platformEngineOrder[process.platform] || platformEngineOrder.linux

let engineFile = null
let srcPath = null

for (const basePath of searchPaths) {
    if (fs.existsSync(basePath)) {
        const files = fs.readdirSync(basePath)
        // Try engines in platform-preferred order
        for (const ext of engineExtensions) {
            const found = files.find((f) => f.endsWith(ext))
            if (found) {
                engineFile = found
                srcPath = path.join(basePath, found)
                break
            }
        }
        if (engineFile) break
    }
}

if (engineFile && srcPath) {
    const dest = path.join(__dirname, 'dist', engineFile)
    fs.copyFileSync(srcPath, dest)
    console.log(`✓ Copied Prisma engine: ${engineFile}`)
} else {
    console.error('✗ Prisma engine file not found')
    console.error('Searched paths:', searchPaths)
    process.exit(1)
}
