'use client';

import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

export default function LandingFooter() {
    const t = useTranslations('landing.footer');
    const tAuth = useTranslations('auth');

    return (
        <footer className="py-8 px-6 bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-500">{t('copyright')}</p>
                <div className="flex items-center space-x-6">
                    <Link
                        href="/login"
                        className="text-sm text-gray-500 hover:text-black transition-colors"
                    >
                        {t('login')}
                    </Link>
                    <button
                        type="button"
                        className="text-sm text-gray-500 hover:text-black transition-colors cursor-pointer"
                        onClick={() => {
                            toast.info(tAuth('contactForAccount'), {
                                duration: 8000,
                                style: {
                                    background: '#fff',
                                    color: '#000',
                                    border: '1px solid #d1d5db',
                                },
                            });
                        }}
                    >
                        {t('register')}
                    </button>
                </div>
            </div>
        </footer>
    );
}
