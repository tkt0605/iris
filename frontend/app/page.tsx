"use client";
import { useEffect, useState } from "react";
import { UnLoginHeader } from "@/components/iris/unloginHeader";
import { createClient } from "@/utils/supabase";

export default function HomePage() {
  // Auth（簡易）
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  // const [loading, setLoading] = useState(true);
  const [loading, setLoading] = useState(true);
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
  });
  return (
    <div>
      {loading ?
        <div></div>
        : user ?
          // ログインユーザー時での表示
          <div></div>
          :
          // 非ログインユーザー時での表示
          <div>
            <UnLoginHeader />
            <div ></div>
          </div>
      }
    </div>
  );
}