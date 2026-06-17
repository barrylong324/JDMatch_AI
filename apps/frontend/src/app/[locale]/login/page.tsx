'use client';

import { useState, useEffect, Suspense } from 'react';
import { Link, useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { contextRagLogin } from '@/lib/requestModule/request-bus';
import MascotAvatar from '@/components/login/mascot-avatar';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** GitHub 图标 SVG */
function GitHubIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
    );
}

/** 处理 GitHub OAuth 回调参数的组件 */
function GitHubCallbackHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const t = useTranslations('auth');

    useEffect(() => {
        const token = searchParams.get('token');
        const name = searchParams.get('name');
        const email = searchParams.get('email');
        const error = searchParams.get('error');

        if (error) {
            toast.error(t('githubLoginFailed'));
            // 清理 URL 参数
            window.history.replaceState({}, '', window.location.pathname);
            return;
        }

        if (token && email) {
            login(
                {
                    id: '',
                    email,
                    name: name || email,
                    role: 'USER',
                },
                token,
            );
            toast.success(t('githubLoginSuccess'));
            router.push('/dashboard');
        }
    }, [searchParams, router, login, t]);

    return null;
}

function LoginForm() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const t = useTranslations('auth');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        captcha: '',
    });
    const [captchaId, setCaptchaId] = useState('');
    const [captchaSvg, setCaptchaSvg] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [captchaLoading, setCaptchaLoading] = useState(false);

    /** 获取验证码 */
    const fetchCaptcha = async () => {
        setCaptchaLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/captcha`);
            const data = await res.json();
            // 拦截器包装了 { code, message, result }，数据在 result 里
            const captchaData = data.result ?? data;
            setCaptchaId(captchaData.captchaId);
            setCaptchaSvg(captchaData.svg);
            setFormData((prev) => ({ ...prev, captcha: '' }));
        } catch {
            // 静默失败
        } finally {
            setCaptchaLoading(false);
        }
    };

    // 组件挂载时获取验证码
    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await contextRagLogin(
                formData.email,
                formData.password,
                captchaId,
                formData.captcha,
            );
            const { code, message, result } = response.data;
            if (code === 0) {
                const { user, access_token } = result;

                login(user, access_token);
                toast.success(message);
                router.push('/dashboard');
            }
        } catch (error: any) {
            const errMsg = error.response?.data?.message || t('loginFailed');
            toast.error(errMsg);
            // 验证码错误时刷新验证码
            if (errMsg.includes('验证码') || errMsg.includes('captcha') || errMsg.includes('Captcha')) {
                fetchCaptcha();
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGitHubLogin = () => {
        window.location.href = `${API_BASE_URL}/auth/github`;
    };

    return (
        <Card className="w-full border-gray-200 shadow-lg">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                    {t('loginTitle')}
                </CardTitle>
                <CardDescription className="text-center">
                    {t('loginDescription')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* GitHub 登录按钮 */}
                <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 border-gray-300 hover:bg-gray-50"
                    onClick={handleGitHubLogin}
                >
                    <GitHubIcon className="w-5 h-5" />
                    {t('githubLogin')}
                </Button>

                {/* 分隔线 */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-gray-400">{t('orDivider')}</span>
                    </div>
                </div>

                {/* 邮箱登录表单 */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">{t('email')}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder={t('emailPlaceholder')}
                            required
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">{t('password')}</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder={t('passwordPlaceholder')}
                            required
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({ ...formData, password: e.target.value })
                            }
                        />
                    </div>

                    {/* 验证码 */}
                    <div className="space-y-2">
                        <Label htmlFor="captcha">{t('captcha')}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="captcha"
                                type="text"
                                placeholder={t('captchaPlaceholder')}
                                required
                                maxLength={4}
                                className="flex-1"
                                value={formData.captcha}
                                onChange={(e) =>
                                    setFormData({ ...formData, captcha: e.target.value.toUpperCase() })
                                }
                            />
                            {/* 验证码图片 */}
                            <button
                                type="button"
                                className="h-10 w-[120px] flex-shrink-0 border border-gray-200 rounded-md overflow-hidden hover:border-gray-400 transition-colors disabled:opacity-50"
                                onClick={fetchCaptcha}
                                disabled={captchaLoading}
                                title={t('captchaRefresh')}
                            >
                                {captchaSvg ? (
                                    <div
                                        className="w-full h-full"
                                        dangerouslySetInnerHTML={{ __html: captchaSvg }}
                                    />
                                ) : (
                                    <span className="text-xs text-gray-400">
                                        {captchaLoading ? t('captchaLoading') : t('captchaGet')}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-black text-white hover:bg-gray-800"
                        disabled={isLoading}
                    >
                        {isLoading ? t('signingIn') : t('signIn')}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col">
                <p className="text-sm text-center text-gray-600">
                    {t('noAccount')}
                    <Link
                        href="/register"
                        className="font-medium text-black hover:text-gray-700 underline ml-1"
                    >
                        {t('signUp')}
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    const t = useTranslations('auth');

    return (
        <div className="min-h-screen flex">
            {/* ========== 左侧：动画表情区域 ========== */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-gray-50 via-white to-gray-100 flex-col items-center justify-center overflow-hidden">
                {/* 背景装饰网格 */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* 顶部返回链接 */}
                <div className="absolute top-6 left-6 z-10">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-gray-400 hover:text-black transition-colors"
                    >
                        {t('backToHome')}
                    </Link>
                </div>

                {/* 表情角色 */}
                <div className="relative z-10">
                    <MascotAvatar />
                </div>
            </div>

            {/* ========== 右侧：登录表单区域 ========== */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center bg-white px-6 sm:px-12">
                <div className="w-full max-w-md">
                    {/* 移动端显示 Logo */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-3xl">🤖</span>
                        </div>
                    </div>

                    <LoginForm />

                    {/* 移动端底部导航 */}
                    <div className="lg:hidden mt-6 text-center">
                        <Link
                            href="/"
                            className="text-sm text-gray-400 hover:text-black transition-colors"
                        >
                            {t('backToHome')}
                        </Link>
                    </div>
                </div>
            </div>

            {/* GitHub OAuth 回调处理 */}
            <Suspense fallback={null}>
                <GitHubCallbackHandler />
            </Suspense>
        </div>
    );
}
