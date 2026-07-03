import { toast } from "@/hooks/use-toast";
export const showSuccess = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "default",
  });
};
export const showError = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "destructive",
  });
};
export const showWarning = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "warning",
  });
};
export const showInfo = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: "info",
    duration:5000, // Set duration to 5 seconds for info toasts
  });
};
export const showLoading = (title: string = "Processing...", description?: string) => {
  const { id, dismiss } = toast({
    title,
    description,
  });
  return { dismiss, id };
};
