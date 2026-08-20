'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from '@/navigation';
import { Crown, LogOut, User } from 'lucide-react';
import LanguageSwitcher from './language-switcher';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export default function Navbar() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const t = useTranslations('auth');
    const tMembership = useTranslations('membership');
    const isVip = user?.role?.toUpperCase() === 'VIP';

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="bg-white border-b border-gray-200">
            <div className="flex items-center justify-end px-6 py-4">
                {/* <div>
                    <h2 className="text-2xl font-bold text-black">袁总的专属Rag知识库即将上线！</h2>
                </div> */}

                <div className="flex items-center space-x-4">
                    <LanguageSwitcher />

                    <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-gray-600" />
                        <span className="text-sm text-gray-700">{user?.name}</span>
                        {isVip ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">
                                <Crown className="h-3.5 w-3.5" />
                                {tMembership('vipLabel')}
                            </span>
                        ) : (
                            <Button
                                onClick={() => router.push('/dashboard/membership')}
                                size="sm"
                                className="h-8 bg-amber-500 px-3 text-xs text-white hover:bg-amber-600"
                            >
                                <Crown className="mr-1.5 h-3.5 w-3.5" />
                                {tMembership('upgrade')}
                            </Button>
                        )}
                    </div>

                    <Button
                        onClick={handleLogout}
                        variant="ghost"
                        className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>{t('logout')}</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
