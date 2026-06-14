'use client';

import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/layout/language-switcher';
import { Button } from '@/components/ui/button';

export default function LandingNavbar() {
    const t = useTranslations('landing.nav');

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
                <Link href="/" className="text-xl font-bold text-black hover:text-gray-700 transition-colors">
                    {t('appName')}
                </Link>

                <div className="flex items-center space-x-4">
                    <LanguageSwitcher />
                    <Button asChild variant="outline" className="border-black text-black hover:bg-gray-100">
                        <Link href="/login">{t('login')}</Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
