import { createNavigation } from 'next-intl/navigation'
import { locales, defaultLocale } from '@/lib/locales'

// 创建 locale-aware 的导航工具：Link 自动带语言前缀，useRouter 自动处理 locale 跳转
export const { Link, redirect, usePathname, useRouter } = createNavigation({
    locales,
    defaultLocale,
})
