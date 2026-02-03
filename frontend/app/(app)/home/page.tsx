"use client";

import { difference } from "next/dist/build/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/iris/Header";
import { UnLoginHeader } from "@/components/iris/unloginHeader";
import { Aside } from "@/components/iris/Aside";
import { RecordingWithIris } from "@/components/iris/RecordingWithIris";
import { createClient } from "@/utils/supabase";

export default function HomePage() {
  const router = useRouter();
  // Auth（簡易）
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [isNowRecord, setIsNowRecord] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  
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
      console.log('ログインユーザー：', session?.user?.user_metadata?.name);
    });
    return () => subscription.unsubscribe();
  }, []);

  // クイックアクションカード
  const quickActions = [
    {
      title: "新しい会話",
      description: "左の球体をクリックして話しかけてみましょう",
      icon: "💬",
      gradient: "from-cyan-500/10 to-blue-500/10",
      hoverGradient: "from-cyan-500/20 to-blue-500/20",
    },
    {
      title: "過去の会話",
      description: "これまでの対話履歴を確認できます",
      icon: "📚",
      gradient: "from-purple-500/10 to-pink-500/10",
      hoverGradient: "from-purple-500/20 to-pink-500/20",
    },
    {
      title: "ヒント",
      description: "私は質問応答、アイデア出し、問題解決が得意です",
      icon: "✨",
      gradient: "from-amber-500/10 to-orange-500/10",
      hoverGradient: "from-amber-500/20 to-orange-500/20",
    },
  ];

  return (
    <div className="relative flex items-center justify-center w-full h-full md:overflow-hidden overflow-y-auto  pt-10 pb-10">
      {/* 背景グラデーション - 白ベース */}
      <div className="absolute inset-0 bg-white" />
      
      {/* アニメーション付き光のアクセント */}
      <motion.div
        className="absolute top-1/4 -left-1/4 w-96 h-96 bg-cyan-500/8 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
      />

      {/* メインコンテンツエリア */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 w-full max-w-7xl px-6 py-8">
        
        {/* 左側: 球体エリア - より大きく、中央配置 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative"
        >
          {/* グロー効果 */}
          <div className="absolute inset-0 bg-cyan-500/15 rounded-full blur-3xl scale-110 animate-pulse" />
          
          <div className="relative">
            <RecordingWithIris 
              width={500} 
              height={500}
              transparent={true} 
              onClick={() => setIsNowRecord(true)}
            />
          </div>

          {/* インタラクティブなヒント */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-center"
          >
            <p className="text-cyan-600 text-sm font-medium">
              クリックして話しかける
            </p>
          </motion.div>
        </motion.div>

        {/* 右側: コンテンツエリア */}
        <div className="flex-1 max-w-2xl space-y-8">
          
          {/* ウェルカムメッセージ */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="space-y-4"
          >
            <motion.h1 
              className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              {user?.user_metadata?.name && (
                <motion.span
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="block mt-2"
                >
                  {user.user_metadata.name} さん
                </motion.span>
              )}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.9 }}
              className="space-y-3"
            >
              <h2 className="text-3xl font-bold text-gray-800">
                話しかけてください。
              </h2>
            </motion.div>
          </motion.div>

          {/* クイックアクションカード */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {quickActions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 + index * 0.15 }}
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
                className="relative group cursor-pointer"
              >
                {/* カード背景 */}
                <motion.div
                  className={`
                    relative p-5 rounded-2xl border border-gray-200
                    bg-gradient-to-br ${hoveredCard === index ? action.hoverGradient : action.gradient}
                    backdrop-blur-sm transition-all duration-300 shadow-sm
                  `}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* グロー効果 */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-purple-500/0 group-hover:from-cyan-500/10 group-hover:to-purple-500/10 transition-all duration-300"
                    animate={{
                      opacity: hoveredCard === index ? 1 : 0,
                    }}
                  />

                  <div className="relative z-10 space-y-3">
                    <div className="text-4xl">{action.icon}</div>
                    <h3 className="text-lg font-bold text-gray-800">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* 追加のヒントセクション */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 2 }}
            className="pt-6 border-t border-gray-200"
          >
            <p className="text-gray-500 text-sm leading-relaxed">
              💡 <span className="text-gray-700">ちょっとしたヒント：</span>
              球体をクリックして自由に話しかけてください。
              考えを整理したり、アイデアを膨らませたり、
              何でもお気軽にご相談ください。
            </p>
          </motion.div>
        </div>
      </div>

      {/* パーティクル効果（オプション） */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-500/20 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>
    </div>
  );
}