'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
export function Aside() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [sideOpen, setSideOpen] = useState<any>(false);
    const [opensearch, setOpensearch] = useState(false);
    // const [ discussion, setDiscussion ] = useState<Discussion[]>([]);
    const [discussion, setDiscussion] = useState([]);

    // const SidebarOpenAction=()=>{
    //     try {
    //         const isMobile = width > 768
    //     } catch (error) {

    //     }
    // } 
    const [openSearch, setOpenSearch] = useState<boolean>(false);
    return (
        <aside className="hidden sm:flex flex-col fixed w-64 top-0 left-0 h-screen bg-gray-400/5 dark:bg-black p-2 gap-2 z-10 border-r border-gray-700/20">
            <div className="">
                <nav className="flex-1 py-1 overflow-y-auto  space-y-1">
                    <div className="flex items-center justify-between">
                        <button className="p-1 hover:bg-black/5 rounded-lg" aria-label="ロゴ">
                            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="8">
                                <circle cx="50" cy="50" r="42" />
                                <path d="M50 20 Q35 50 50 80" />
                                <path d="M50 20 L50 80" />
                            </svg>

                            {/* <span className="text-2xl font-bold tracking-tighter">I/R/I/S</span> */}
                        </button>
                        <button onClick={() => router.push('')} aria-label="サイドバーを閉じる" className="text-gray-700 hover:text-gray-700/40 rounded-xl hover:bg-white/10 p-2 duration-300">
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
                    {/* <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition" onClick={() => router.push('/home')}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-house-door-fill" viewBox="0 0 16 16">
                            <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5" />
                        </svg>
                        ホーム
                    </button> */}

                    <div className=" flex w-full items-center justify-start ">
                        <h2 className="px-3 text-sm text-gray-900/50">あなたの相談</h2>
                    </div>
                    {discussion?.length === 0 && (
                        <span className="px-3">履歴がありません。</span>
                    )}
                    {discussion.map((discuss) => (
                        <div>
                            <div className="">
                                <div onClick={() => router.push(`/discus/`)}>
                                    {/* //ここに相談内容を表示 */}
                                </div>
                            </div>
                        </div>
                    ))}
                    <div className="">
                        <div onClick={() => router.push('/')}>

                        </div>
                    </div>
                </nav>
            </div>
        </aside>
    );
} 