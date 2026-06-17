'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import {
    ArrowLeft, FileText, ExternalLink, Bot, Loader2,
    ChevronDown, ChevronUp, Calendar, User, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { getMatchingById } from '@/lib/requestModule/request-bus';
import remarkGfm from 'remark-gfm';
import ScoreCharts from '@/components/matching/score-charts';

const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

interface MatchDetail {
    id: string;
    title: string;
    status: 'COMPLETED' | 'IN_PROGRESS';
    resumeName: string | null;
    resumeUrl: string | null;
    userMessage: string | null;
    assistantMessage: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function MatchingDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const t = useTranslations('matchingDetail');
    const tc = useTranslations('common');
    const [detail, setDetail] = useState<MatchDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [showResume, setShowResume] = useState(false);
    const [showJD, setShowJD] = useState(false);

    useEffect(() => {
        if (!id) return;
        loadDetail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const loadDetail = async () => {
        setLoading(true);
        try {
            const res = await getMatchingById(id);
            setDetail(res?.data?.result || null);
        } catch (error) {
            toast.error('加载匹配详情失败');
        } finally {
            setLoading(false);
        }
    };

    // 从 USER 消息中提取简历内容和 JD 内容
    const extractSections = (userMessage: string | null) => {
        if (!userMessage) return { resume: '', jd: '' };

        const resumeMatch = userMessage.match(/## 简历内容\n([\s\S]*?)(?=\n## 目标岗位|$)/);
        const jdMatch = userMessage.match(/## 目标岗位\n([\s\S]*?)$/);

        return {
            resume: resumeMatch?.[1]?.trim() || '',
            jd: jdMatch?.[1]?.trim()?.replace(/^\*\*来源链接\*\*: .+\n\n/, '') || '',
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!detail) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500">{tc('error')}</p>
                <Button
                    className="mt-4 bg-black text-white hover:bg-gray-800"
                    onClick={() => router.push('/dashboard/history')}
                >
                    {t('backToHistory')}
                </Button>
            </div>
        );
    }

    const { resume, jd } = extractSections(detail.userMessage);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard/history')}
                    className="border-gray-300 text-gray-600"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {t('backToHistory')}
                </Button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-black">{detail.title}</h1>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {new Date(detail.createdAt).toLocaleDateString('zh-CN', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit',
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Resume Preview Card */}
            <Card className="border-gray-200">
                <CardHeader
                    className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                    onClick={() => setShowResume(!showResume)}
                >
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5 text-black" />
                            {t('uploadedResume')}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {detail.resumeUrl && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-gray-300 text-gray-600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(detail.resumeUrl!, '_blank');
                                    }}
                                >
                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                    {t('downloadResume')}
                                </Button>
                            )}
                            {showResume ? (
                                <ChevronUp className="h-5 w-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            )}
                        </div>
                    </div>
                    {detail.resumeName && (
                        <CardDescription>{detail.resumeName}</CardDescription>
                    )}
                </CardHeader>
                {showResume && (
                    <CardContent className="border-t border-gray-100 p-0">
                        {detail.resumeUrl ? (
                            detail.resumeName?.endsWith('.pdf') ? (
                                <iframe
                                    src={detail.resumeUrl}
                                    className="w-full h-[600px] rounded-b-lg"
                                    title="Resume Preview"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <FileText className="h-16 w-16 text-gray-300" />
                                    <p className="text-gray-500 text-sm">{detail.resumeName}</p>
                                    <Button
                                        variant="outline"
                                        onClick={() => window.open(detail.resumeUrl!, '_blank')}
                                        className="border-gray-300"
                                    >
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        {t('downloadResume')}
                                    </Button>
                                </div>
                            )
                        ) : (
                            <p className="text-sm text-gray-400 py-8 text-center">
                                {t('noResumeContent')}
                            </p>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* JD Preview Card */}
            <Card className="border-gray-200">
                <CardHeader
                    className="cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
                    onClick={() => setShowJD(!showJD)}
                >
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Globe className="h-5 w-5 text-black" />
                            {t('jobDescription')}
                        </CardTitle>
                        {showJD ? (
                            <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                    </div>
                    <CardDescription>{t('jobDescriptionHint')}</CardDescription>
                </CardHeader>
                {showJD && (
                    <CardContent className="border-t border-gray-100">
                        {jd ? (
                            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                                {jd}
                            </pre>
                        ) : (
                            <p className="text-sm text-gray-400 py-4 text-center">
                                {t('noJDContent')}
                            </p>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* AI Analysis Report */}
            <Card className="border-gray-200">
                <CardHeader className="border-b border-gray-100">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="h-5 w-5 text-black" />
                        {t('aiAnalysisReport')}
                    </CardTitle>
                    <CardDescription>{t('aiAnalysisHint')}</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {detail.assistantMessage ? (
                        <>
                            <ScoreCharts analysisText={detail.assistantMessage} />
                            <div className="prose prose-gray max-w-none prose-headings:text-black prose-h2:text-xl prose-h2:font-bold prose-h3:text-lg prose-h3:font-semibold prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-black prose-table:text-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {detail.assistantMessage}
                                </ReactMarkdown>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">{t('analysisInProgress')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
