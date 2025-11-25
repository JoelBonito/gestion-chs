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
  variant?: "default" | "success" | "warning" | "destructive" | "blue" | "purple" | "pink" | "orange" | "emerald" | "lime" | "indigo";
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend,
  variant = "default" 
}: StatCardProps) {
  const variantStyles = {
    default: "border-primary/20 hover:border-primary/40",
    success: "border-success/20 hover:border-success/40",
    warning: "border-warning/20 hover:border-warning/40", 
    destructive: "border-destructive/20 hover:border-destructive/40",
    blue: "border-blue-500/20 hover:border-blue-500/40",
    purple: "border-purple-500/20 hover:border-purple-500/40",
    pink: "border-pink-500/20 hover:border-pink-500/40",
    orange: "border-orange-500/20 hover:border-orange-500/40",
    emerald: "border-emerald-500/20 hover:border-emerald-500/40",
    lime: "border-lime-500/20 hover:border-lime-500/40",
    indigo: "border-indigo-500/20 hover:border-indigo-500/40",
  };

  const iconGradients = {
    default: "bg-gradient-to-br from-primary to-primary-dark",
    success: "bg-gradient-to-br from-success to-emerald-600",
    warning: "bg-gradient-to-br from-warning to-orange-600", 
    destructive: "bg-gradient-to-br from-destructive to-red-600",
    blue: "bg-gradient-to-br from-blue-500 to-blue-600",
    purple: "bg-gradient-to-br from-purple-500 to-purple-600",
    pink: "bg-gradient-to-br from-pink-500 to-pink-600",
    orange: "bg-gradient-to-br from-orange-500 to-orange-600",
    emerald: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    lime: "bg-gradient-to-br from-lime-500 to-lime-600",
    indigo: "bg-gradient-to-br from-indigo-500 to-indigo-600",
  };

  return (
    <Card className={cn(
      "shadow-float hover:shadow-float-hover transition-all duration-300 hover:scale-[1.02] animate-scale-in border-2",
      variantStyles[variant]
    )}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Icon at top if provided */}
          {icon && (
            <div className={cn(
              "inline-flex p-4 rounded-2xl shadow-icon",
              iconGradients[variant]
            )}>
              <div className="text-white">
                {icon}
              </div>
            </div>
          )}

          {/* Title */}
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          {/* Value - large and bold */}
          <div className="space-y-1">
            <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
            {subtitle && (
              <div className="text-xs text-muted-foreground">{subtitle}</div>
            )}
          </div>

          {/* Trend indicator */}
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-medium",
              trend.isPositive ? "text-success" : "text-destructive"
            )}>
              <span className={cn(
                "inline-block w-2 h-2 rounded-full mr-2",
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
