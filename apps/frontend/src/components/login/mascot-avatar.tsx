'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface PupilPosition {
    x: number;
    y: number;
}

export default function MascotAvatar() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [leftPupil, setLeftPupil] = useState<PupilPosition>({ x: 0, y: 0 });
    const [rightPupil, setRightPupil] = useState<PupilPosition>({ x: 0, y: 0 });
    const [blinking, setBlinking] = useState(false);

    // 眨眼动画
    useEffect(() => {
        const blinkInterval = setInterval(() => {
            setBlinking(true);
            setTimeout(() => setBlinking(false), 150);
        }, 3000 + Math.random() * 2000);
        return () => clearInterval(blinkInterval);
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const faceCenterX = rect.left + rect.width / 2;
        const faceCenterY = rect.top + rect.height * 0.42;

        const dx = e.clientX - faceCenterX;
        const dy = e.clientY - faceCenterY;

        const maxDistance = 8;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = Math.min(distance / 200, 1) * maxDistance;

        const angle = Math.atan2(dy, dx);
        const pupilX = Math.cos(angle) * scale;
        const pupilY = Math.sin(angle) * scale;

        setLeftPupil({ x: pupilX, y: pupilY });
        setRightPupil({ x: pupilX, y: pupilY });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setLeftPupil({ x: 0, y: 0 });
        setRightPupil({ x: 0, y: 0 });
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full flex items-center justify-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* ====== 简历草图背景 ====== */}
            <div
                className="absolute w-80 h-[27rem] bg-white border border-gray-200 rounded-md"
                style={{
                    boxShadow: '4px 6px 24px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
                    animation: 'float 6s ease-in-out infinite',
                    transform: 'rotate(-2deg)',
                }}
            >
                {/* 简历头部：名字 + 照片占位 */}
                <div className="px-6 pt-6">
                    {/* 名字行 - 用真实文字 */}
                    <p className="text-base font-bold text-gray-800 mb-1.5 tracking-wide">
                        移动鼠标，我会看着你哦 👀
                    </p>
                    {/* 联系方式行 */}
                    <div className="w-44 h-2 bg-gray-300 rounded-full mb-1.5" />
                    <div className="w-32 h-2 bg-gray-300 rounded-full mb-3" />
                    {/* 分割线 */}
                    <div className="w-full h-px bg-gray-200 mb-4" />
                </div>

                {/* 照片圆圈占位（右上角） */}
                <div
                    className="absolute w-14 h-14 rounded-full border-2 border-dashed border-gray-300 bg-gray-50"
                    style={{ top: '18px', right: '20px' }}
                />

                {/* 简历内容 */}
                <div className="px-6 space-y-2.5">
                    {/* 小节标题 */}
                    <div className="w-20 h-3 bg-gray-600 rounded-full mb-1" />
                    {/* 条目 1 */}
                    <div className="w-full h-2 bg-gray-200 rounded-full" />
                    <div className="w-5/6 h-2 bg-gray-200 rounded-full" />
                    <div className="w-4/6 h-2 bg-gray-200 rounded-full mb-0.5" />
                    <div className="h-1.5" />
                    {/* 条目 2 */}
                    <div className="w-full h-2 bg-gray-200 rounded-full" />
                    <div className="w-3/4 h-2 bg-gray-200 rounded-full" />
                    <div className="w-2/3 h-2 bg-gray-200 rounded-full mb-0.5" />
                    <div className="h-1.5" />
                    {/* 小节标题 */}
                    <div className="w-16 h-3 bg-gray-600 rounded-full mb-1" />
                    {/* 条目 3 */}
                    <div className="w-full h-2 bg-gray-200 rounded-full" />
                    <div className="w-4/5 h-2 bg-gray-200 rounded-full" />
                    <div className="w-3/5 h-2 bg-gray-200 rounded-full" />
                </div>
            </div>

            {/* ====== 脸部主体 ====== */}
            <div
                className="relative w-56 h-56 bg-white rounded-full border-4 border-black flex items-center justify-center z-10"
                style={{
                    boxShadow: '8px 8px 0px rgba(0,0,0,0.15), inset -8px -8px 20px rgba(0,0,0,0.03)',
                    animation: 'float 6s ease-in-out 0.2s infinite',
                }}
            >
                {/* 绯红脸颊 - 左 */}
                <div className="absolute w-8 h-5 rounded-full bg-pink-200/50"
                    style={{ left: '18%', top: '55%' }}
                />
                {/* 绯红脸颊 - 右 */}
                <div className="absolute w-8 h-5 rounded-full bg-pink-200/50"
                    style={{ right: '18%', top: '55%' }}
                />

                {/* 微笑 */}
                <div className="absolute w-12 h-6 border-b-2 border-black rounded-b-full"
                    style={{ bottom: '25%' }}
                />

                {/* 左眼 */}
                <div
                    className="absolute w-12 h-14 rounded-full border-2 border-black bg-white flex items-center justify-center overflow-hidden"
                    style={{
                        left: '22%',
                        top: '30%',
                        transform: blinking ? 'scaleY(0.1)' : 'scaleY(1)',
                        transition: 'transform 0.1s ease-in-out',
                    }}
                >
                    {/* 左瞳孔 */}
                    <div
                        className="w-6 h-7 bg-black rounded-full transition-all duration-75 ease-out"
                        style={{
                            transform: `translate(${leftPupil.x}px, ${leftPupil.y}px)`,
                        }}
                    >
                        {/* 高光 */}
                        <div className="w-2 h-2 bg-white rounded-full ml-1 mt-1" />
                    </div>
                </div>

                {/* 右眼 */}
                <div
                    className="absolute w-12 h-14 rounded-full border-2 border-black bg-white flex items-center justify-center overflow-hidden"
                    style={{
                        right: '22%',
                        top: '30%',
                        transform: blinking ? 'scaleY(0.1)' : 'scaleY(1)',
                        transition: 'transform 0.1s ease-in-out',
                    }}
                >
                    {/* 右瞳孔 */}
                    <div
                        className="w-6 h-7 bg-black rounded-full transition-all duration-75 ease-out"
                        style={{
                            transform: `translate(${rightPupil.x}px, ${rightPupil.y}px)`,
                        }}
                    >
                        {/* 高光 */}
                        <div className="w-2 h-2 bg-white rounded-full ml-1 mt-1" />
                    </div>
                </div>

                {/* 头顶装饰 - 小触角 */}
                <div className="absolute w-1.5 h-6 bg-black rounded-full" style={{ top: '-10px' }} />
                <div className="absolute w-3 h-3 bg-black rounded-full" style={{ top: '-18px' }} />
            </div>

            {/* 装饰性小点 */}
            <div
                className="absolute w-3 h-3 bg-gray-300 rounded-full animate-pulse"
                style={{ top: '5%', left: '8%', animationDelay: '0s' }}
            />
            <div
                className="absolute w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                style={{ top: '75%', right: '8%', animationDelay: '1s' }}
            />
            <div
                className="absolute w-2.5 h-2.5 bg-gray-300 rounded-full animate-pulse"
                style={{ top: '10%', right: '10%', animationDelay: '2s' }}
            />
            <div
                className="absolute w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse"
                style={{ bottom: '10%', left: '12%', animationDelay: '0.5s' }}
            />

        </div>
    );
}
