import { cn } from "@/lib/utils";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

const Spinner = ({ size = "md", className, label = "Loading..." }: SpinnerProps) => {
  return (
    <span role="status" aria-label={label} className={cn("inline-flex items-center justify-center", className)}>
      <span
        className={cn(
          "animate-spin rounded-full border-current border-t-transparent",
          sizeMap[size]
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
};

export default Spinner;
