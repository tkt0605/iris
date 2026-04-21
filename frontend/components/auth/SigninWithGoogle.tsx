'use client';
import { createClient } from "@/utils/supabase";
export default function SigninWithGoogle(){
    const supabase = createClient();
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