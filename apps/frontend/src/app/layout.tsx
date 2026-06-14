import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// 加载 Google Inter 字体，子集为 latin（英文字符集）
const inter = Inter({ subsets: ['latin'] });

// 页面元数据，用于 SEO 和浏览器标签页标题 生成<title>和<meta>标签
export const metadata: Metadata = {
    title: 'JDMatch AI - 简历岗位智能匹配',
    description: 'AI 驱动的简历-岗位匹配分析平台，上传简历+粘贴岗位链接，即刻获取匹配度评分与专业优化建议。',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="zh">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
