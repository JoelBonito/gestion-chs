import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    title?: ReactNode;
    description?: ReactNode;
    footer?: ReactNode;
    hoverEffect?: boolean;
}

export function GlassCard({
    children,
    className,
    title,
    description,
    footer,
    hoverEffect = true
}: GlassCardProps) {
    const CardWrapper = hoverEffect ? motion.create(Card) : Card;

    return (
        <CardWrapper
            whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2 } } : undefined}
            className={cn(
                "border-none shadow-lg bg-white/80 dark:bg-card/50 backdrop-blur-sm transition-all duration-300",
                hoverEffect && "hover:shadow-xl hover:bg-white/90 dark:hover:bg-card/60",
                className
            )}
        >
            {(title || description) && (
                <CardHeader>
                    {title && <CardTitle>{title}</CardTitle>}
                    {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
            )}
            <CardContent>
                {children}
            </CardContent>
            {footer && <CardFooter>{footer}</CardFooter>}
        </CardWrapper>
    );
}
