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

let engineFile = null
let srcPath = null

for (const basePath of searchPaths) {
    if (fs.existsSync(basePath)) {
        const files = fs.readdirSync(basePath)
        const found = files.find((f) => f.endsWith('.dll.node') || f.endsWith('.so.node'))
        if (found) {
            engineFile = found
            srcPath = path.join(basePath, found)
            break
        }
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
