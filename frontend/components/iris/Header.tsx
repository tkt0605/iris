"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
interface HeaderProps{
    isSideOpen: boolean;
}
export function Header({isSideOpen}: HeaderProps) {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // const router = useRouter();
    const [open, setOpen] = useState(false);
    const [sideOpen, setSideOpen] = useState(false);
    const [mounted, setMounted ] = useState(false);
    const [opensearch, setOpenSearch] = useState(false);
    const logout = () => {
        return console.log('ログアウト');
    };
    useEffect(() => {
        const saved = localStorage.getItem('AsideOpenStorage');
        if (saved !== null){
            setSideOpen(saved === "true");
        }
        console.log(sideOpen);
        setMounted(true);
    }, []);
    useEffect(() => {
        const getAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };
        getAuth();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);
    return (
        // <header className={[
        //     "fixed top-0 bg-transparent  inset-x-0 h-14 z-50",
        //     sideOpen ? "md:left-16 duration-300 border-b border-gray-700/20" : "md:left-60 duration-300 border-b border-gray-700/20"
        // ].join('')}>
        <header
            className={`
                fixed top-0 bg-transparent inset-x-0 h-14 z-50 border-b border-gray-700/20
                ${mounted ? "duration-300" : "duration-300"} 
                ${isSideOpen ? "md:left-16" : "md:left-64"}
            `} 
        >
            <div className="max-w-9wl mx-auto h-full px-6 sm:px-2 flex items-center justify-center gap-3">
                <div className="flex items-center justify-between">
                    <div className="md:hidden">
                        <button onClick={() => router.push('')} className="text-gray-700 hover:text-white rounded-xl hover:bg-white/10 p-2 duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-layout-sidebar-inset-reverse" viewBox="0 0 16 16">
                                <path d="M2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm12-1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" />
                                <path d="M13 4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1"></div>
                <div className="flex items-center gap-8 text-sm">
                    <div className="relative">
                        {loading ?
                            <p>loading...</p>
                            : user ?
                                <button onClick={() => setOpen((v) => !v)} className="p-2 rounded-full bg-gray-700/20 hover:bg-white/20 transition-all duration-200 shadow-sm backdrop-blur-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16"> <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" /> </svg>
                                </button>
                                : <button onClick={() => router.push("/auth/login")} className="px-4 py-1.5 rounded-full bg-white/10 text-cyan-300 hover:bg-white/20 transition">
                                    ログイン
                                </button>
                        }
                    </div>
                    {open && (
                        <div className="absolute right-0 mt-40 w-56 rounded-xl border border-white/10  bg-white/95 backdrop-blur p-3 text-sm shadow-xl z-[9999] overflow-visible">

                            <div className="mb-2">
                                <div className="text-xs text-slate-400 mb-0.5">
                                    サインイン中
                                </div>
                                <div className="font-medium truncate dark:text-white">
                                    {user?.email ?? "No email"}
                                </div>
                            </div>

                            <div className="my-2 h-px bg-white/5" />

                            <button
                                onClick={logout}
                                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-red-700"
                            >
                                ログアウト
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
// import React from 'react';
// import { useRouter } from 'next/navigation';

// // 必要なPropsがあれば追加してください
// export  function Header() {
//     const router = useRouter();

//     return (
//         <header className="w-full h-full flex items-center justify-between px-4 border-b border-gray-700/20 bg-white/80 dark:bg-black/80 backdrop-blur-md">
            
//             {/* 左側コンテンツ */}
//             <div className="flex items-center">
//                  {/* モバイル用のハンバーガーメニューが必要ならここに配置 */}
//                  <div className="md:hidden mr-4">
//                     <button>Menu</button>
//                  </div>
//                  <h1 className="font-semibold text-sm">Dashboard</h1>
//             </div>

//             {/* 右側コンテンツ（ユーザーアイコンなど） */}
//             <div className="flex items-center gap-4">
//                 <button 
//                     onClick={() => router.push('/auth/login')}
//                     className="text-sm px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition"
//                 >
//                     Login
//                 </button>
//             </div>
//         </header>
//     );
// }