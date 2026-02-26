"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase";
import { RecordingWithIris } from "@/components/iris/RecordingWithIris";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";

type Message = {
    id: string;
    role: "user" | "assistant";
    context: string;
    audio_url: string;
    created_at: string;
}

function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
}

function MessageItem({ msg, index }: { msg: Message; index: number }) {
    const isUser = msg.role === "user";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
            className="group py-7"
        >
            {/* ロールラベル + タイムスタンプ */}
            <div className="flex items-baseline gap-3 mb-3">
                <span className={`text-[11px] font-mono font-bold tracking-[0.2em] uppercase ${
                    isUser ? "text-gray-400" : "text-cyan-500"
                }`}>
                    {isUser ? "あなた" : "◉ IRIS"}
                </span>
                <span className="text-[11px] font-mono text-gray-300">
                    {formatTime(msg.created_at)}
                </span>
            </div>

            {/* IRIS メッセージ: 左にシアンのアクセントライン */}
            <div className={isUser ? "" : "border-l-2 border-cyan-400/50 pl-5"}>
                {/* 音声プレイヤー (ユーザーのみ) */}
                {isUser && msg.audio_url && (
                    <audio
                        controls
                        src={msg.audio_url}
                        className="mb-3 h-7 w-full max-w-[280px] opacity-50 hover:opacity-100 transition-opacity duration-200"
                    />
                )}

                {/* 本文 */}
                <p className={`leading-relaxed whitespace-pre-wrap ${
                    isUser
                        ? "text-sm text-gray-500"
                        : "text-base text-gray-800 font-medium"
                }`}>
                    {msg.context || (
                        <span className="text-gray-300 animate-pulse text-sm font-mono tracking-wider">
                            processing...
                        </span>
                    )}
                </p>
            </div>
        </motion.div>
    );
}

export default function DiscussPage() {
    const params = useParams();
    const conversationId = params.id as string;
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState<Message[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!conversationId) { setLoading(false); return; }

        const fetchMessages = async () => {
            setLoading(true);
            try {
                const { data } = await supabase
                    .from("messages")
                    .select("*")
                    .eq("conversation_id", conversationId)
                    .order("created_at", { ascending: true });

                if (data) {
                    const withUrls = data.map((msg) => {
                        if (msg.audio_url && !msg.audio_url.startsWith("https://")) {
                            const { data: urlData } = supabase.storage
                                .from("audio-recordings")
                                .getPublicUrl(msg.audio_url);
                            return { ...msg, audio_url: urlData.publicUrl };
                        }
                        return msg;
                    });
                    setMessages(withUrls);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
                (payload) => {
                    const msg = payload.new as Message;
                    if (msg.audio_url && !msg.audio_url.startsWith("https://")) {
                        const { data: urlData } = supabase.storage
                            .from("audio-recordings")
                            .getPublicUrl(msg.audio_url);
                        msg.audio_url = urlData.publicUrl;
                    }
                    setMessages((prev) => [...prev, msg]);
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [conversationId]);

    // 新着メッセージへ自動スクロール
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sessionDate = messages[0]
        ? new Date(messages[0].created_at).toLocaleDateString("ja-JP", {
              year: "numeric", month: "long", day: "numeric",
          })
        : "";
    const exchangeCount = Math.floor(
        messages.filter((m) => m.role === "user").length
    );

    return (
        <div className="flex h-full">
            {/* 左: 録音球体エリア (固定幅) */}
            <div className="shrink-0 flex flex-col items-center pt-6">
                <RecordingWithIris
                    NewChat={false}
                    transparent={true}
                    width={400}
                    height={400}
                    CORE_PARTICLE_COUNT={1000}
                    CORE_RADIUS={40}
                />
            </div>

            {/* 右: トランスクリプトエリア */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* セッションヘッダー */}
                <div className="shrink-0 border-b border-gray-100 dark:border-gray-800 px-8 py-3 flex items-center gap-3 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                    <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-cyan-500">
                        対話セッション
                    </span>
                    {sessionDate && (
                        <>
                            <span className="text-gray-200 dark:text-gray-700">·</span>
                            <span className="text-[11px] font-mono text-gray-400">{sessionDate}</span>
                            <span className="text-gray-200 dark:text-gray-700">·</span>
                            <span className="text-[11px] font-mono text-gray-400">
                                {exchangeCount} {exchangeCount === 1 ? "交換" : "交換"}
                            </span>
                        </>
                    )}
                </div>

                {/* メッセージリスト */}
                <div className="flex-1 overflow-y-auto px-8 py-2">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <span className="text-[11px] font-mono text-cyan-500 animate-pulse tracking-[0.3em]">
                                LOADING SESSION...
                            </span>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-48">
                            <span className="text-[11px] font-mono text-gray-300 tracking-[0.2em]">
                                NO RECORDS
                            </span>
                        </div>
                    ) : (
                        <div className="max-w-3xl divide-y divide-gray-100 dark:divide-gray-800/60">
                            {messages.map((msg, i) => (
                                <MessageItem key={msg.id} msg={msg} index={i} />
                            ))}
                            <div ref={bottomRef} className="h-8" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
