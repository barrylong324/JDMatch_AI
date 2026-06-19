'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function CtaSection() {
    const t = useTranslations('landing.cta');
    const tAuth = useTranslations('auth');

    return (
        <section className="py-24 px-6 bg-gray-50">
            <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-black">{t('title')}</h2>
                <p className="mt-4 text-lg text-gray-600">{t('subtitle')}</p>
                <div className="mt-8">
                    <Button
                        size="lg"
                        className="bg-black text-white hover:bg-gray-800 text-base px-10 py-6"
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
                        {t('button')}
                    </Button>
                </div>
            </div>
        </section>
    );
}
