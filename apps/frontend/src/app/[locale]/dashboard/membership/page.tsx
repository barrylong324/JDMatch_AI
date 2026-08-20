'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, CreditCard, Crown, Smartphone, Wallet, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type PlanId = 'basic' | 'advanced' | 'pro' | 'supreme';
type PaymentId = 'wechat' | 'alipay' | 'bank';

const planDetails: Record<PlanId, { price: string; periodKey: 'perMonth'; features: string[] }> = {
    basic: { price: '9.9', periodKey: 'perMonth', features: ['match30', 'basicChat', 'resumeImage'] },
    advanced: { price: '19.9', periodKey: 'perMonth', features: ['match100', 'basicChat', 'resumeImage', 'fileUpload'] },
    pro: { price: '69.9', periodKey: 'perMonth', features: ['unlimitedMatch', 'basicChat', 'resumeImage', 'fileUpload'] },
    supreme: { price: '99.9', periodKey: 'perMonth', features: ['unlimitedMatch', 'basicChat', 'fileUpload', 'deliveryFlow', 'bossGreeting', 'deliveryUnlimited'] },
};

const paymentIcons = { wechat: Smartphone, alipay: Wallet, bank: CreditCard };

export default function MembershipPage() {
    const t = useTranslations('membership');
    const [selectedPlan, setSelectedPlan] = useState<PlanId>('pro');
    const [paymentMethod, setPaymentMethod] = useState<PaymentId>('wechat');
    const [paymentStarted, setPaymentStarted] = useState(false);
    const plan = planDetails[selectedPlan];

    return (
        <div className="mx-auto max-w-6xl space-y-8 pb-10">
            <section className="relative overflow-hidden rounded-2xl bg-black px-6 py-8 text-white sm:px-10 sm:py-10">
                <div className="relative z-10 max-w-2xl">
                    <div className="mb-4 flex items-center gap-2 text-amber-300">
                        <Crown className="h-4 w-4" />
                        <span className="text-sm font-semibold uppercase tracking-widest">VIP</span>
                    </div>
                    <h1 className="text-3xl font-bold sm:text-4xl">{t('title')}</h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-gray-300 sm:text-base">{t('description')}</p>
                    <div className="mt-6 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-gray-200">
                        {t('currentPlan')}
                    </div>
                </div>
                <Crown className="absolute -bottom-8 -right-5 h-40 w-40 rotate-12 text-white/10" />
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-bold text-black">{t('plansTitle')}</h2>
                <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                    {(Object.keys(planDetails) as PlanId[]).map((planId) => {
                        const details = planDetails[planId];
                        const isSelected = selectedPlan === planId;
                        return (
                            <Card
                                key={planId}
                                className={`relative h-full cursor-pointer border-2 transition-all ${isSelected ? 'border-black shadow-lg' : 'border-gray-200 hover:border-gray-400'}`}
                                onClick={() => { setSelectedPlan(planId); setPaymentStarted(false); }}
                            >
                                <CardContent className="flex h-full flex-col p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-black">{t(planId)}</h3>
                                                {/* {planId === 'supreme' && <span className="rounded-full bg-black px-2 py-0.5 text-xs font-semibold text-white">PRO</span>} */}
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">{t(`${planId}Desc`)}</p>
                                        </div>
                                        <div className={`flex h-5 w-5 min-h-5 min-w-5 flex-shrink-0 items-center justify-center rounded-full border ${isSelected ? 'border-black bg-black text-white' : 'border-gray-300'}`}>
                                            {isSelected && <Check className="h-3 w-3" />}
                                        </div>
                                    </div>
                                    <div className="mt-6 flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-black">¥{details.price}</span>
                                        <span className="text-sm text-gray-500">{t(details.periodKey)}</span>
                                    </div>
                                    <ul className="mt-6 flex-1 space-y-3 border-t border-gray-100 pt-5">
                                        {details.features.map((feature) => (
                                            <li key={feature} className="flex gap-2 text-sm text-gray-700">
                                                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
                                                {t(feature)}
                                            </li>
                                        ))}
                                        {planId === 'pro' && (
                                            <li className="pt-1">
                                                <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                                    {t('recommended')}
                                                </span>
                                            </li>
                                        )}
                                    </ul>
                                    <Button
                                        type="button"
                                        variant={isSelected ? 'default' : 'outline'}
                                        className="mt-7 w-full"
                                        onClick={(event) => { event.stopPropagation(); setSelectedPlan(planId); setPaymentStarted(false); }}
                                    >
                                        {isSelected ? t('selected') : t('choosePlan')}
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </section>

            <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
                <Card>
                    <CardContent className="p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-black">{t('paymentTitle')}</h2>
                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                            {(Object.keys(paymentIcons) as PaymentId[]).map((method) => {
                                const Icon = paymentIcons[method];
                                const isSelected = paymentMethod === method;
                                return (
                                    <button
                                        key={method}
                                        type="button"
                                        onClick={() => { setPaymentMethod(method); setPaymentStarted(false); }}
                                        className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${isSelected ? 'border-black bg-gray-50 ring-1 ring-black' : 'border-gray-200 hover:border-gray-400'}`}
                                    >
                                        <Icon className="h-4 w-4 text-gray-700" />
                                        <span className="text-sm font-medium text-black">{t(method)}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-5 flex items-start gap-2 text-sm text-gray-500">
                            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                            {t('paymentNotice')}
                        </p>
                    </CardContent>
                </Card>

                <Card className="h-fit border-gray-200">
                    <CardContent className="p-6">
                        <h2 className="text-lg font-bold text-black">{t('orderTitle')}</h2>
                        <div className="mt-5 space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600"><span>{t(selectedPlan)}</span><span>¥{plan.price}</span></div>
                            <div className="flex justify-between text-gray-600"><span>{t('membershipDuration')}</span><span>{t(plan.periodKey)}</span></div>
                            <div className="flex justify-between border-t border-gray-100 pt-4 text-base font-bold text-black"><span>{t('total')}</span><span>¥{plan.price}</span></div>
                        </div>
                        <Button type="button" className="mt-6 w-full bg-black text-white hover:bg-gray-800" onClick={() => setPaymentStarted(true)}>
                            {t('payNow')}
                        </Button>
                        {paymentStarted && <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">{t('paymentStarted')}</p>}
                        <p className="mt-4 text-center text-xs leading-5 text-gray-400">{t('securePayment')}</p>
                    </CardContent>
                </Card>
            </section>

            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">{t('demoNotice')}</p>
        </div>
    );
}