'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { useAuthStore } from '@/stores/auth-store';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { isAuthenticated, initialize } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    // 在组件挂载时立即初始化认证状态
    useEffect(() => {
        initialize();
        setIsChecking(false);
    }, [initialize]);

    useEffect(() => {
        // 只有在检查完成后才进行重定向
        if (!isChecking && !isAuthenticated) {
            router.push('/login');
        }
    }, [isChecking, isAuthenticated, router]);

    // 等待初始化完成
    if (isChecking) {
        return (
            <div className="flex h-screen bg-white items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen bg-white">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar />
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
