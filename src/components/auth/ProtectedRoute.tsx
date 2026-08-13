import { useContext, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthContext } from "./AuthProvider";
import CardSkeleton from "@/components/ui/CardSkeleton";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Auth loading spinner (shown while auth initializes)
const AuthLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

// Dashboard skeleton (shown while dashboard component loads)
const DashboardSkeleton = () => (
  <div className="space-y-6 p-4 md:p-6 animate-pulse">
    <div>
      <Skeleton className="h-9 w-52 rounded mb-2" />
      <Skeleton className="h-4 w-72 rounded" />
    </div>
    <CardSkeleton count={4} variant="stat" />
    <div className="rounded-2xl border border-border/60 p-6">
      <Skeleton className="h-5 w-44 rounded mb-1" />
      <Skeleton className="h-4 w-60 rounded" />
      <div className="mt-4 space-y-3">
        <CardSkeleton count={3} variant="row" />
      </div>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading } = useContext(AuthContext);

  // Show auth loading spinner while auth initializes
  if (loading) {
    return <AuthLoading />;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Wrap children in Suspense with dashboard skeleton fallback
  // This shows skeleton while lazy-loaded page component loads
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      {children}
    </Suspense>
  );
};

export default ProtectedRoute;
