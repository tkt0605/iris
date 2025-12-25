"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
export function UnLoginHeader() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // const router = useRouter();
    const [open, setOpen] = useState(false);
    const [sideOpen, setSideOpen] = useState<any>(false);
    const [opensearch, setOpenSearch] = useState(false);

    const logout = () => {
        return console.log('ログアウト');
    };
    const HeadWidth = () => {
        if (user) {

        } else {

        }
    }

    return (
        <header className="fixed top-0 left-0 inset-x-0 h-14 z-30">
            <div className="max-w-9wl mx-auto h-full md:px-6 sm:px-6 flex items-center justify-between gap-3">
                <div className="flex items-center justify-between">
                    <div className="md:hidden">
                        <button onClick={() => router.push('')} className="text-gray-700 hover:text-white rounded-xl hover:bg-white/10 p-2 duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-layout-sidebar-inset-reverse" viewBox="0 0 16 16">
                                <path d="M2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm12-1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" />
                                <path d="M13 4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" />
                            </svg>
                        </button>
                    </div>
                    <div>
                        <span className="text-2xl text-black font-bold tracking-tighter">I/R/I/S</span>
                    </div>
                </div>
                <div className="flex items-center gap-6  text-sm">
                    <div className="relative">
                        {loading ?
                            <p>loading...</p>
                            : user ?
                                <button onClick={() => setOpen((v) => !v)} className="p-2 text-white rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 shadow-sm backdrop-blur-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16"> <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" /> </svg>
                                </button>
                                : <button onClick={() => router.push("/auth/login")} className="px-4 py-1.5 rounded-full bg-white/10 text-cyan-300 hover:bg-white/20 transition">
                                    ログイン
                                </button>
                        }
                    </div>
                </div>
            </div>
        </header>
    );
}