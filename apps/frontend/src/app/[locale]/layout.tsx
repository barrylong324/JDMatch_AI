import { setRequestLocale } from 'next-intl/server';
import { Providers } from '@/components/providers';
import IntlProvider from '@/components/providers/intl-provider';
import { locales, type Locale } from '@/lib/locales';

// 为 Next.js 静态生成（SSG）提供所有支持的语言路由参数
// 例如生成 /en 和 /zh 两个版本的静态页面
export function generateStaticParams() {
    return locales.map((locale: Locale) => ({ locale }));
}

export default function LocaleLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: { locale: string };
}>) {
    // 告知 next-intl 当前请求的语言，确保 getMessages() 等 API 返回正确语言的数据
    setRequestLocale(params.locale);

    return (
        <IntlProvider locale={params.locale}>
            <Providers>{children}</Providers>
        </IntlProvider>
    );
}
