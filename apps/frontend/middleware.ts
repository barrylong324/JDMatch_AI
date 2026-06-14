import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from '@/lib/locales'

export default createMiddleware({
    // 支持的语言列表
    locales,
    // 默认语言
    defaultLocale,
    // 始终显示语言前缀，让 / 重定向到 /zh，确保所有路由都匹配 [locale] 动态段
    localePrefix: 'always',
})

export const config = {
    // 匹配所有路径,除了api、静态文件等
    matcher: ['/((?!api|_next|.*\\..*).*)'],
}
