"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase";
import { RecordingWithIris } from "@/components/iris/RecordingWithIris";
import { Session } from "inspector/promises";
import { div } from "framer-motion/client";

export default function DiscussPage({params}: {params: {id: string}}){
    const router = useRouter();
    const supabase = createClient();
    const [ user, setUser ] = useState<any>(null);
    const [ loading, setLoading ] = useState(true);
    const [ discussion, setDiscussion ] = useState<any>(null);

    useEffect(() => {
        const getAuth = async() => {
            const { data: { session }} = await supabase.auth.getSession();
            setUser(session?.user ?? null);
            setLoading(false);
        };
        getAuth();
        const { data: { subscription }} = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);

    // supabaseから会話内容を取得し、URLのIDと、DBのprimary keyの一致を確かめる。
    useEffect(() => {
        const getDiscussion = async() => {

        }
    })
    // 会話内容が一致しない場合、404エラーを表示する。

    // localStorageから、録音した物を取得する。



    return(
        <div>
            <h1>会話内容</h1>
        </div>
    );
}