'use client';

import { useState, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, Link, FileText, X, Loader2, Target, Sparkles, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

export default function MatchingPage() {
    const t = useTranslations('matching');
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [jdUrl, setJdUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<MatchResult | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ---- File handling ----
    const handleFileSelect = useCallback((file: File) => {
        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
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

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    }, []);

    const removeFile = useCallback(() => {
        setResumeFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    // ---- Start matching ----
    const handleStartMatching = async () => {
        if (!resumeFile) {
            toast.error(t('noResume'));
            return;
        }
        if (!jdUrl.trim()) {
            toast.error(t('noJD'));
            return;
        }

        setIsAnalyzing(true);
        setResult(null);

        try {
            // TODO: Call actual API
            // Simulate analysis for now
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Mock result
            setResult({
                overallMatch: 78,
                keywordMatch: 82,
                skillMatch: 75,
                experienceMatch: 70,
                educationMatch: 85,
                strengths: [
                    '技术栈与岗位要求高度吻合，React/TypeScript 经验丰富',
                    '项目经验与岗位描述中的业务场景匹配度高',
                    '学历背景符合岗位要求',
                ],
                weaknesses: [
                    '缺少岗位要求的 Node.js 后端开发经验',
                    '系统设计相关项目经验偏少',
                    '团队管理经验描述不够突出',
                ],
                suggestions: [
                    '建议在简历中补充 Node.js / Express 相关项目经验',
                    '增加系统设计案例，突出架构设计能力',
                    '量化团队协作成果，如"带领 X 人团队完成 Y 项目"',
                    '在技能栏增加 DevOps / CI/CD 相关关键词',
                ],
                skillGaps: ['Node.js', 'Docker', 'Kubernetes', 'System Design'],
            });
        } catch (error: any) {
            toast.error(error.message || '分析失败，请稍后再试');
        } finally {
            setIsAnalyzing(false);
        }
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
                {/* Resume Upload */}
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
                                        <p className="text-xs text-gray-500">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                </div>
                                <button onClick={removeFile} className="text-gray-400 hover:text-red-500 flex-shrink-0">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        ) : (
                            <div
                                className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragOver ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="h-10 w-10 text-gray-400 mb-3" />
                                <p className="text-sm text-gray-600 text-center">{t('dragDropHint')}</p>
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

                {/* JD Link Input */}
                <Card className="border-gray-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Link className="h-5 w-5" />
                            {t('pasteJD')}
                        </CardTitle>
                        <CardDescription>{t('jdUrlLabel')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Input
                            placeholder={t('jdPlaceholder')}
                            value={jdUrl}
                            onChange={(e) => setJdUrl(e.target.value)}
                            className="border-gray-300 focus:border-black focus:ring-black"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Start Button */}
            <div className="flex justify-center">
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
            </div>

            {/* Result Section */}
            {result && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Overall Score */}
                    <Card className="border-gray-200 bg-gradient-to-r from-black to-gray-800 text-white">
                        <CardContent className="p-8 text-center">
                            <p className="text-lg text-gray-300 mb-2">{t('overallMatch')}</p>
                            <div className="flex items-center justify-center gap-4">
                                <span className="text-6xl font-bold">{result.overallMatch}</span>
                                <span className="text-3xl text-gray-400">/100</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dimension Scores */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: t('keywordMatch'), score: result.keywordMatch, icon: Target },
                            { label: t('skillMatch'), score: result.skillMatch, icon: Sparkles },
                            { label: t('experienceMatch'), score: result.experienceMatch, icon: TrendingUp },
                            { label: t('educationMatch'), score: result.educationMatch, icon: CheckCircle2 },
                        ].map(({ label, score, icon: Icon }) => (
                            <Card key={label} className="border-gray-200">
                                <CardContent className="p-4 text-center">
                                    <Icon className="h-6 w-6 text-black mx-auto mb-2" />
                                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                                    <p className="text-2xl font-bold text-black">{score}<span className="text-sm text-gray-400">%</span></p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Strengths */}
                        <Card className="border-gray-200 border-l-4 border-l-green-500">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                                    <CheckCircle2 className="h-5 w-5" />
                                    {t('strengths')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {result.strengths.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="text-green-500 mt-1">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Weaknesses */}
                        <Card className="border-gray-200 border-l-4 border-l-orange-500">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                                    <AlertCircle className="h-5 w-5" />
                                    {t('weaknesses')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2">
                                    {result.weaknesses.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                            <span className="text-orange-500 mt-1">•</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Suggestions */}
                    <Card className="border-gray-200">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-black" />
                                {t('suggestions')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {result.suggestions.map((item, i) => (
                                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                        <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs font-bold">
                                            {i + 1}
                                        </span>
                                        <p className="text-sm text-gray-700">{item}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skill Gaps */}
                    {result.skillGaps && result.skillGaps.length > 0 && (
                        <Card className="border-gray-200">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Target className="h-5 w-5 text-black" />
                                    {t('skillGap')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {result.skillGaps.map((skill) => (
                                        <span
                                            key={skill}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-50 text-red-700 border border-red-200"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
}

interface MatchResult {
    overallMatch: number;
    keywordMatch: number;
    skillMatch: number;
    experienceMatch: number;
    educationMatch: number;
    strengths: string[];
    weaknesses: string[];
    suggestions: string[];
    skillGaps: string[];
}
