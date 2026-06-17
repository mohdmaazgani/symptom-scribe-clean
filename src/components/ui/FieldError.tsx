import { cn } from "@/lib/utils";

interface FieldErrorProps {
  message?: string;
  id?: string;
  className?: string;
}

/**
 * Renders an accessible inline field-level validation error message.
 * Use `id` to match the input's `aria-describedby` attribute.
 */
const FieldError = ({ message, id, className }: FieldErrorProps) => {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn("text-sm font-medium text-destructive mt-1", className)}
    >
      {message}
    </p>
  );
};

export default FieldError;
