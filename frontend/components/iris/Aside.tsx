'use client';
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
interface AsideProps {
    isOpen: boolean;
    onToggle: () => void;
}
export function Aside({ isOpen, onToggle }: AsideProps) {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [discussion, setDiscussion] = useState<any[]>([]);
    const [openSearch, setOpenSearch] = useState<boolean>(false);
    const [openUser, setOpenUser] = useState<boolean>(false);
    const [action, setAction] = useState<boolean>(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const toggleOpen = () => {
        setOpenUser((prev) => !prev);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setOpenUser(false);
            }
        };
        if (openUser) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openUser]);

    useEffect(() => {
        setMounted(true);
    }, []);
    const logout = () => {
        supabase.auth.signOut();
        setOpenUser(false);
        return router.push('/auth/login_signup');
    };
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

    // 会話一覧をFastAPI経由で取得（3秒ポーリング）
    useEffect(() => {
        if (!user?.id) {
            setDiscussion([]);
            return;
        }

        const fetchDiscussions = async () => {
            try {
                setError(null);
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token ?? "";
                const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

                const res = await fetch(`${backendUrl}/api/conversations`, {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
                const data = await res.json();
                setDiscussion(data);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.error('Error in fetchDiscussions:', errorMessage);
                setError("相談の取得に失敗しました: " + errorMessage);
                setDiscussion([]);
            } finally {
                setLoading(false);
            }
        };

        fetchDiscussions();
        // 3秒ポーリングで新着を反映
        const interval = setInterval(fetchDiscussions, 3000);
        return () => clearInterval(interval);
    }, [user?.id]);
    return (
        <aside className={`
            hidden sm:flex flex-col fixed top-0 left-0 h-screen bg-gray-400/5 dark:bg-black gap-2 z-10 border-r border-gray-700/20
            ${mounted ? "duration-500" : "duration-500"}
            ${isOpen ? "w-16" : "w-60"}
        `}>
            <nav className="shrink-0 space-y-1 z-10 ">
                {/* <div className={[
                    isOpen ? "" : "pl-1 flex items-center justify-between"
                ].join(" ")}>
                    {!isOpen &&
                        <button className="p-1 px-4 rounded-lg" aria-label="ロゴ">
                        </button>
                    }
                    <div className="cursor-pointer rounded-lg  p-2 flex items-center justify-center">
                        <button onClick={onToggle} aria-label="サイドバーを閉じる" className={[
                            isOpen ? "text-gray-700  rounded-xl hover:bg-gray-700/20  duration-300 p-2" : "group flex w-full items-center gap-3 rounded-lg p-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition"
                        ].join(" ")} >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-layout-sidebar-inset-reverse" viewBox="0 0 16 16">
                                <path d="M2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm12-1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" />
                                <path d="M13 4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" />
                            </svg>
                        </button>
                    </div>
                </div> */}

                <div className="cursor-pointer rounded-lg gap-2 p-2 pt-4 flex items-center justify-center  ">
                    <button className={[
                        isOpen ? "text-gray-700  rounded-xl hover:bg-gray-700/20  duration-300 p-2" : "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition"
                    ].join(" ")} onClick={() => router.push('/home')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-5 h-5 bi bi-plus-square" viewBox="0 0 16 16">
                            <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                        </svg>
                        {!isOpen && <span>新しい相談</span>}
                    </button>
                </div>
                {/* <div className="cursor-pointer p-2 rounded-lg gap-2 flex items-center justify-center pt-2">
                    <button className={[
                        isOpen ? "text-gray-700  rounded-xl hover:bg-gray-700/20 p-2 duration-300 " : "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition"
                    ].join(" ")} onClick={() => setOpenSearch(true)} >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                        </svg>
                        {!isOpen && <span>相談を検索する。</span>}
                    </button>
                </div> */}
            </nav>
            {!isOpen &&
                <div className="flex-1 overflow-y-auto min-h-0 py-1 space-y-1">
                    <div className="flex w-full items-center justify-start shrink-0">
                        <h2 className="px-3 text-sm text-gray-900/50 dark:text-gray-400">あなたの相談</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0 py-1 space-y-1 scrollbar scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500">
                        {/* ローディング表示 */}
                        {loading && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                読み込み中...
                            </div>
                        )}

                        {/* エラー表示 */}
                        {error && !loading && (
                            <div className="px-3 py-2 text-sm text-red-500">
                                {error}
                            </div>
                        )}

                        {/* 未ログイン時 */}
                        {!user && !loading && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                ログインしてください
                            </div>
                        )}

                        {/* データなし */}
                        {!loading && !error && user && discussion?.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-500">
                                履歴がありません。
                            </div>
                        )}

                        {/* Discussion一覧 */}
                        {!loading && !error && discussion && discussion.length > 0 && discussion.map((discuss) => (
                            <div key={discuss.id} className="flex flex-col py-1 gap-1 p-3">
                                <button
                                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition text-left"
                                    onClick={() => router.push(`/discus/${discuss.id}`)}
                                >
                                    <div className="flex-1 truncate">
                                        <div className="font-medium truncate">
                                            {discuss.title || '無題の相談'}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            }
            <div ref={userMenuRef} className="shrink-0 mt-auto p-2 border-t border-gray-700/20">
                <div onClick={toggleOpen} className="cursor-pointer p-2 rounded-lg  hover:bg-black/5  gap-2 flex items-center justify-left">
                    <button className="p-2 rounded-full bg-gray-700/20 duration-200 shadow-sm backdrop-blur-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person" viewBox="0 0 16 16">
                            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
                        </svg>
                    </button>
                    {!isOpen && <div className="text-sm text-gray-500">{user?.user_metadata?.name}</div>}
                </div>
                {openUser && (
                    <div className="absolute left-24 bottom-0 mb-16 w-56 rounded-xl border border-white/10 bg-white/95 backdrop-blur p-3 text-sm shadow-xl z-[9999] overflow-visible">
                        <div className="mb-2">
                            <div className="text-xs text-slate-400 mb-0.5">
                                サインイン中
                            </div>
                            <div className="font-medium truncate dark:text-white">
                                {user?.email ?? "No email"}
                            </div>
                        </div>
                        <div className="my-2 h-px bg-white/5" />
                        <button onClick={logout} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-white/5 text-red-700">
                            ログアウト
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
} 