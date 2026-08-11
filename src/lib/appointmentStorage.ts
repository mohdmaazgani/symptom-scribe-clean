import { supabase } from "@/integrations/supabase/client";

export interface UploadAppointmentFileResult {
  fileUrl: string;
  fileName: string;
}

export async function uploadAppointmentDocument(
  file: File,
  userId: string
): Promise<UploadAppointmentFileResult> {
  const sanitizeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `${userId}/${Date.now()}_${sanitizeFileName}`;

  const { error } = await supabase.storage
    .from("appointment-documents")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw new Error(error.message || "Failed to upload appointment document.");
  }

  const { data: publicUrlData } = supabase.storage
    .from("appointment-documents")
    .getPublicUrl(filePath);

  return {
    fileUrl: publicUrlData.publicUrl,
    fileName: file.name,
  };
}
