"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase";
import { RecordingWithIris } from "@/components/iris/RecordingWithIris";
import { Session } from "inspector/promises";
import { div } from "framer-motion/client";
import { useParams } from "next/navigation";

type Message = {
    id: string;
    role: "user" | "assistant";
    context: string;
    audio_url: string;
    created_at: string;
}

export default function DiscussPage() {
    const router = useRouter();
    const params = useParams();
    const conversationId = params.id as string;
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const [isNowRecord, setIsNowRecord] = useState(false);
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
        const fetchMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('messages').
                    select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true });
                if (data) setMessages(data);
            } catch (error) {
                console.error('Messages fetch error:', error);
                throw error;
            }
        };
        fetchMessages();

    }, [conversationId]);
    return (
        <div className="flex items-start gap-16 md:p-4 w-full h-full">
            {/* <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 w-full max-w-7xl px-6 py-8"> */}
            {/* ここに音声文字起こしの内容を表示 */}
            <div className="shrink-0">
                <RecordingWithIris NewChat={false} transparent={true} onClick={() => setIsNowRecord(true)} />
                <div className="flex items-center justify-center">
                    <p className="text-cyan-600 text-sm font-medium">
                        クリックして話しかける
                    </p>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <section className=" space-y-4 pt-4">
                        <div className="flex flex-col gap-4">
                            <div className="flex-1 space-y-6">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] p-4 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-900'
                                            }`}>
                                            {/* 役割ラベル */}
                                            <div className="text-xs opacity-70 mb-1">
                                                {msg.role === 'user' ? 'あなた' : 'IRIS'}
                                            </div>

                                            {/* 音声プレイヤー */}
                                            {msg.audio_url && (
                                                <audio controls src={msg.audio_url} className="mb-2 w-full h-8" />
                                            )}

                                            {/* テキスト内容 (まだ文字起こし前なら表示しない制御も可) */}
                                            <p>{msg.context || "(音声解析中...)"}</p>
                                        </div>
                                    </div>
                                ))}
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