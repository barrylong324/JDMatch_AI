'use client';

import { useEffect, useState, useCallback } from 'react';
import { Link, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Clock, Target, Star, ChevronRight, Calendar, Trash2, ChevronLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMatchingAllMessage, delMatchingMessage } from '@/lib/requestModule/request-bus';

const PAGE_SIZE = 10;

interface MatchingItem {
    id: string;
    title: string;
    position: string | null;
    status: string;
    matchScore: number | null;
    createdAt: string;
    _count?: { messages: number };
}

type FilterType = 'all' | 'COMPLETED' | 'IN_PROGRESS';

export default function HistoryPage() {
    const router = useRouter();
    const t = useTranslations('history');
    const tCommon = useTranslations('common');
    const [matchings, setMatchings] = useState<MatchingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('all');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const loadMatchings = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const res = await getMatchingAllMessage(p, PAGE_SIZE);
            const data = res?.data;
            setMatchings(data?.result || []);
            setTotalPages(data?.totalPages || 1);
            setTotal(data?.total || 0);
        } catch (error) {
            console.error('Failed to load matchings:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadMatchings(page);
    }, [page, loadMatchings]);

    const handleDelete = async (conversationId: string) => {
        setDeletingId(conversationId);
        setConfirmDeleteId(null);
        try {
            await delMatchingMessage(conversationId);
            loadMatchings(page);
        } catch (error) {
            console.error('Failed to delete matching:', error);
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = filter === 'all'
        ? matchings
        : matchings.filter((i) => i.status === filter);
    const getStatusBadge = (status: string) => {
        if (status === 'COMPLETED') {
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    {t('filterCompleted')}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                {t('filterInProgress')}
            </span>
        );
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

    const filterButtons: { key: FilterType; label: string }[] = [
        { key: 'all', label: t('filterAll') },
        { key: 'COMPLETED', label: t('filterCompleted') },
        { key: 'IN_PROGRESS', label: t('filterInProgress') },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-black">{t('title')}</h1>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-2">
                {filterButtons.map((btn) => (
                    <Button
                        key={btn.key}
                        variant={filter === btn.key ? 'default' : 'outline'}
                        size="sm"
                        className={
                            filter === btn.key
                                ? 'bg-black text-white hover:bg-gray-800'
                                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }
                        onClick={() => setFilter(btn.key)}
                    >
                        {btn.label}
                    </Button>
                ))}
            </div>

            {/* Matching List */}
            {filtered.length === 0 ? (
                <Card className="border-gray-200">
                    <CardContent className="p-12 text-center">
                        <Target className="mx-auto h-12 w-12 text-gray-300 mb-4" />
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
                    {filtered.map((matching) => (
                        <div key={matching.id} className="relative group">
                            <Link
                                href={
                                    matching.status === 'COMPLETED'
                                        ? `/dashboard/matching/${matching.id}`
                                        : `/dashboard/matching`
                                }
                            >
                                <Card className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <h3 className="text-lg font-semibold text-black truncate">
                                                        {matching.title || t('untitled')}
                                                    </h3>
                                                    {getStatusBadge(matching.status)}
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <span className="flex items-center">
                                                        <Calendar className="h-3.5 w-3.5 mr-1" />
                                                        {formatDate(matching.createdAt)}
                                                    </span>
                                                    {matching.position && (
                                                        <span className="flex items-center">
                                                            <Target className="h-3.5 w-3.5 mr-1" />
                                                            {matching.position}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4 ml-4">
                                                {matching.matchScore != null && (
                                                    <div className="flex items-center space-x-1">
                                                        <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                                        <span className="text-lg font-bold text-black">
                                                            {matching.matchScore}%
                                                        </span>
                                                    </div>
                                                )}
                                                <ChevronRight className="h-5 w-5 text-gray-400" />
                                            </div>
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

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-gray-500">
                        {t('paginationInfo', { current: page, total: totalPages, count: total })}
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="border-gray-300 text-gray-600"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            {tCommon('previous')}
                        </Button>
                        {/* Page numbers */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((p) => {
                                // Show first, last, current, and neighbors
                                return p === 1 || p === totalPages || Math.abs(p - page) <= 1;
                            })
                            .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                                    acc.push('ellipsis');
                                }
                                acc.push(p);
                                return acc;
                            }, [])
                            .map((item, idx) =>
                                item === 'ellipsis' ? (
                                    <span key={`e-${idx}`} className="px-2 text-gray-400">...</span>
                                ) : (
                                    <Button
                                        key={item}
                                        variant={page === item ? 'default' : 'outline'}
                                        size="sm"
                                        className={
                                            page === item
                                                ? 'bg-black text-white hover:bg-gray-800'
                                                : 'border-gray-300 text-gray-600'
                                        }
                                        onClick={() => setPage(item as number)}
                                    >
                                        {item}
                                    </Button>
                                ),
                            )}
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="border-gray-300 text-gray-600"
                        >
                            {tCommon('next')}
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
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
                                {tCommon('cancel')}
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
