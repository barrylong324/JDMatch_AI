import { getRequestConfig } from 'next-intl/server'
import { locales, defaultLocale, type Locale } from '@/lib/locales'

export { locales, defaultLocale, type Locale }

export default getRequestConfig(async ({ locale }) => {
    // 如果locale无效,使用默认语言
    const validLocale = locale && locales.includes(locale as Locale) ? locale : defaultLocale

    return {
        locale: validLocale,
        messages: (await import(`./messages/${validLocale}.json`)).default,
    }
})
