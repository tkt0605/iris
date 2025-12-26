"use client";

import { difference } from "next/dist/build/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";
import { Header } from "@/components/iris/Header";
import { UnLoginHeader } from "@/components/iris/unloginHeader";
import { ParticleTextReveal } from "@/components/iris/ParticleTextReveal";
import { Aside } from "@/components/iris/Aside";
import { supabase } from "@/utils/supabase";
export default function HomePage() {
  const router = useRouter();
  // Auth（簡易）
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const JampTopage = () => {
    if (user) {
      return router.push('/home');
    } else {
      return router.push('/auth/login');
    }
  }
  return (
    <div>
      {user ? (
        // ログインユーザー時での表示
        <div>

        </div>
      ) : (
        // 非ログインユーザー時での表示
        <div>
          <UnLoginHeader />
          <ParticleTextReveal />
        </div>
      )}
    </div>
  );
}