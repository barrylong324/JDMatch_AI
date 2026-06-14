import { redirect } from 'next/navigation';
import { defaultLocale } from '@/lib/locales';

/**
 * 根路径 / 的重定向兜底页
 * 
 * 当 Vercel Edge Middleware 未能正确处理 / → /zh 重定向时，
 * 此服务端组件确保用户始终被导航到默认语言页面，避免 404。
 */
export default function RootPage() {
    redirect(`/${defaultLocale}`);
}
