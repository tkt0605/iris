"use client";

import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";
import SigninWithGoogle from "@/components/auth/SigninWithGoogle";
export default function Loginpage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isSignup, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);
    const handleLoginWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/`,
                    queryParams: { access_type: 'offline', prompt: 'consent' }
                },
            });
            if (error) throw error;
        } catch (error: any) {
            setMessage({
                text: error.message,
                type: 'error'
            })
        }
    };
    const handleLoginWithEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            if (isSignup) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/`,
                    }
                });
                if (error) throw error;
                setMessage({
                    text: '確認メールを送信しました。メールボックスを確認してください。',
                    type: 'success'
                });
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                router.push('/home');
                router.refresh();
            }
        } catch (error: any) {
            setMessage({ text: error.message, type: 'error' })
        } finally {
            setLoading(false)
        }
    };
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">

                {/* ヘッダー部分 */}
                <div className="text-center">
                <span className="text-4xl text-black font-bold tracking-tighter">I/R/I/S</span>
                    <h3 className="mt-6 text-xl font-extrabold text-gray-900">
                        {isSignup ? 'アカウント作成' : 'ログイン'}
                    </h3>
                </div>

                {/* Googleログインボタン */}
                <div>
                    <button
                        onClick={handleLoginWithGoogle}
                        className="flex w-full justify-center items-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all"
                    >
                        <img
                            src="https://www.svgrepo.com/show/475656/google-color.svg"
                            alt="Google logo"
                            className="h-5 w-5"
                        />
                        Googleで続行
                    </button>
                </div>

                {/* 区切り線 */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-white px-2 text-gray-500">または</span>
                    </div>
                </div>

                {/* エラー/成功メッセージ表示 */}
                {message && (
                    <div className={`p-4 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {message.text}
                    </div>
                )}

                {/* メール・パスワードフォーム */}
                <form className="mt-8 space-y-6" onSubmit={handleLoginWithEmail}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                className="relative block w-full rounded-t-md border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="メールアドレス"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="relative block w-full rounded-b-md border-0 py-3 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="パスワード"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 transition-all"
                        >
                            {loading ? '処理中...' : (isSignup ? '登録する' : 'ログイン')}
                        </button>
                    </div>
                </form>

                {/* モード切替リンク */}
                <div className="text-center text-sm">
                    <button
                        onClick={() => {
                            setIsSignUp(!isSignup)
                            setMessage(null)
                        }}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        {isSignup
                            ? 'すでにアカウントをお持ちの方はこちら'
                            : 'アカウントをお持ちでない方はこちら'}
                    </button>
                </div>
            </div>
        </div>
    );
}