import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

const LoadingSpinner = ({ size = "md", message, className }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-glow rounded-full" />
        <Loader2 className={cn("animate-spin text-primary relative z-10", sizeClasses[size])} />
      </div>
      {message && (
        <p className="text-muted-foreground text-sm font-medium animate-fade-in">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
