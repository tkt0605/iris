"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase";
import { RecordingWithIris } from "@/components/iris/RecordingWithIris";
import { Session } from "inspector/promises";
import { div } from "framer-motion/client";

export default function DiscussPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [discussion, setDiscussion] = useState<any>(null);
    const [isNowRecord, setIsNowRecord] = useState(false);
    const [context, setContext] = useState<[]>([]);
    const [response, setResponse] = useState<[]>([]);
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

    // supabaseから会話内容を取得し、URLのIDと、DBのprimary keyの一致を確かめる。
    useEffect(() => {
        const getDiscussion = async () => {

        }
    })


    return (
        <div className="flex items-start gap-16 md:p-10 w-full h-full">
            {/* ここに音声文字起こしの内容を表示 */}
            <div className="shrink-0">
                <RecordingWithIris transparent={true} onClick={() => setIsNowRecord(true)} />
                <div className="flex items-center justify-center">
                    <p className="text-cyan-600 text-sm font-medium">
                        クリックして話しかける
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <section className=" space-y-4 pt-4">
                        <div className="flex flex-col gap-4">
                            <div>
                                <h1 className="text-2xl font-bold">
                                    ここに音声文字起こしの内容を表示
                                </h1>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
            {/* ここに会話内容(返答の内容)を表示 */}
            <main className="flex-1 overflow-y-auto pt-25">
                <div>
                    <h1 className="text-4xl font-bold">
                        ここに会話内容(返答の内容)を表示
                    </h1>
                </div>
            </main>
        </div>
    );
}