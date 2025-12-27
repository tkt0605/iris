"use client";
import React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase";

export default function SignupPage(){
    const router = useRouter();
    const [ user, setUser ] = useState<any>(null);
    const [ loading, setLoading ] = useState(false);
    const [ isLogin, setIsLogin ] = useState(false);
    const [ email, setEmail ] = useState('');
    const [ password, setPassword ] = useState('');
    const [ message, setMessage ] = useState<{text: string,type: 'error' | 'success'} | null>(null);
    const handleSingUPWithEmail = async(e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            if(isLogin){
                const {error} = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/`
                    }
                });
                if(error) throw error;
                // setMessage({
                //     text: ''
                // })
            }
        } catch (error: any) {
            
        }finally{

        }
    }
}