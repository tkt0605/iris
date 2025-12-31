'use client';
import React, { useState, useEffect, useEffectEvent } from "react";
import { Header } from "@/components/iris/Header";
import { Aside } from "@/components/iris/Aside";

interface IndexLayoutProps {
    children: React.ReactNode
}

export default function IndexLayout({ children }: IndexLayoutProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        const saved = localStorage.getItem('AsideOpenStorage');
        console.log(saved);
        if (saved !== null){
            setSidebarOpen(saved === "true");
        }
        setMounted(true);
    }, []);
    const toggleSidebar = () => {
        const next = !isSidebarOpen;
        setSidebarOpen(next);
        localStorage.setItem('AsideOpenStorage', String(next));
    };
    return (
        <div className="relative w-full h-screen overflow-hidden bg-white dark:bg-black">
            <div className={`
                fixed top-0 left-0 h-full z-40
                ${mounted ? 'duration-300' : 'duration-300'}
                ${isSidebarOpen ? "w-16" : "w-60" }
            `}>
                 {/* {!isOpen && <Aside />} */}
                 <Aside isOpen={isSidebarOpen} onToggle={toggleSidebar} />
            </div>
            <div className="fixed top-0 left-0 w-full h-14 z-30 pointer-events-none">
                <Header isSideOpen={isSidebarOpen}/>
            </div>
            {/* <main 
                className="w-full h-full pt-14 md:pl-60 transition-all duration-300"
            > */}
            {/* <main className={[
                "w-full h-full pt-14 transition-all duration-300",
                isOpen ? "md:pl-12" : "md:pl-60"
            ].join('')}> */}
            <main 
                className={`
                w-full h-full pt-14 transition-all 
                ${mounted ? "duration-300" : "duration-300"}
                ${isSidebarOpen ? "md:pl-16" : "md:pl-64"}
                `}
            >
                <div className="w-full h-full overflow-y-auto no-scrollbar">
                    {children}
                </div>
            </main>

        </div>
    );
}