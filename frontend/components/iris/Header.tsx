"use client";
import React from "react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import { useParams } from "next/navigation";
interface HeaderProps {
    isSideOpen: boolean;
    isOpen: boolean;
    onToggle: () => void;
}
type Conversation = {
    id: string;
    title: string;
    created_at: string;
    is_activate: boolean;
}
export function Header({ isSideOpen, isOpen, onToggle }: HeaderProps) {
    const router = useRouter();
    const params = useParams();
    const conversationId = params.id as string;
    // const [conversation, setConversation] = useState<Conversation[]>([]);
    const [conversation, setConversation] = useState<any>(null);
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [conversationLoading, setConversationLoading] = useState(true);
    // const router = useRouter();
    const [open, setOpen] = useState<boolean>(false);
    const [sideOpen, setSideOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [opensearch, setOpenSearch] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const logout = () => {
        supabase.auth.signOut();
        return router.push('/auth/login_signup');
    };

    // ユーザーメニューを開く・閉じる
    const toggleOpen = () => {
        setOpen((prev) => !prev);
    };

    useEffect(() => {
        const handleClickOutSide = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        if (open) {
            document.addEventListener('mousedown', handleClickOutSide);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutSide);
        };
    }, [open]);
    useEffect(() => {
        const saved = localStorage.getItem('AsideOpenStorage');
        if (saved !== null) {
            setSideOpen(saved === "true");
        }
        console.log(sideOpen);
        console.log('Open:', open);
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
    useEffect(() => {
        setConversation(null);
        setConversationLoading(true);
        if (!conversationId) {
            setConversationLoading(false);
            return;
        }
        const fetchConversation = async () => {
            try {
                if (conversationId) {
                    const { data, error } = await supabase
                        .from('conversations')
                        .select('*')
                        .eq('id', conversationId)
                        .single();
                    if (data) {
                        setConversation(data);
                        setConversationLoading(false);
                    }
                } else {
                    setConversationLoading(false);
                }
            } catch (error) {
                console.error('Conversation fetch error:', error);
                throw error;
            }
        };
        fetchConversation();

        const channel = supabase
            .channel(`conversations_header`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'conversations',
                    filter: `user_id=eq.${user?.id}`,
                },
                (payload) => {
                    setConversation((prev: any) => [...prev, payload.new as any]);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'conversations',
                    filter: `user_id=eq.${user?.id}`,
                },
                (payload) => {
                    setConversation((prev: any) =>
                        prev.map((d: any) => (d.id === payload.new.id ? (payload.new as any) : d))
                    );
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'conversations',
                    filter: `user_id=eq.${user?.id}`,
                },
                (payload) => {
                    setConversation((prev: any) => prev.filter((d: any) => d.id !== payload.old.id));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, supabase]);
    return (
        <header
            className={`
                fixed top-0 bg-transparent inset-x-0 h-14 z-10 
                ${mounted ? "duration-500" : "duration-500"} 
                ${isSideOpen ? "md:left-16" : "md:left-60"}
            `}
        >
            <div className="max-w-9wl mx-auto h-full px-6 sm:px-2 flex items-center justify-between">
                <div>
                    <button onClick={onToggle} aria-label="サイドバーを閉じる" className={[
                        isOpen ?
                            "text-gray-700  rounded-xl hover:bg-gray-700/20  duration-300 p-2 "
                            :
                            "group flex w-full items-center gap-3 rounded-lg p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition"
                    ].join(" ")} >
                        <span className="text-2xl font-bold">I.R.I.S</span>
                    </button>
                </div>
                <div className="text-2xl font-bold">{conversation?.title || ""}</div>
                {/* <div className="md:hidden">
                        <button onClick={() => router.push('')} className="text-gray-700 hover:text-white rounded-xl hover:bg-white/10 p-2 duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-layout-sidebar-inset-reverse" viewBox="0 0 16 16">
                                <path d="M2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm12-1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" />
                                <path d="M13 4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" />
                            </svg>
                        </button>
                    </div> */}
                <div ref={userMenuRef} className="relative">
                    {loading ?
                        <p>loading...</p>
                        : user ?
                            <button onClick={toggleOpen} className="p-2 rounded-full bg-gray-700/20 hover:bg-white/20 transition-all duration-200 shadow-sm backdrop-blur-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16"> <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" /> </svg>
                            </button>
                            : <button onClick={() => router.push("/auth/login")} className="px-4 py-1.5 rounded-full bg-white/10 text-cyan-300 hover:bg-white/20 transition">
                                ログイン
                            </button>
                    }
                    {open && (
                        <div className="absolute right-0 top-0 mt-14 w-56 rounded-xl border border-white/10  bg-white/10 backdrop-blur p-3 text-sm shadow-xl z-[9999] overflow-visible">
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