import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PageContainerProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
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
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={cn("w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8 space-y-6", className)}
        >
            {(title || actions) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="space-y-1">
                        {title && (
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-muted-foreground text-sm sm:text-base">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            {actions}
                        </div>
                    )}
                </div>
            )}

            {children}
        </motion.div>
    );
}
