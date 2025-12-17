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
            className={cn("w-full min-h-[calc(100vh-4rem)] p-3 xs:p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6", className)}
        >
            {(title || actions) && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
                    <div className="space-y-0.5 sm:space-y-1 min-w-0">
                        {title && (
                            <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-muted-foreground text-xs sm:text-sm truncate">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                            {actions}
                        </div>
                    )}
                </div>
            )}

            {children}
        </motion.div>
    );
}
