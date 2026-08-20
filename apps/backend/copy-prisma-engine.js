/**
 * ============================================================================
 * copy-prisma-engine.js — Prisma 查询引擎跨平台复制脚本
 * ============================================================================
 *
 * 【为什么需要这个脚本】
 * Prisma ORM 依赖一个平台相关的原生二进制文件（查询引擎 Query Engine）来执行
 * 数据库操作。这个文件在不同操作系统上的扩展名不同：
 *   - Windows:  .dll.node  (Dynamic Link Library)
 *   - Linux:    .so.node   (Shared Object)
 *   - macOS:    .darwin.node
 *
 * NestJS 使用 webpack 打包时，这个引擎文件不会被自动包含进 dist/ 目录。
 * 如果 dist/ 中缺少这个 .node 文件，应用启动时 Prisma 无法找到引擎，
 * 会直接报错退出。
 *
 * 【调用时机】
 * 在 `package.json` 的 build 脚本中，作为 webpack 构建的后置步骤执行：
 *   "build": "nest build && node copy-prisma-engine.js"
 *
 * webpack 打包 → 生成 dist/ 文件 → 本脚本复制引擎到 dist/ → 应用可运行
 *
 * 【与 webpack 插件的配合】
 * webpack.config.js 中也定义了 CopyPrismaEnginePlugin，它在 webpack emit
 * 阶段复制引擎，覆盖 dev watch 模式（`nest start --watch`）。
 * 本脚本覆盖 production build（`pnpm build`），两者互为兜底。
 *
 * 【平台兼容策略】
 * 使用 process.platform 运行时检测当前操作系统，按优先级匹配引擎：
 *   - 本机优先：Windows 优先找 .dll，Linux 优先找 .so
 *   - 降级兜底：找不到本机引擎时尝试其他平台引擎（同架构下 .so 和 .dll
 *     在 WSL / 容器场景中可能同时存在）
 *
 * @see webpack.config.js — CopyPrismaEnginePlugin（webpack 构建阶段复制）
 * @see main.ts — PRISMA_QUERY_ENGINE_LIBRARY 环境变量（运行时定位引擎）
 * ============================================================================
 */

const fs = require('fs')
const path = require('path')

// ---------------------------------------------------------------------------
// 1. 引擎文件搜索路径（按优先级排序）
// ---------------------------------------------------------------------------
// pnpm 的 node_modules 结构与 npm/yarn 不同，.prisma 目录通常在以下位置：
//   - 路径1: pnpm 的虚拟存储（pnpm store）→ 精确版本匹配
//   - 路径2: 传统扁平化 .prisma 目录 → npm/yarn 兼容降级
const searchPaths = [
    // pnpm: 精确的 Prisma client 生成目录
    path.join(
        __dirname,
        '../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma/client',
    ),
    // 降级: npm/yarn 的扁平化 .prisma 目录
    path.join(__dirname, '../../node_modules/.prisma/client'),
]

// ---------------------------------------------------------------------------
// 2. 平台 → 引擎扩展名优先级映射
// ---------------------------------------------------------------------------
// 数组顺序 = 查找优先级（先找本机引擎，找不到再降级）
// 降级场景举例：
//   - WSL (Windows Subsystem for Linux): 同时有 .dll 和 .so，优先用本机
//   - Docker 构建: linux 容器只有 .so，.dll 不可用
const platformEngineOrder = {
    win32: ['.dll.node', '.so.node', '.darwin.node'], // Windows 优先
    linux: ['.so.node', '.dll.node', '.darwin.node'], // Linux 优先
    darwin: ['.darwin.node', '.so.node', '.dll.node'], // macOS 优先
}

// 根据当前操作系统获取引擎扩展名优先级列表
// 未知平台降级为 Linux（大多数 CI/CD 容器都是 Linux）
const engineExtensions = platformEngineOrder[process.platform] || platformEngineOrder.linux

// ---------------------------------------------------------------------------
// 3. 查找引擎文件
// ---------------------------------------------------------------------------
let engineFile = null // 引擎文件名（如 libquery_engine-linux-arm64.so.node）
let srcPath = null // 引擎完整源路径

// 遍历搜索路径：找到第一个包含引擎文件的目录
for (const basePath of searchPaths) {
    if (fs.existsSync(basePath)) {
        const files = fs.readdirSync(basePath)

        // 在当前目录中按平台优先级尝试匹配引擎扩展名
        for (const ext of engineExtensions) {
            const found = files.find((f) => f.endsWith(ext))
            if (found) {
                engineFile = found
                srcPath = path.join(basePath, found)
                break // 找到匹配的引擎，不再查找
            }
        }
        if (engineFile) break // 已找到，不再遍历其他搜索路径
    }
}

// ---------------------------------------------------------------------------
// 4. 复制到 dist/ 目录
// ---------------------------------------------------------------------------
if (engineFile && srcPath) {
    const dest = path.join(__dirname, 'dist', engineFile)

    try {
        fs.copyFileSync(srcPath, dest)
        console.log(`✓ Copied Prisma engine: ${engineFile}`)
        console.log(`  ${srcPath} → ${dest}`)
    } catch (err) {
        // EBUSY: Windows 上引擎文件可能被正在运行的进程锁定（dev watch 模式常见）
        if (err.code === 'EBUSY') {
            console.log(`⚠ Engine file busy (already loaded by running process), skipping copy`)
            console.log(`  ${engineFile}`)
        } else {
            throw err
        }
    }
} else {
    // 找不到引擎文件 → 构建失败，阻止部署含有缺陷的镜像
    console.error('✗ Prisma engine file not found!')
    console.error('  Searched paths:')
    searchPaths.forEach((p) => console.error(`    - ${p}`))
    console.error('  Platform:', process.platform)
    console.error('  Expected extensions:', engineExtensions)
    process.exit(1) // 非零退出码 → CI/CD 构建失败
}
