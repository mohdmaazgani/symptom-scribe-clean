import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { type OfflineSymptom } from "@/lib/offline-db";
import { Button } from "@/components/ui/button";

interface DuplicateSymptomDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  duplicateRecord: OfflineSymptom | null;
  onIgnore: () => void;
  onMerge: () => void;
}

export function DuplicateSymptomDialog({
  isOpen,
  onOpenChange,
  duplicateRecord,
  onIgnore,
  onMerge,
}: DuplicateSymptomDialogProps) {
  if (!duplicateRecord) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Similar Symptom Detected</AlertDialogTitle>
          <AlertDialogDescription>
            You recently logged a similar symptom ("{duplicateRecord.symptoms}") on{" "}
            {new Date(duplicateRecord.created_at).toLocaleString()}.
            <br />
            <br />
            Do you want to ignore this and create a new entry, or merge it by skipping the new entry?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-between">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onIgnore}>
              Ignore & Create New
            </Button>
            <AlertDialogAction onClick={onMerge}>
              Merge (Skip New)
            </AlertDialogAction>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
