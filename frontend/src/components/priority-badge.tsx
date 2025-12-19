import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

interface PriorityBadgeProps {
  priority: string | null;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const normalizedPriority = priority?.toLowerCase();

  const variants = {
    high: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
    low: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
  };

  const variant = variants[normalizedPriority as keyof typeof variants];

  return (
    <Badge className={cn("uppercase", variant)}>
      {priority || "Unknown"}
    </Badge>
  );
}
