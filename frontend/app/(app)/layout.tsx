'use client';
import React from "react";
import { Header } from "@/components/iris/Header";
import { Aside } from "@/components/iris/Aside";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
interface IndexLayoutProps{
    children: React.ReactNode
}
export default function IndexLayout({children} : IndexLayoutProps){
    const [isOpen, setOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true); // 初期値はtrueが良いです
    
    return (
        <div className="min-h-screen flex bg-white dark:bg-black">
            <div className="hidden md:block">
                { !isOpen && (
                    <Aside />
                )}
            </div>


            <div className={`flex-1 flex flex-col ${!isOpen ? 'md:ml-60' : ''}`}>
                <Header />
                <main className="flex-1 mt-4">
                    {children}
                </main>
            </div>
        </div>
    );

}