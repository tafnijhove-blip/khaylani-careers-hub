import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-glass">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="h-24 w-24 rounded-full bg-gradient-primary/10 flex items-center justify-center mb-6 animate-pulse-glow">
          <Icon className="h-12 w-12 text-primary" />
        </div>
        <p className="text-xl font-semibold text-foreground mb-2">{title}</p>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="gap-2">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
