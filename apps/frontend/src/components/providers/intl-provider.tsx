import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

export default async function IntlProvider({
    children,
    locale,
}: {
    children: React.ReactNode;
    locale: string;
}) {
    // 确保当前请求的语言上下文正确
    setRequestLocale(locale);
    const messages = await getMessages({ locale });

    return (
        <NextIntlClientProvider messages={messages} locale={locale}>
            {children}
        </NextIntlClientProvider>
    );
}
