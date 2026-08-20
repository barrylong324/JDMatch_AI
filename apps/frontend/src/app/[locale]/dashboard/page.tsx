'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Target, Star, Calendar, TrendingUp, Bot, CreditCard, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAiChatConversations, getMatchingAllMessage } from '@/lib/requestModule/request-bus';

interface Stats {
    totalMatchings: number;
    avgScore: number;
    thisMonth: number;
    highestScore: number;
}

interface AiUsageRecord {
    id: string;
    title: string;
    updatedAt: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [stats, setStats] = useState<Stats>({
        totalMatchings: 0,
        avgScore: 0,
        thisMonth: 0,
        highestScore: 0,
    });
    const [loading, setLoading] = useState(true);
    const [aiUsageRecords, setAiUsageRecords] = useState<AiUsageRecord[]>([]);
    const t = useTranslations('dashboard');

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const convRes = await getMatchingAllMessage();
            const total = convRes?.data?.result?.length || 0;

            setStats({
                totalMatchings: total,
                avgScore: 0,
                thisMonth: total,
                highestScore: 0,
            });

            try {
                const aiChatRes = await getAiChatConversations(1, 50);
                setAiUsageRecords(aiChatRes?.data?.result?.conversations || []);
            } catch (error) {
                console.error('Failed to load AI chat history:', error);
                setAiUsageRecords([]);
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: t('stats.totalMatchings'),
            value: stats.totalMatchings,
            icon: Target,
            color: 'bg-black',
        },
        {
            title: t('stats.avgScore'),
            value: stats.avgScore,
            suffix: '分',
            icon: Star,
            color: 'bg-gray-700',
        },
        {
            title: t('stats.thisMonth'),
            value: stats.thisMonth,
            icon: Calendar,
            color: 'bg-gray-800',
        },
        {
            title: t('stats.highestScore'),
            value: stats.highestScore,
            suffix: '分',
            icon: TrendingUp,
            color: 'bg-gray-900',
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-black">{t('title')}</h1>
                <p className="mt-1 text-sm text-gray-600">
                    {t('welcome')}，{user?.name}
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <Card key={stat.title} className="border-gray-200">
                            <CardContent className="p-5">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 rounded-md p-3 ${stat.color}`}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-500">{stat.title}</p>
                                        <p className="text-2xl font-bold text-black">
                                            {stat.value}
                                            {stat.suffix && (
                                                <span className="text-sm font-normal text-gray-400 ml-0.5">
                                                    {stat.suffix}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card className="border-gray-200">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-md bg-gray-100 p-2.5">
                                    <Bot className="h-5 w-5 text-gray-700" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-black">{t('records.aiUsage.title')}</h2>
                                    <p className="mt-0.5 text-xs text-gray-500">{t('records.aiUsage.source')}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => router.push('/dashboard/ai-assistant')}>
                                {t('records.viewAll')}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                        {aiUsageRecords.length === 0 ? (
                            <div className="flex min-h-28 items-center justify-center px-5 py-4 text-center">
                                <p className="text-sm text-gray-500">{t('records.aiUsage.empty')}</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {aiUsageRecords.map((record) => (
                                    <div key={record.id} className="flex items-center justify-between gap-4 px-5 py-4">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-black">{record.title}</p>
                                        </div>
                                        <time className="flex-shrink-0 text-xs text-gray-400">
                                            {new Date(record.updatedAt).toLocaleString()}
                                        </time>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-gray-200">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-md bg-gray-100 p-2.5">
                                    <CreditCard className="h-5 w-5 text-gray-700" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-black">{t('records.recharge.title')}</h2>
                                    <p className="mt-0.5 text-xs text-gray-500">{t('records.recharge.source')}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-gray-500" onClick={() => router.push('/dashboard/membership')}>
                                {t('records.viewAll')}
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex min-h-28 items-center justify-center px-5 py-4 text-center">
                            <p className="text-sm text-gray-500">{t('records.recharge.empty')}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

