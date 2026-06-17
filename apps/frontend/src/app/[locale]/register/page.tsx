'use client';

import { useState, useEffect } from 'react';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { contextRagRegister } from '@/lib/requestModule/request-bus'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RegisterPage() {
    const router = useRouter();
    const t = useTranslations('auth');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
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

    useEffect(() => {
        fetchCaptcha();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await contextRagRegister(
                formData.email,
                formData.password,
                formData.name,
                captchaId,
                formData.captcha,
            )
            const { code, message, result } = response.data
            if (code === 0) {
                toast.success(message)
                router.push('/login')
            }
        } catch (error: any) {
            const errMsg = error.response?.data?.message || t('registerFailed');
            toast.error(errMsg);
            if (errMsg.includes('验证码') || errMsg.includes('captcha') || errMsg.includes('Captcha')) {
                fetchCaptcha();
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
            <div className="w-full max-w-md mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center text-sm text-gray-500 hover:text-black transition-colors"
                >
                    {t('backToHome')}
                </Link>
            </div>
            <Card className="w-full max-w-md border-gray-200 shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">{t('registerTitle')}</CardTitle>
                    <CardDescription className="text-center">
                        {t('registerDescription')}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">{t('name')}</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder={t('namePlaceholder')}
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
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
                                placeholder={t('createPasswordPlaceholder')}
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
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="w-full bg-black text-white hover:bg-gray-800"
                            disabled={isLoading}
                        >
                            {isLoading ? t('creatingAccount') : t('signUp')}
                        </Button>
                        <p className="text-sm text-center text-gray-600">
                            {t('hasAccount')}{' '}
                            <Link
                                href="/login"
                                className="font-medium text-black hover:text-gray-700 underline"
                            >
                                {t('signIn')}
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
