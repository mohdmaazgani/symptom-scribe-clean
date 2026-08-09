import { createWorker } from "tesseract.js";

export interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Extracts text from an uploaded document or image file using Tesseract.js
 * @param file File object (Image/PDF)
 * @param onProgress Optional progress callback (0-100)
 */
export async function extractTextFromDocument(
  file: File | Blob,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  try {
    // Check if the file is an image or PDF
    const fileType = file.type || "";
    
    // For non-images (like raw PDFs or text), attempt simple canvas preview or basic fallback
    if (!fileType.startsWith("image/") && fileType !== "application/pdf") {
      return {
        text: `[Document: ${(file as File).name || "Attached File"}] - Non-image document format.`,
        confidence: 100,
      };
    }

    onProgress?.(10);

    // Initialize Tesseract worker
    const worker = await createWorker("eng");
    
    onProgress?.(30);

    const imageUrl = URL.createObjectURL(file);
    const ret = await worker.recognize(imageUrl);
    
    URL.revokeObjectURL(imageUrl);
    onProgress?.(90);

    await worker.terminate();
    onProgress?.(100);

    const cleanText = ret.data.text ? ret.data.text.trim() : "";
    return {
      text: cleanText || "No readable text extracted from document image.",
      confidence: Math.round(ret.data.confidence || 0),
    };
  } catch (error) {
    console.error("OCR Extraction Error:", error);
    return {
      text: "Failed to extract text from document.",
      confidence: 0,
    };
  }
}
