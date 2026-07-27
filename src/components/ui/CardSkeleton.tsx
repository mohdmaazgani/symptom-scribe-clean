import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CardSkeletonProps {
  count?: number;
  variant?: "stat" | "row";
}

const CardSkeleton = ({ count = 4, variant = "stat" }: CardSkeletonProps) => {
  if (variant === "row") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3"
          >
            <Skeleton className="h-4 w-4 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1 rounded" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 rounded mb-2" />
            <Skeleton className="h-3 w-36 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CardSkeleton;
