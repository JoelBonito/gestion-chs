import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

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

  const getVariantStyles = (v: string) => {
    switch (v) {
      case "success": return "text-success border-success/20 bg-success/5";
      case "warning": return "text-warning border-warning/20 bg-warning/5";
      case "destructive": return "text-destructive border-destructive/20 bg-destructive/5";
      case "info": return "text-info border-info/20 bg-info/5";
      default: return "text-primary border-border bg-card";
    }
  };

  const getIconContainerStyles = (v: string) => {
    switch (v) {
      case "success": return "bg-success/10 text-success";
      case "warning": return "bg-warning/10 text-warning";
      case "destructive": return "bg-destructive/10 text-destructive";
      case "info": return "bg-info/10 text-info";
      default: return "bg-[var(--primary)]/10 text-[var(--primary)]";
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden relative transition-all duration-300 border border-[var(--border)] bg-card h-full",
      className
    )}>
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {title}
          </p>
          {icon && (
            <div className={cn("h-8 w-8 rounded-full flex items-center justify-center transition-colors", getIconContainerStyles(variant))}>
              {icon}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1 mt-2">
          <div className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {value}
          </div>

          {(trend || subtitle) && (
            <div className="flex items-center text-xs gap-2 mt-1">
              {trend && (
                <span className={cn(
                  "flex items-center font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}>
                  {trend.isPositive ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
                  {Math.abs(trend.value)}%
                </span>
              )}

              {subtitle && (
                <span className="text-[var(--text-tertiary)] truncate line-clamp-1">
                  {subtitle}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>

    </Card>
  );
}
