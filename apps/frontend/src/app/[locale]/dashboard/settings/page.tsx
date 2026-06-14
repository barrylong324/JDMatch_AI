'use client';

import { useAuthStore } from '@/stores/auth-store';
import { User, Mail, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';

export default function SettingsPage() {
    const { user } = useAuthStore();
    const t = useTranslations('settings');
    const tCommon = useTranslations('common');

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-black">{t('title')}</h1>
                <p className="mt-1 text-sm text-gray-600">{t('description')}</p>
            </div>

            <Card className="divide-y divide-gray-200">
                {/* Profile Section */}
                <CardContent className="p-6">
                    <h3 className="text-lg font-medium text-black mb-4">
                        {t('profile.title')}
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center">
                            <User className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('profile.name')}
                                </label>
                                <p className="text-sm text-gray-900">{user?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <Mail className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    {t('profile.email')}
                                </label>
                                <p className="text-sm text-gray-900">{user?.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <Shield className="h-5 w-5 text-gray-400 mr-3" />
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Role
                                </label>
                                <p className="text-sm text-gray-900 capitalize">
                                    {user?.role || 'USER'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* API Configuration */}
                <CardContent className="p-6">
                    <h3 className="text-lg font-medium text-black mb-4">
                        {t('api.title')}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('api.apiKey')}
                            </label>
                            <input
                                type="text"
                                value={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                            />
                        </div>
                    </div>
                </CardContent>

                {/* About */}
                <CardContent className="p-6">
                    <h3 className="text-lg font-medium text-black mb-4">About</h3>
                    <div className="text-sm text-gray-600 space-y-2">
                        <p>
                            <strong>JDMatch AI</strong>
                        </p>
                        <p>Version: 0.2.0</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
