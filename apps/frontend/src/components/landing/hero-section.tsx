'use client';

import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ArrowDown } from 'lucide-react';

export default function HeroSection() {
    const t = useTranslations('landing.hero');

    const scrollToFeatures = () => {
        document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <section className="relative min-h-[calc(100vh-65px)] flex items-center justify-center px-6">
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-5xl md:text-7xl font-bold text-black leading-tight tracking-tight">
                    {t('title')}
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    {t('subtitle')}
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        asChild
                        size="lg"
                        className="bg-black text-white hover:bg-gray-800 text-base px-8 py-6"
                    >
                        <Link href="/login">{t('ctaStart')}</Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="lg"
                        className="border-black text-black hover:bg-gray-100 text-base px-8 py-6"
                        onClick={scrollToFeatures}
                    >
                        {t('ctaLearnMore')}
                        <ArrowDown className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </section>
    );
}
