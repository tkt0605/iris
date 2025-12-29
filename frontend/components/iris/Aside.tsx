'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase";
export function Aside() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [sideOpen, setSideOpen] = useState(false);
    const [opensearch, setOpensearch] = useState(false);
    // const [ discussion, setDiscussion ] = useState<Discussion[]>([]);
    const [discussion, setDiscussion] = useState([]);
    const [openSearch, setOpenSearch] = useState<boolean>(false);
    const [ windowSize, setWindowSize ] = useState({ width:0, height:0 });
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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
    const SidebarOpenAction = () => {
        const width = windowSize.width;
        try {
            const isMobile = width > 768
            if (isMobile) {
                setSideOpen((prev) => !prev);
            } else {
                setSideOpen(false);
            }
            console.log('SUCCESS');
        } catch (error) {
            console.error(error);
        }
    };
    return (
        <aside className="hidden sm:flex flex-col fixed w-64 top-0 left-0 h-screen bg-gray-400/5 dark:bg-black p-2 gap-2 z-10 border-r border-gray-700/20">
            <nav  className="shrink-0 space-y-1 z-10">
                <div className="flex items-center justify-between">
                    <button className="p-1 px-4 hover:bg-black/5 rounded-lg" aria-label="ロゴ">
                        <span className="text-2xl font-bold tracking-tighter">I/R/I/S</span>
                    </button>
                    <button onClick={SidebarOpenAction} aria-label="サイドバーを閉じる" className="text-gray-700 hover:text-gray-700/40 rounded-xl hover:bg-white/10 p-2 duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-layout-sidebar-inset-reverse" viewBox="0 0 16 16">
                            <path d="M2 2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1zm12-1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" />
                            <path d="M13 4a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z" />
                        </svg>
                    </button>
                </div>

                <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push('/home')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="w-5 h-5 bi bi-plus-square" viewBox="0 0 16 16">
                        <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" />
                        <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg>
                    新しい相談
                </button>
                <button onClick={() => setOpenSearch(true)} className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                    </svg>
                    相談を検索する。
                </button>

            </nav>
            <div className="flex-1 overflow-y-auto min-h-0 py-1 space-y-1">
                {/* ヘッダー部分 */}
                <div className="flex w-full items-center justify-start shrink-0">
                    <h2 className="px-3 text-sm text-gray-900/50">あなたの相談</h2>
                </div>
                {/* <div className="py-1 space-y-1 flex-1 overflow-y-auto min-h-0">*/}
                <div className="flex-1 overflow-y-auto min-h-0 py-1  space-y-1 scrollbar scrollbar-thumb-gray-400 scrollbar-track-transparent hover:scrollbar-thumb-gray-500">
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                    <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                        相談内容を表示
                    </button>
                </div>
            </div>
            {/* フッター部分（固定） */}
            <div className="shrink-0 mt-auto">
                <div className="cursor-pointer p-2 hover:bg-black/5 rounded-lg" onClick={() => router.push('/')}>
                    {/* ... */}
                    <div className="text-sm text-gray-500">{user?.email}</div>
                </div>
            </div>
            {/* <div className="flex flex-col h-screen">
                    <div className=" flex w-full items-center justify-start ">
                        <h2 className="px-3 text-sm text-gray-900/50">あなたの相談</h2>
                    </div>
                    {discussion?.length === 0 && (
                        <span className="px-3">履歴がありません。</span>
                    )}
                    {discussion.map((discuss) => (
                        <div className="flex py-1 overflow-y-auto  space-y-1 ">
                            <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push(`/discus/`)}>
                                相談内容を表示
                            </button>
                        </div>
                    ))}
                    <div className="shrink-0">
                        <div onClick={() => router.push('/')}>

                        </div>
                    </div>
                </div> */}
        </aside>
    );
} 