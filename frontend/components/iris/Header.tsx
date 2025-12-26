"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
export function Header() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // const router = useRouter();
    const [open, setOpen] = useState(false);
    const [sideOpen, setSideOpen] = useState<any>(false);
    const [ opensearch, setOpenSearch ] = useState(false);

    const logout=()=>{
        return console.log('ログアウト');
    };
    const HeadWidth = () => {
        if(user){

        }else{

        }
    }
    useEffect(() => {
        const getAuth = async() => {
            const { data: {session} } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };
        getAuth();
        const { data: {subscription} } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);
    return (
        <header className="fixed top-0 md:left-60 sm:left-0 inset-x-0 h-14 z-30">

            <div className="max-w-9wl mx-auto h-full px-6 flex items-center justify-center gap-3">
                <div className="flex items-center justify-between">
                    <div className="md:hidden">
                        <button onClick={() => router.push('')} className="text-gray-700 hover:text-white rounded-xl hover:bg-white/10 p-2 duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-layout-sidebar-inset-reverse" viewBox="0 0 16 16">
                                <path d="M2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm12-1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" />
                                <path d="M13 4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" />
                            </svg>
                        </button>
                    </div>
                    <span className="text-2xl font-bold tracking-tighter">I/R/I/S</span>
                </div>
                <div className="flex-1"></div>
                <div className="flex items-center gap-6 text-sm">
                <button onClick={() => setOpenSearch(true)} className="text-gray-700 hover:text-white duration-300 ">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                            </svg>
                        </button>
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
                        {open && (
                            <div className="absolute right-0 mt-40 w-56 rounded-xl border border-white/10  
    bg-[#0b0b14]/95 backdrop-blur p-3 text-sm shadow-xl 
    z-[9999] overflow-visible">

                                <div className="mb-2">
                                    <div className="text-xs text-slate-400 mb-0.5">
                                        サインイン中
                                    </div>
                                    <div className="font-medium truncate text-white">
                                        {user?.email ?? "No email"}
                                    </div>
                                </div>

                                <div className="my-2 h-px bg-white/5" />

                                <button
                                    onClick={logout}
                                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-red-300"
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