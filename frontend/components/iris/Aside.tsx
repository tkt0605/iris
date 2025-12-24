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
    return (
        <aside className="hidden sm-flex flex-col fixed w-60 top-0 left-0 h-screen bg-white dark:bg-black p-4 gap-2 z-10">
            <div className="p-2">
                <nav className="">
                    <div className="flex items-center justify-between">
                        <span className="">I/R/I/S</span>
                        <div className="flex">
                            <button className="text-token-text-tertiary no-draggable hover:bg-token-surface-hover keyboard-focused:bg-token-surface-hover touch:h-10 touch:w-10 flex h-9 w-9 items-center justify-center rounded-lg focus:outline-none disabled:opacity-50 no-draggable cursor-w-resize rtl:cursor-e-resize" aria-label="サイドバーを閉じる">]
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" aria-hidden="true" data-rtl-flip="" className="icon max-md:hidden"><use href="/cdn/assets/sprites-core-i9agxugi.svg#836f7a" fill="currentColor"></use></svg>
                            </button>
                        </div>
                    </div>
                    <div className="">
                        <button onClick={() => router.push('/')}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-house-door-fill" viewBox="0 0 16 16">
                                <path d="M6.5 14.5v-3.505c0-.245.25-.495.5-.495h2c.25 0 .5.25.5.5v3.5a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-7a.5.5 0 0 0-.146-.354L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293L8.354 1.146a.5.5 0 0 0-.708 0l-6 6A.5.5 0 0 0 1.5 7.5v7a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5" />
                            </svg>
                            ホーム
                        </button>
                    </div>
                    <div className="">
                        <button onClick={() => router.push('/')}>
                            新しい相談
                        </button>
                    </div>
                    <button className="text-token-text-tertiary flex w-full items-center justify-start gap-0.5 px-4 py-1.5">
                        <h2 className="text-gary-700/20 text-sm">あなたの相談</h2>
                    </button>
                    {discussion?.length === 0 && (
                        <span>履歴がありません。</span>
                    )}
                    {discussion.map((discuss) => (
                        <div>
                            <div className="">
                                <button onClick={() => router.push(`/discus/`)}>
                                    {/* //ここに相談内容を表示 */}
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="">
                        <button onClick={() => router.push('/')}>

                        </button>
                    </div>
                </nav>
            </div>
        </aside>
    );
} 