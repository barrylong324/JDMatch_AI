'use client';

import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 注册页面 - 暂时关闭
 * 登录支持：GitHub OAuth / 已有账号邮箱+密码+验证码
 * 注册暂未开放，如需账号请联系管理员 barrylong324@gmail.com
 */
export default function RegisterPage() {
    const t = useTranslations('auth');

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md border-gray-200 shadow-lg">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold">
                        {t('registrationClosedTitle')}
                    </CardTitle>
                    <CardDescription>
                        {t('registrationClosedMessage')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-gray-500 mb-4">
                        📧 barrylong324@gmail.com
                    </p>
                    <Link
                        href="/login"
                        className="text-sm font-medium text-black hover:text-gray-700 underline"
                    >
                        {t('login')}
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
