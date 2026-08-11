import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  FileText,
  UploadCloud,
  Search,
  Tag,
  Folder,
  Trash2,
  Download,
  Eye,
  Copy,
  Check,
  Sparkles,
  FileCheck,
  Grid,
  List as ListIcon,
  X,
  FileCode,
  ShieldCheck,
  RefreshCw,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { extractTextFromDocument } from "@/lib/ocr";
import { db, type OfflineDocument } from "@/lib/offline-db";
import { showSuccess, showError, showInfo } from "@/lib/toast-helpers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFamily } from "@/context/FamilyContext";

export interface DocumentRecord {
  id: string;
  user_id: string;
  dependent_id?: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  category: "lab_report" | "prescription" | "insurance" | "medical_record" | "other";
  tags: string[];
  extracted_text: string;
  ocr_status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  updated_at?: string;
}

const CATEGORIES = [
  { id: "all", label: "All Documents", icon: Folder },
  { id: "lab_report", label: "Lab Reports", icon: FileText },
  { id: "prescription", label: "Prescriptions", icon: FileCheck },
  { id: "insurance", label: "Insurance Papers", icon: ShieldCheck },
  { id: "medical_record", label: "Medical History", icon: FileCode },
  { id: "other", label: "General & Other", icon: Tag },
];

export default function DocumentHub() {
  const { activeProfile } = useFamily();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState<string>("");
  const [uploadCategory, setUploadCategory] = useState<DocumentRecord["category"]>("lab_report");
  const [uploadTags, setUploadTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Selected document detail modal
  const [activeDoc, setActiveDoc] = useState<DocumentRecord | null>(null);
  const [copied, setCopied] = useState(false);

  // Re-fetch documents whenever activeProfile changes
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id);

      if (activeProfile.isPrimary) {
        query = query.is("dependent_id", null);
      } else {
        query = query.eq("dependent_id", activeProfile.id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (!error && data) {
        setDocuments(data as unknown as DocumentRecord[]);
      } else {
        console.warn("Falling back to local IndexedDB documents:", error);
        const localDocs = await db.documents
          .where("user_id")
          .equals(user.id)
          .and((d) => d.pending_delete === 0)
          .reverse()
          .sortBy("created_at");

        setDocuments(localDocs as unknown as DocumentRecord[]);
      }
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoading(false);
    }
  }, [activeProfile.id, activeProfile.isPrimary]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Add tag handler
  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !uploadTags.includes(trimmed)) {
      setUploadTags([...uploadTags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setUploadTags(uploadTags.filter((t) => t !== tagToRemove));
  };

  // Upload handler
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      showError("Authentication Required", "Please sign in to upload documents.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStep("Starting document analysis...");

    try {
      // Step 1: Run Client-side OCR using Tesseract.js
      setUploadStep("Extracting text via OCR engine...");
      const ocrResult = await extractTextFromDocument(file, (prog) => {
        setUploadProgress(10 + Math.round(prog * 0.4));
      });

      setUploadProgress(60);
      setUploadStep("Uploading document file...");

      const fileExt = file.name.split(".").pop();
      const storagePath = `${user.id}/${Date.now()}_${crypto.randomUUID().slice(0, 8)}.${fileExt}`;

      const { data: storageData, error: storageError } = await supabase.storage
        .from("medical-documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      setUploadProgress(85);
      setUploadStep("Saving document metadata & searchable OCR record...");

      const docId = crypto.randomUUID();
      const dependentId = activeProfile.isPrimary ? null : activeProfile.id;

      const newDocRecord: OfflineDocument = {
        id: docId,
        user_id: user.id,
        file_name: file.name,
        file_type: file.type || "application/octet-stream",
        file_size: file.size,
        storage_path: storageData?.path || storagePath,
        category: uploadCategory,
        tags: uploadTags,
        extracted_text: ocrResult.text,
        ocr_status: "completed",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pending_sync: storageError ? 1 : 0,
        pending_delete: 0,
      };

      const { error: dbError } = await supabase.from("documents").insert({
        id: newDocRecord.id,
        user_id: newDocRecord.user_id,
        dependent_id: dependentId,
        file_name: newDocRecord.file_name,
        file_type: newDocRecord.file_type,
        file_size: newDocRecord.file_size,
        storage_path: newDocRecord.storage_path,
        category: newDocRecord.category,
        tags: newDocRecord.tags,
        extracted_text: newDocRecord.extracted_text,
        ocr_status: newDocRecord.ocr_status,
      });

      await db.documents.put(newDocRecord);

      setUploadProgress(100);
      setUploadStep("Upload & OCR complete!");
      showSuccess(
        "Document Uploaded!",
        `Saved under profile: ${activeProfile.name}. Extracted ${ocrResult.text.length} chars of text.`
      );

      setUploadTags([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchDocuments();
    } catch (err) {
      console.error("Upload error:", err);
      showError("Upload Failed", err instanceof Error ? err.message : "Failed to process and save document.");
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStep("");
      }, 1000);
    }
  };

  const handleDeleteDocument = async (id: string, storagePath: string) => {
    try {
      await supabase.from("documents").delete().eq("id", id);
      await supabase.storage.from("medical-documents").remove([storagePath]);
      await db.documents.delete(id);

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      if (activeDoc?.id === id) setActiveDoc(null);
      showSuccess("Document Deleted", "Document removed.");
    } catch (err) {
      showError("Delete Failed", err instanceof Error ? err.message : "Unable to delete document.");
    }
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesName = doc.file_name.toLowerCase().includes(query);
      const matchesCategoryText = doc.category.toLowerCase().includes(query);
      const matchesTags = doc.tags?.some((t) => t.toLowerCase().includes(query));
      const matchesExtractedText = doc.extracted_text?.toLowerCase().includes(query);

      return matchesCategory && (matchesName || matchesCategoryText || matchesTags || matchesExtractedText);
    });
  }, [documents, selectedCategory, searchQuery]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showInfo("Copied", "Document text copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (doc: DocumentRecord) => {
    try {
      const { data, error } = await supabase.storage
        .from("medical-documents")
        .download(doc.storage_path);

      if (error || !data) {
        showError("Download Failed", "Could not retrieve file.");
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      showError("Download Error", "Unable to download file.");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Title Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-cyan-500/20">
              <Sparkles className="h-3.5 w-3.5" /> Secure Medical Vault & OCR
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Document Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Upload and search medical reports for{" "}
              <span className="font-semibold text-cyan-400">{activeProfile.name}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!activeProfile.isPrimary && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-3 py-1 text-xs">
                <Users className="h-3.5 w-3.5 mr-1" /> Profile: {activeProfile.name}
              </Badge>
            )}
            <Button
              onClick={fetchDocuments}
              variant="outline"
              size="sm"
              className="bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Profile Documents</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">{documents.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">OCR Searchable</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {documents.filter((d) => d.extracted_text && d.extracted_text.length > 0).length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Lab & Prescriptions</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">
              {documents.filter((d) => d.category === "lab_report" || d.category === "prescription").length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Storage Usage</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {formatFileSize(documents.reduce((acc, curr) => acc + (curr.file_size || 0), 0))}
            </p>
          </div>
        </div>

        {/* Drag & Drop File Upload Section */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
          }}
          className={`relative rounded-2xl border-2 border-dashed p-6 md:p-8 transition-all duration-300 ${
            dragActive
              ? "border-cyan-500 bg-cyan-950/20 scale-[1.01]"
              : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,application/pdf"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                <UploadCloud className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Upload Medical File for {activeProfile.name}</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Drag & drop image/PDF reports or browse files to auto-run OCR indexing.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as DocumentRecord["category"])}
                className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none"
              >
                <option value="lab_report">Lab Report</option>
                <option value="prescription">Prescription</option>
                <option value="insurance">Insurance Paper</option>
                <option value="medical_record">Medical History</option>
                <option value="other">General</option>
              </select>

              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs px-5 py-2.5 rounded-lg"
              >
                Select File
              </Button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Add Tags:
            </span>
            {uploadTags.map((tag) => (
              <Badge key={tag} className="bg-slate-800 text-cyan-300 text-xs py-0.5 px-2 flex items-center gap-1">
                {tag}
                <X className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => handleRemoveTag(tag)} />
              </Badge>
            ))}
            <div className="flex items-center gap-1">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Type tag & press Enter..."
                className="h-7 w-40 text-xs bg-slate-950 border-slate-800 text-slate-200"
              />
              <Button type="button" onClick={handleAddTag} variant="ghost" size="sm" className="h-7 text-xs px-2 text-slate-400">
                + Add
              </Button>
            </div>
          </div>

          {isUploading && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-300 font-medium">
                <span>{uploadStep}</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2 bg-slate-800" />
            </div>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 backdrop-blur-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search OCR text, titles, tags..."
              className="pl-10 bg-slate-950 border-slate-800 text-slate-100 text-xs rounded-xl"
            />
            {searchQuery && (
              <X
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer hover:text-white"
              />
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    active
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "bg-slate-950/60 text-slate-400 border border-slate-800/80 hover:text-slate-200"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg ${
                viewMode === "grid" ? "bg-slate-800 text-cyan-400" : "text-slate-400"
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg ${
                viewMode === "list" ? "bg-slate-800 text-cyan-400" : "text-slate-400"
              }`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Document Grid / List */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-sm">Loading documents...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/20">
            <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-slate-300 font-semibold text-base">No Documents Found</h4>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              No files saved under active profile ({activeProfile.name}). Upload your first report above.
            </p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                className="group relative bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <Badge className="bg-slate-800 text-cyan-300 text-[10px] uppercase font-semibold">
                      {doc.category.replace("_", " ")}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setActiveDoc(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownload(doc)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.storage_path)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white truncate mb-1" title={doc.file_name}>
                    {doc.file_name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    Uploaded {new Date(doc.created_at).toLocaleDateString()} • {formatFileSize(doc.file_size)}
                  </p>

                  <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/60 mb-4 min-h-[70px]">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold uppercase tracking-wider text-cyan-400/80 flex items-center gap-1">
                        <Sparkles className="h-2.5 w-2.5" /> Extracted Text (OCR)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-3 italic">
                      {doc.extracted_text || "No text extracted."}
                    </p>
                  </div>
                </div>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-800/60">
                    {doc.tags.map((t) => (
                      <span key={t} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl divide-y divide-slate-800/80">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center shrink-0">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{doc.file_name}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="capitalize text-cyan-400">{doc.category.replace("_", " ")}</span>
                      <span>•</span>
                      <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button onClick={() => setActiveDoc(doc)} variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-cyan-400">
                    <Eye className="h-3.5 w-3.5 mr-1" /> Inspect
                  </Button>
                  <Button onClick={() => handleDownload(doc)} variant="ghost" size="sm" className="text-xs text-slate-300 hover:text-emerald-400">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button onClick={() => handleDeleteDocument(doc.id, doc.storage_path)} variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-rose-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        <Dialog open={!!activeDoc} onOpenChange={() => setActiveDoc(null)}>
          <DialogContent className="max-w-2xl bg-slate-950 border-slate-800 text-slate-100">
            {activeDoc && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-white truncate pr-6">
                    {activeDoc.file_name}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-400">
                    Category: <span className="capitalize text-cyan-400">{activeDoc.category.replace("_", " ")}</span> • Uploaded {new Date(activeDoc.created_at).toLocaleString()}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 my-2">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" /> Extracted OCR Text Content
                      </span>
                      <Button
                        onClick={() => handleCopyText(activeDoc.extracted_text)}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs bg-slate-900 border-slate-800 text-slate-300"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {copied ? "Copied" : "Copy Text"}
                      </Button>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-200 text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                      {activeDoc.extracted_text || "No OCR text extracted."}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4 mt-2">
                  <Button onClick={() => handleDownload(activeDoc)} className="bg-cyan-600 text-white text-xs">
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download File
                  </Button>
                  <Button onClick={() => handleDeleteDocument(activeDoc.id, activeDoc.storage_path)} variant="destructive" size="sm" className="text-xs">
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
