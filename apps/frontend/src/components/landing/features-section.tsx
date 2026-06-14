'use client';

import { useTranslations } from 'next-intl';
import { Target, BarChart3, Lightbulb, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const featureIcons = [
    { Icon: Target, key: 'multiDomain' },
    { Icon: BarChart3, key: 'aiFollowUp' },
    { Icon: Lightbulb, key: 'instantFeedback' },
    { Icon: Clock, key: 'history' },
];

export default function FeaturesSection() {
    const t = useTranslations('landing.features');

    return (
        <section id="features" className="py-24 px-6 bg-gray-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-black">{t('title')}</h2>
                    <p className="mt-4 text-lg text-gray-600">{t('subtitle')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {featureIcons.map(({ Icon, key }) => (
                        <Card key={key} className="border-gray-200 hover:shadow-md transition-shadow">
                            <CardContent className="p-6 text-center">
                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-black text-white mb-4">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-black mb-2">
                                    {t(`${key}.title`)}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {t(`${key}.description`)}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
