'use client';

import { useTranslations } from 'next-intl';
import { FileUp, Link, FileCheck } from 'lucide-react';

const stepIcons = [FileUp, Link, FileCheck];

export default function HowItWorksSection() {
    const t = useTranslations('landing.howItWorks');

    return (
        <section className="py-24 px-6 bg-white">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-black">{t('title')}</h2>
                    <p className="mt-4 text-lg text-gray-600">{t('subtitle')}</p>
                </div>

                <div className="relative">
                    {/* connecting line - desktop only */}
                    <div className="hidden lg:block absolute top-12 left-[16%] w-[68%] h-0.5 bg-gray-200" />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((step) => {
                            const Icon = stepIcons[step - 1];
                            return (
                                <div key={step} className="relative flex flex-col items-center text-center">
                                    {/* step circle */}
                                    <div className="relative z-10 flex items-center justify-center w-24 h-24 rounded-full bg-black text-white mb-6">
                                        <Icon className="h-10 w-10" />
                                    </div>
                                    {/* step number badge */}
                                    <span className="absolute top-16 right-1/2 translate-x-9 flex items-center justify-center w-7 h-7 rounded-full bg-white border-2 border-black text-xs font-bold text-black">
                                        {step}
                                    </span>
                                    <h3 className="text-xl font-semibold text-black mb-2">
                                        {t(`step${step}.title`)}
                                    </h3>
                                    <p className="text-sm text-gray-600 max-w-xs leading-relaxed">
                                        {t(`step${step}.description`)}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
