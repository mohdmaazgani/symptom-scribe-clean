import { supabase } from "@/integrations/supabase/client";

export const compressImage = (
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height));
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const newFile = new File([blob], file.name, {
                type: file.type || "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(newFile);
            } else {
              reject(new Error("Canvas toBlob failed"));
            }
          },
          file.type || "image/jpeg",
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

/**
 * Upload a symptom attachment to a private bucket and return the storage object path.
 * Callers should persist the path (not a signed URL) and mint signed URLs when rendering.
 */
export const uploadSymptomImage = async (file: File, userId: string): Promise<string> => {
  const fileExt = file.name.split(".").pop() || "jpg";
  const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

  const { error } = await supabase.storage.from("symptom-attachments").upload(fileName, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw error;
  }

  // Verify the owner can mint a signed URL (fails closed if bucket is misconfigured)
  const { error: signedError } = await supabase.storage
    .from("symptom-attachments")
    .createSignedUrl(fileName, SIGNED_URL_TTL_SECONDS);

  if (signedError) {
    throw signedError;
  }

  return fileName;
};

/** Refresh a signed URL from a storage path (`userId/uuid.ext`). */
export const createSymptomImageSignedUrl = async (
  path: string,
  expiresIn = SIGNED_URL_TTL_SECONDS
): Promise<string> => {
  const { data, error } = await supabase.storage
    .from("symptom-attachments")
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw error || new Error("Failed to create signed URL");
  }

  return data.signedUrl;
};
