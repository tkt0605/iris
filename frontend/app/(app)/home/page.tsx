"use client";

import { difference } from "next/dist/build/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";
import { Header } from "@/components/iris/Header";
import { UnLoginHeader } from "@/components/iris/unloginHeader";
import { ParticleTextReveal } from "@/components/iris/ParticleTextReveal";
import { Aside } from "@/components/iris/Aside";
import { RecordingWithIris } from "@/components/iris/RecordingWithIris";
import { createClient } from "@/utils/supabase";

export default function HomePage() {
  const router = useRouter();
  // Auth（簡易）
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  // const [loading, setLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const JampTopage = () => {
    if (user) {
      return router.push('/home');
    } else {
      return router.push('/auth/login_signup');
    }
  };
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
  return (
    <div className="flex flex-col justify-center h-full">
      <div>
        <div className="relative basis-auto shrink flex flex-col  max-sm:grow max-sm:justify-center">
          <div className="flex items-center justify-center">
            <div className="mb-7 hidden text-center sm:block">
              <div className="relative inline-flex justify-center text-center text-2xl leading-9 font-semiblod">
                <div>
                  <h1 className="text-page-header inline-flex min-h-10.5 items-baseline whitespace-pre-wrap">
                    今日は何をしましょうか？
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="">
          <div className="flex items-center justify-center">
            <RecordingWithIris />
          </div>
        </div>
      </div>
    </div>

  );
}