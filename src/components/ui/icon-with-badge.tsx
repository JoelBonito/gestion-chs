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
  badgeClassName,
}) => {
  return (
    <div className={cn("relative inline-flex", className)}>
      {icon}
      {count > 0 && (
        <span
          className={cn(
            "bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-4 w-4 min-w-[16px] items-center justify-center rounded-lg text-xs font-semibold",
            badgeClassName
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
};
