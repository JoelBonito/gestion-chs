import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "destructive";
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
    default: "border-border",
    success: "border-success bg-gradient-to-br from-success/5 to-success/10",
    warning: "border-warning bg-gradient-to-br from-warning/5 to-warning/10", 
    destructive: "border-destructive bg-gradient-to-br from-destructive/5 to-destructive/10"
  };

  const iconStyles = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive"
  };

  return (
    <Card className={cn("shadow-card transition-shadow hover:shadow-elevated", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
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
          <div className={cn("p-3 rounded-lg bg-muted/50", iconStyles[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}