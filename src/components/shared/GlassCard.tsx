import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
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
  hoverEffect = true,
}: GlassCardProps) {
  const CardWrapper = hoverEffect ? motion.create(Card) : Card;
  const hasHeader = title || description;
  const hasFooter = footer;

  // Check if className contains p-0 to skip CardContent wrapper
  const skipCardContent = className?.includes("p-0") || className?.includes("p-");

  return (
    <CardWrapper
      whileHover={hoverEffect ? { y: -2, transition: { duration: 0.2 } } : undefined}
      className={cn(
        "bg-card overflow-hidden border border-[var(--border)] transition-all duration-300",
        hoverEffect && "hover:border-primary/30",
        className
      )}
    >
      {hasHeader && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      {skipCardContent ? children : <CardContent>{children}</CardContent>}
      {hasFooter && <CardFooter>{footer}</CardFooter>}
    </CardWrapper>
  );
}
