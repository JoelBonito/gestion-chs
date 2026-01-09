import { ReactNode, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTopBarActions } from "@/context/TopBarActionsContext";

interface PageContainerProps {
    children: ReactNode;
    title?: string; // Mantido para compatibilidade, mas ignorado visualmente (já está na TopBar)
    subtitle?: string; // Subtitle might be useful, but user said "remove title from content". I'll keep subtitle optionally if passed? User said remove title.
    actions?: ReactNode;
    className?: string;
}

export function PageContainer({
    children,
    title,
    subtitle,
    actions,
    className
}: PageContainerProps) {
    const { setActions } = useTopBarActions();

    // Teleport actions to TopBar
    useEffect(() => {
        setActions(actions || null);
        return () => setActions(null);
    }, [actions, setActions]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn("w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 space-y-6", className)}
        >
            {/* 
               Header removed as per user request. 
               Title is in TopBar. 
               Actions are teleported to TopBar.
            */}

            {/* If subtitle exists, maybe we show it? User didn't explicitly ban subtitle, but said 'retirar o titulo do conteudo'. 
                Usually subtitles go with titles. I'll hide it for now to be safe and clean. 
            */}

            {children}
        </motion.div>
    );
}
