'use client';
import { supabase } from "@/utils/supabase";
import { div } from "framer-motion/client";
export default function SigninWithGoogle(){
    const handleGoogleLogin = async() => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        })
        if(error){
            console.error('ログインエラー:', error);
        }
    };

    return (
        <div className=""></div>
    );
}