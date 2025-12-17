import React from "react";
import { cn } from "@/lib/utils";

interface IconWithBadgeProps {
  icon: React.ReactNode;
  count?: number;
  className?: string;
  badgeClassName?: string;
}

export const IconWithBadge: React.FC<IconWithBadgeProps> = ({
  icon,
  count = 0,
  className,
  badgeClassName
}) => {
  return (
    <div className={cn("relative inline-flex", className)}>
      {icon}
      {count > 0 && (
        <span
          className={cn(
            "absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-lg h-4 w-4 flex items-center justify-center font-semibold min-w-[16px]",
            badgeClassName
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
};