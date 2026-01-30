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
import { SampleWithIris } from "@/components/iris/sampleWithIris";
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
        <div className="pt-0">
          <div className="flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{user?.email}</span>
              <span className="text-3xl font-bold">球体を押して、話しかけてください。</span>
            </div>
            <RecordingWithIris transparent={true} />
          </div>
        </div>
      </div>  
    </div>
  );
}