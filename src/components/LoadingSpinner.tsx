import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

const LoadingSpinner = ({ size = "md", message, className, fullScreen = false }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-20 w-20",
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        <div className="absolute inset-0 animate-pulse-glow rounded-full bg-gradient-primary opacity-20 blur-xl" />
        <Loader2 className={cn("animate-spin text-primary relative z-10", sizeClasses[size])} />
      </div>
      {message && (
        <div className="space-y-2 text-center">
          <p className="text-lg font-semibold text-gradient animate-fade-in">{message}</p>
          <p className="text-sm text-muted-foreground">Even geduld, we bereiden alles voor</p>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
