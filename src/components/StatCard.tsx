import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string | ReactNode;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive" | "info";
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
  className
}: StatCardProps) {
  const variantStyles = {
    default: "border-primary/20 hover:border-primary/40",
    success: "border-success/20 hover:border-success/40",
    warning: "border-warning/20 hover:border-warning/40",
    destructive: "border-destructive/20 hover:border-destructive/40",
    info: "border-info/20 hover:border-info/40",
  };

  const iconStyles = {
    default: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
    destructive: "bg-destructive",
    info: "bg-blue-500",
  };

  return (
    <Card className={cn(
      "shadow-sm hover:shadow-md transition-all duration-300 border",
      variantStyles[variant],
      className
    )}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Icon at top if provided */}
          {icon && (
            <div className={cn(
              "inline-flex p-3 rounded-xl shadow-none text-white",
              iconStyles[variant]
            )}>
              {icon}
            </div>
          )}

          {/* Title */}
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          {/* Value - large and bold */}
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
            {subtitle && (
              <div className="text-xs text-muted-foreground line-clamp-1">{subtitle}</div>
            )}
          </div>

          {/* Trend indicator */}
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              <span className={cn(
                "inline-block w-2 h-2 rounded-lg mr-2",
                trend.isPositive ? "bg-success" : "bg-destructive"
              )}></span>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
