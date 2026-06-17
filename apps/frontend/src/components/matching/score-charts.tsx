'use client';

import { useMemo } from 'react';
import {
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, Sparkles, Award } from 'lucide-react';

interface ScoreData {
    label: string;
    score: number;
    fullMark: number;
}

const DIMENSION_LABELS: Record<string, string> = {
    '综合匹配度': '综合',
    '关键词匹配度': '关键词',
    '技能匹配度': '技能',
    '经验匹配度': '经验',
    '学历匹配度': '学历',
};

/**
 * 从 AI 分析文本中解析各维度评分
 */
function parseScores(text: string): { overall: number | null; dimensions: ScoreData[] } {
    const dimensions: ScoreData[] = [];
    let overall: number | null = null;

    // 匹配 "评分：82 / 100" 或 "评分:82/100" 或 "**评分**：82"
    const sectionRegex = /###\s*\d+\.\s*(.+?)\n[\s\S]*?评分[：:]\s*(\d+)\s*\/\s*(\d+)/gi;
    let match: RegExpExecArray | null;

    while ((match = sectionRegex.exec(text)) !== null) {
        const rawLabel = match[1].replace(/[📊🔑🛠️💼🎓✅⚠️💡🎯]/g, '').trim();
        const score = parseInt(match[2], 10);
        const fullMark = parseInt(match[3], 10);

        // 找综合匹配度
        if (rawLabel.includes('综合')) {
            overall = score;
        }

        // 找各维度
        for (const [key, shortLabel] of Object.entries(DIMENSION_LABELS)) {
            if (rawLabel.includes(key.replace('度', ''))) {
                dimensions.push({ label: shortLabel, score, fullMark });
                break;
            }
        }
    }

    // 如果综合匹配度没有单独解析到，尝试其他模式
    if (overall === null) {
        const overallMatch = text.match(/(?:综合匹配度|整体匹配).*?(\d+)\s*\/\s*100/);
        if (overallMatch) {
            overall = parseInt(overallMatch[1], 10);
        }
    }

    return { overall, dimensions };
}

const RING_COLORS = [
    '#ef4444', // 0-39 红
    '#f97316', // 40-59 橙
    '#eab308', // 60-74 黄
    '#22c55e', // 75-89 绿
    '#16a34a', // 90-100 深绿
];

function getRingColor(score: number): string {
    if (score < 40) return RING_COLORS[0];
    if (score < 60) return RING_COLORS[1];
    if (score < 75) return RING_COLORS[2];
    if (score < 90) return RING_COLORS[3];
    return RING_COLORS[4];
}

const BAR_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

interface ScoreChartsProps {
    analysisText: string;
}

export default function ScoreCharts({ analysisText }: ScoreChartsProps) {
    const { overall, dimensions } = useMemo(() => parseScores(analysisText), [analysisText]);

    if (dimensions.length === 0 && overall === null) {
        return null; // 无法解析到评分时不显示
    }

    const ringColor = overall !== null ? getRingColor(overall) : '#6b7280';
    const circumference = 2 * Math.PI * 54; // r=54
    const offset = overall !== null ? circumference - (overall / 100) * circumference : circumference;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Overall Score Ring */}
            {overall !== null && (
                <Card className="border-gray-200 lg:col-span-1">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            综合匹配度
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center pt-2">
                        <div className="relative w-36 h-36">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                                <circle
                                    cx="60" cy="60" r="54"
                                    fill="none" stroke="#e5e7eb" strokeWidth="8"
                                />
                                <circle
                                    cx="60" cy="60" r="54"
                                    fill="none"
                                    stroke={ringColor}
                                    strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    className="transition-all duration-1000 ease-out"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold" style={{ color: ringColor }}>
                                    {overall}
                                </span>
                                <span className="text-xs text-gray-400">/ 100</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Dimension Bar Chart */}
            {dimensions.length > 0 && (
                <Card className="border-gray-200 lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            各维度评分
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={dimensions} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={{ stroke: '#e5e7eb' }}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={[0, 100]}
                                    tick={{ fontSize: 12, fill: '#6b7280' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                    }}
                                    formatter={(value: number) => [`${value} 分`, '评分']}
                                />
                                <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={40}>
                                    {dimensions.map((_, index) => (
                                        <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
