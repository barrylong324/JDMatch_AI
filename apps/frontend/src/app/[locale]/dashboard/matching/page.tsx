'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import {
    Upload, Link, FileText, X, Loader2, Sparkles,
    Globe, ClipboardPaste, Bot, Download, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { streamMatching, type SSEDataChunk } from '@/lib/requestModule/request-bus';
import remarkGfm from 'remark-gfm';
import ScoreCharts from '@/components/matching/score-charts';

// 动态导入 Markdown 渲染器，避免 SSR 问题
const ReactMarkdown = dynamic(() => import('react-markdown'), { ssr: false });

type JdInputMode = 'url' | 'text';

export default function MatchingPage() {
    const t = useTranslations('matching');

    // ---- 简历文件状态 ----
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ---- JD 输入状态 ----
    const [jdMode, setJdMode] = useState<JdInputMode>('url');
    const [jdUrl, setJdUrl] = useState('');
    const [jdContent, setJdContent] = useState('');

    // ---- 分析状态 ----
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisText, setAnalysisText] = useState('');
    const [conversationId, setConversationId] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    // ============================
    // 文件处理
    // ============================
    const handleFileSelect = useCallback((file: File) => {
        const validTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ];
        if (!validTypes.includes(file.type)) {
            toast.error('请上传 PDF 或 DOCX 格式的文件');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('文件大小不能超过 10MB');
            return;
        }
        setResumeFile(file);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const removeFile = useCallback(() => {
        setResumeFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    // ============================
    // 开始匹配分析（SSE 流式）
    // ============================
    const handleStartMatching = async () => {
        if (!resumeFile) {
            toast.error(t('noResume'));
            return;
        }
        if (jdMode === 'url' && !jdUrl.trim()) {
            toast.error(t('noJD'));
            return;
        }
        if (jdMode === 'text' && !jdContent.trim()) {
            toast.error(t('noJDContent'));
            return;
        }

        setIsAnalyzing(true);
        setAnalysisText('');
        setConversationId('');

        try {
            const formData = new FormData();
            formData.append('resume', resumeFile);

            if (jdMode === 'url') {
                formData.append('jdUrl', jdUrl.trim());
            } else {
                formData.append('jdContent', jdContent.trim());
            }

            // SSE 流式调用
            for await (const chunk of streamMatching(formData)) {
                switch (chunk.type) {
                    case 'meta':
                        if (chunk.matchingId) setConversationId(chunk.matchingId);
                        break;

                    case 'token':
                        setAnalysisText(prev => prev + (chunk.content || ''));
                        break;

                    case 'error':
                        toast.error(chunk.content || '分析失败，请稍后再试');
                        break;

                    case 'done':
                        toast.success('匹配分析完成！');
                        break;
                }
            }
        } catch (error: any) {
            console.error('Matching error:', error);
            toast.error(error.message || '分析失败，请检查网络连接后重试');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // ============================
    // 取消分析
    // ============================
    const handleCancel = () => {
        if (abortRef.current) {
            abortRef.current.abort();
        }
        setIsAnalyzing(false);
    };

    // ============================
    // 重新开始
    // ============================
    const handleReset = () => {
        setAnalysisText('');
        setConversationId('');
    };

    // ============================
    // 下载分析报告
    // ============================
    const handleDownloadReport = () => {
        if (!analysisText) return;

        const blob = new Blob([analysisText], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `匹配分析报告_${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('报告下载成功');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold text-black">{t('title')}</h1>
                <p className="mt-2 text-gray-600">{t('resultTitle')}</p>
            </div>

            {/* Input Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ===== 简历上传 ===== */}
                <Card className="border-gray-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5" />
                            {t('uploadResume')}
                        </CardTitle>
                        <CardDescription>{t('uploadHint')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {resumeFile ? (
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="h-8 w-8 text-black flex-shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-black truncate">{resumeFile.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {(resumeFile.size / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={removeFile}
                                    disabled={isAnalyzing}
                                    className="text-gray-400 hover:text-red-500 flex-shrink-0 disabled:opacity-30"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div
                                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragOver
                                    ? 'border-black bg-gray-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                onDrop={handleDrop}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    setDragOver(true);
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    setDragOver(false);
                                }}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                                <p className="text-sm text-gray-600 text-center">
                                    {t('dragDropHint')}
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf,.docx"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileSelect(file);
                                    }}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ===== JD 输入（链接 / 文本） ===== */}
                <Card className="border-gray-200">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Globe className="h-5 w-5" />
                            {t('pasteJD')}
                        </CardTitle>
                        <CardDescription>
                            {jdMode === 'url' ? t('jdUrlLabel') : t('jdTextLabel')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Tab 切换 */}
                        <div className="flex gap-1 mb-4 p-1 bg-gray-100 rounded-lg">
                            <button
                                onClick={() => setJdMode('url')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${jdMode === 'url'
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Link className="h-4 w-4" />
                                {t('jdTabUrl')}
                            </button>
                            <button
                                onClick={() => setJdMode('text')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${jdMode === 'text'
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <ClipboardPaste className="h-4 w-4" />
                                {t('jdTabText')}
                            </button>
                        </div>

                        {/* 链接输入 */}
                        {jdMode === 'url' && (
                            <Input
                                placeholder={t('jdPlaceholder')}
                                value={jdUrl}
                                onChange={(e) => setJdUrl(e.target.value)}
                                disabled={isAnalyzing}
                                className="border-gray-300 focus:border-black focus:ring-black"
                            />
                        )}

                        {/* 文本输入 */}
                        {jdMode === 'text' && (
                            <Textarea
                                placeholder={t('jdTextPlaceholder')}
                                value={jdContent}
                                onChange={(e) => setJdContent(e.target.value)}
                                disabled={isAnalyzing}
                                rows={8}
                                className="border-gray-300 focus:border-black focus:ring-black resize-none text-sm"
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ===== 操作按钮 ===== */}
            <div className="flex justify-center gap-4">
                {!analysisText ? (
                    <Button
                        onClick={handleStartMatching}
                        disabled={isAnalyzing}
                        size="lg"
                        className="bg-black text-white hover:bg-gray-800 text-base px-12 py-6"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {t('matchingInProgress')}
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-5 w-5" />
                                {t('startMatching')}
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="flex gap-3">
                        <Button
                            onClick={handleReset}
                            variant="outline"
                            size="lg"
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            <RefreshCw className="mr-2 h-5 w-5" />
                            {t('newAnalysis')}
                        </Button>
                        <Button
                            onClick={handleDownloadReport}
                            size="lg"
                            className="bg-black text-white hover:bg-gray-800"
                        >
                            <Download className="mr-2 h-5 w-5" />
                            {t('downloadReport')}
                        </Button>
                    </div>
                )}
            </div>

            {/* ===== AI 分析报告 ===== */}
            {analysisText && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ScoreCharts analysisText={analysisText} />
                    <Card className="border-gray-200">
                        <CardHeader className="border-b border-gray-100">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Bot className="h-5 w-5 text-black" />
                                {t('analysisReport')}
                            </CardTitle>
                            <CardDescription>
                                {t('aiGeneratedReport')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="prose prose-gray max-w-none prose-headings:text-black prose-h2:text-xl prose-h2:font-bold prose-h3:text-lg prose-h3:font-semibold prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-black prose-table:text-sm">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {analysisText}
                                </ReactMarkdown>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
