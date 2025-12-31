'use client';
import React, { useState, useEffect, useEffectEvent } from "react";
import { Header } from "@/components/iris/Header";
import { Aside } from "@/components/iris/Aside";

interface IndexLayoutProps {
    children: React.ReactNode
}

export default function IndexLayout({ children }: IndexLayoutProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const saved = localStorage.getItem('AsideOpenStorage');
        console.log(saved);
        if (saved !== null){
            setSidebarOpen(saved === "true");
        }
        setMounted(true);
    }, []);
    const toggleSidebar = () => {
        const next = !isSidebarOpen;
        setSidebarOpen(next);
        localStorage.setItem('AsideOpenStorage', String(next));
    };
    return (
        <div className="relative w-full h-screen overflow-hidden bg-white dark:bg-black">
            <div className={`
                fixed top-0 left-0 h-full z-40
                ${mounted ? 'duration-300' : 'duration-300'}
                ${isSidebarOpen ? "w-16" : "w-60" }
            `}>
                 {/* {!isOpen && <Aside />} */}
                 <Aside isOpen={isSidebarOpen} onToggle={toggleSidebar} />
            </div>
            <div className="fixed top-0 left-0 w-full h-14 z-30 pointer-events-none">
                <Header isSideOpen={isSidebarOpen}/>
            </div>
            {/* <main 
                className="w-full h-full pt-14 md:pl-60 transition-all duration-300"
            > */}
            {/* <main className={[
                "w-full h-full pt-14 transition-all duration-300",
                isOpen ? "md:pl-12" : "md:pl-60"
            ].join('')}> */}
            <main 
                className={`
                w-full h-full pt-14 transition-all 
                ${mounted ? "duration-300" : "duration-300"}
                ${isSidebarOpen ? "md:pl-16" : "md:pl-64"}
                `}
            >
                <div className="w-full h-full overflow-y-auto no-scrollbar">
                    {children}
                </div>
            </main>

        </div>
    );
}
// "use client";
// import React, { useState, useEffect, useCallback } from 'react';
// import { Header } from "@/components/iris/Header";
// import { Aside } from "@/components/iris/Aside";

// export default function Layout({ children }: { children: React.ReactNode }) {
//     // デフォルト幅 (PC用)
//     const DEFAULT_WIDTH = 240;
//     // アイコンのみモードの最小幅
//     const COLLAPSED_WIDTH = 80;

//     const [sidebarWidth, setSidebarWidth] = useState<number>(DEFAULT_WIDTH);
//     const [isLoaded, setIsLoaded] = useState(false);

//     // ■ ポイント: 初回ロード時にlocalStorageから復元
//     useEffect(() => {
//         const saved = localStorage.getItem('sidebar-width');
//         if (saved) {
//             setSidebarWidth(Number(saved));
//         }
//         setIsLoaded(true);
//     }, []);

//     // 幅変更時のハンドラ（Asideから呼ばれる）
//     const handleWidthChange = useCallback((newWidth: number) => {
//         setSidebarWidth(newWidth);
//         localStorage.setItem('sidebar-width', String(newWidth));
//     }, []);

//     // Hydrationエラー防止（ロード前は何も表示しないか、ローディングを出す）
//     if (!isLoaded) return null;

//     return (
//         <div className="relative w-full h-screen overflow-hidden bg-white dark:bg-black text-gray-900 dark:text-gray-100">
            
//             {/* ■ サイドバー (Z-INDEX: 40) */}
//             {/* hidden md:block でモバイルでは非表示にする想定 */}
//             <div className="hidden md:block fixed top-0 left-0 h-full z-40">
//                 <Aside width={sidebarWidth} onResize={handleWidthChange} />
//             </div>

//             {/* ■ ヘッダー (Z-INDEX: 30) */}
//             {/* サイドバーの幅に合わせて left の位置を動的に変える */}
//             <div 
//                 className="fixed top-0 w-full h-14 z-30 transition-none"
//                 style={{ left: `${sidebarWidth}px`, width: `calc(100% - ${sidebarWidth}px)` }}
//             >
//                 <Header />
//             </div>

//             {/* ■ メインコンテンツ (Z-INDEX: 0) */}
//             {/* paddingLeft をサイドバーの幅と同じにする */}
//             <main
//                 className="w-full h-full pt-14 transition-none"
//                 style={{ paddingLeft: `${sidebarWidth}px` }}
//             >
//                 <div className="w-full h-full overflow-y-auto no-scrollbar p-4">
//                     {children}
//                 </div>
//             </main>
//         </div>
//     );
// }