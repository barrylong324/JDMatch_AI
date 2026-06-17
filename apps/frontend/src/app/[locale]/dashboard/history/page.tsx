'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { FileText, ChevronRight, Calendar, Trash2, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMatchingAllMessage, delMatchingMessage } from '@/lib/requestModule/request-bus';

interface MatchingItem {
    id: string;
    title: string;
    resumeName: string | null;
    createdAt: string;
}

export default function HistoryPage() {
    const router = useRouter();
    const t = useTranslations('history');
    const [matchings, setMatchings] = useState<MatchingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    const loadMatchings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getMatchingAllMessage();
            const data = res?.data;
            setMatchings(data?.result || []);
        } catch (error) {
            console.error('Failed to load matchings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMatchings();
    }, [loadMatchings]);

    const handleDelete = async (conversationId: string) => {
        setDeletingId(conversationId);
        setConfirmDeleteId(null);
        try {
            await delMatchingMessage(conversationId);
            loadMatchings();
        } catch (error) {
            console.error('Failed to delete matching:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-black">{t('title')}</h1>
                <Button
                    className="bg-black text-white hover:bg-gray-800"
                    onClick={() => router.push('/dashboard/matching')}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    {t('startFirst')}
                </Button>
            </div>

            {/* Matching List */}
            {matchings.length === 0 ? (
                <Card className="border-gray-200">
                    <CardContent className="p-12 text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                        <p className="text-gray-500">{t('empty')}</p>
                        <p className="text-sm text-gray-400 mt-1">{t('startFirst')}</p>
                        <Button
                            className="mt-4 bg-black text-white hover:bg-gray-800"
                            onClick={() => router.push('/dashboard/matching')}
                        >
                            {t('startFirst')}
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {matchings.map((matching) => (
                        <div key={matching.id} className="relative group">
                            <Link href={`/dashboard/matching/${matching.id}`}>
                                <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                                    <h3 className="text-lg font-semibold text-black truncate">
                                                        {matching.title || t('untitled')}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-500 ml-8">
                                                    <span className="flex items-center">
                                                        <Calendar className="h-3.5 w-3.5 mr-1" />
                                                        {formatDate(matching.createdAt)}
                                                    </span>
                                                    {matching.resumeName && (
                                                        <span className="flex items-center truncate">
                                                            <FileText className="h-3.5 w-3.5 mr-1" />
                                                            {matching.resumeName}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                            {/* Delete button */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setConfirmDeleteId(matching.id);
                                }}
                                disabled={deletingId === matching.id}
                                className="absolute bottom-3 right-3 p-1.5 rounded-full bg-white/80 border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 z-10"
                                title={t('delete')}
                            >
                                {deletingId === matching.id ? (
                                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                                ) : (
                                    <Trash2 className="h-3.5 w-3.5" />
                                )}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete confirmation dialog */}
            {confirmDeleteId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setConfirmDeleteId(null)}
                    />
                    <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 z-10">
                        <h3 className="text-lg font-semibold text-black mb-2">
                            {t('deleteConfirmTitle')}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {t('deleteConfirmMessage')}
                        </p>
                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={!!deletingId}
                            >
                                {t('cancel')}
                            </Button>
                            <Button
                                className="bg-red-600 text-white hover:bg-red-700"
                                onClick={() => handleDelete(confirmDeleteId)}
                                disabled={!!deletingId}
                            >
                                {deletingId ? t('deleting') : t('delete')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
