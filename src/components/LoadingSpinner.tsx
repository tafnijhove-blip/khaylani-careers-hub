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
    sm: "h-5 w-5",
    md: "h-10 w-10",
    lg: "h-16 w-16",
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-lg" />
        <Loader2 className={cn("animate-spin text-primary relative z-10", sizeClasses[size])} />
      </div>
      {message && (
        <div className="space-y-1 text-center">
          <p className="text-base font-medium text-foreground">{message}</p>
          <p className="text-sm text-muted-foreground">Even geduld...</p>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
