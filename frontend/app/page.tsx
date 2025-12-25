"use client";

import { difference } from "next/dist/build/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";
import { Header } from "@/components/iris/Header";
import { UnLoginHeader } from "@/components/iris/unloginHeader";
import { ParticleTextReveal }  from "@/components/iris/ParticleTextReveal";
// import { getAuth, onAuthStateChanged, User } from "firebase/auth";
// import { auth } from "@/lib/firebase";
export default function HomePage() {
  const router = useRouter();
  // Auth（簡易）
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
//   const transition = { duration: 0.8, ease: [0.6, 0.01, -0.05, 0.9] };
//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         console.log("ログイン中ユーザー:", user);
//         console.log("UID:", user.uid);
//         console.log("Email:", user.email);
//         console.log("DisplayName:", user.displayName);
//         console.log("PhotoURL:", user.photoURL);
//         setUser(user);
//         // router.push('/home');
//       } else {
//         console.log('未ログイン');
//         setUser(null);
//         router.push('/');
//       }
//       setLoading(false);
//     });
//     return () => unsubscribe();
//   }, []);
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
                <Header />
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