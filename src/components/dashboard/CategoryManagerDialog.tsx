import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Check, Tag } from "lucide-react";
import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  SymptomCategory,
} from "@/lib/symptom-categories";

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ef4444", // Red
  "#10b981", // Green
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#6b7280", // Gray
  "#f43f5e", // Rose
  "#84cc16", // Lime
  "#d97706", // Dark Amber
  "#6366f1", // Indigo
];

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryRenamed?: (oldName: string, newName: string) => void;
  onCategoriesChanged?: () => void;
}

export const CategoryManagerDialog: React.FC<CategoryManagerDialogProps> = ({
  open,
  onOpenChange,
  onCategoryRenamed,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<SymptomCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#3b82f6");

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [isAdding, setIsAdding] = useState(false);

  const loadCategories = () => {
    setCategories(getCategories());
  };

  useEffect(() => {
    if (open) {
      loadCategories();
      setIsAdding(false);
      setEditingId(null);
    }
  }, [open]);

  const handleStartEdit = (cat: SymptomCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
  };

  const handleSaveEdit = (cat: SymptomCategory) => {
    if (!editName.trim()) return;
    const oldName = cat.name;
    const updated = updateCategory(cat.id, editName.trim(), editColor);
    setCategories(updated);

    if (oldName !== editName.trim() && onCategoryRenamed) {
      onCategoryRenamed(oldName, editName.trim());
    }

    if (onCategoriesChanged) {
      onCategoriesChanged();
    }
    setEditingId(null);
  };

  const handleAddCategory = () => {
    if (!newName.trim()) return;
    addCategory(newName.trim(), newColor);
    loadCategories();
    setNewName("");
    setIsAdding(false);
    if (onCategoriesChanged) {
      onCategoriesChanged();
    }
  };

  const handleDeleteCategory = (cat: SymptomCategory) => {
    const updated = deleteCategory(cat.id);
    setCategories(updated);
    if (onCategoriesChanged) {
      onCategoriesChanged();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Manage Symptom Categories
          </DialogTitle>
          <DialogDescription>
            Customize, rename, or create color-coded category labels for your health records.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Add Category Section */}
          {!isAdding ? (
            <Button
              onClick={() => setIsAdding(true)}
              variant="outline"
              className="w-full border-dashed gap-2 text-teal-600 dark:text-teal-400 border-teal-500/40 hover:bg-teal-50 dark:hover:bg-teal-950/40"
            >
              <Plus className="w-4 h-4" />
              Add Custom Category
            </Button>
          ) : (
            <div className="p-3 border rounded-lg bg-muted/30 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                New Category
              </h4>
              <div className="space-y-2">
                <Label htmlFor="cat-name">Category Name</Label>
                <Input
                  id="cat-name"
                  placeholder="e.g., Allergy, Dental, Chronic..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Choose Color</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        newColor === color ? "scale-125 ring-2 ring-ring ring-offset-1" : "hover:scale-110"
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-6 h-6 p-0 border-0 rounded-full cursor-pointer bg-transparent"
                    title="Custom color"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddCategory} disabled={!newName.trim()}>
                  Save Category
                </Button>
              </div>
            </div>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Existing Categories
            </h4>
            <div className="divide-y divide-border border rounded-md overflow-hidden">
              {categories.map((cat) => {
                const isEditing = editingId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="p-3 flex items-center justify-between gap-3 bg-card hover:bg-muted/20 transition-colors"
                  >
                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-8 text-sm"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setEditColor(color)}
                              style={{ backgroundColor: color }}
                              className={`w-5 h-5 rounded-full transition-transform ${
                                editColor === color ? "scale-125 ring-2 ring-ring" : ""
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-end gap-1 pt-1">
                          <Button variant="ghost" size="xs" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                          <Button size="xs" onClick={() => handleSaveEdit(cat)}>
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm font-medium truncate">{cat.name}</span>
                          {cat.isDefault && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => handleStartEdit(cat)}
                            title="Edit / Rename Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          {!cat.isDefault && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteCategory(cat)}
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
