'use client';

import { useState } from 'react';
import { Link, useRouter } from '@/navigation';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { contextRagLogin } from '@/lib/requestModule/request-bus'


export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await contextRagLogin(formData.email, formData.password)
            const { code, message, result } = response.data
            if (code === 0) {
                const { user, access_token } = result

                login(user, access_token);
                toast.success(message);
                router.push('/dashboard');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || '登录失败！');
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
                    ← 返回首页
                </Link>
            </div>
            <Card className="w-full max-w-md border-gray-200 shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">登录 JDMatch AI</CardTitle>
                    <CardDescription className="text-center">
                        登录后开始您的简历匹配分析之旅
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="Enter your email"
                                required
                                value={formData.email}
                                onChange={(e) =>
                                    setFormData({ ...formData, email: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                required
                                value={formData.password}
                                onChange={(e) =>
                                    setFormData({ ...formData, password: e.target.value })
                                }
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4">
                        <Button
                            type="submit"
                            className="w-full bg-black text-white hover:bg-gray-800"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>
                        <p className="text-sm text-center text-gray-600">
                            {/* Don't have an account?{' '} */}
                            没有账户？
                            <Link
                                href="/register"
                                className="font-medium text-black hover:text-gray-700 underline"
                            >
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
