import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
// Providers: 客户端全局 Provider 容器，包含 React Query（数据请求缓存）和 Sonner（Toast 通知）
import { Providers } from '@/components/providers';
// IntlProvider: 国际化 Provider，基于 next-intl，为整个应用注入多语言消息
import IntlProvider from '@/components/providers/intl-provider';
// i18n 配置：支持的语言列表、默认语言、Locale 类型
import { locales, defaultLocale, type Locale } from '../../i18n';

// 加载 Google Inter 字体，子集为 latin（英文字符集）
const inter = Inter({ subsets: ['latin'] });

// 页面元数据，用于 SEO 和浏览器标签页标题 生成<title>和<meta>标签
export const metadata: Metadata = {
    title: 'RAG AI Knowledge Base',
    description: 'Intelligent knowledge base powered by RAG and AI',
};

// 为 Next.js 静态生成（SSG）提供所有支持的语言路由参数
// 例如生成 /en 和 /zh 两个版本的静态页面
export function generateStaticParams() {
    return locales.map((locale: Locale) => ({ locale }));
}

export default function RootLayout({
    children,
    params,
}: Readonly<{
    children: React.ReactNode;
    params: { locale: string };
}>) {
    // 从路由参数中获取当前语言，未匹配时回退到默认语言（zh）
    const locale = params.locale || defaultLocale;

    return (
        // 设置 HTML 文档的 lang 属性，影响屏幕阅读器和浏览器翻译行为
        <html lang={locale}>
            {/* Inter 字体应用到整个页面 */}
            <body className={inter.className}>
                {/* IntlProvider: 必须在最外层，因为它是服务端组件，内部嵌套客户端 Providers */}
                <IntlProvider>
                    <Providers>{children}</Providers>
                </IntlProvider>
            </body>
        </html>
    );
}
