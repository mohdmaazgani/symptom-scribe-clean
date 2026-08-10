import { useState, useCallback, useEffect, useRef } from "react";

export function useCryptoWorker() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.Worker) {
      try {
        workerRef.current = new Worker(new URL("../crypto.worker.ts", import.meta.url), {
          type: "module",
        });
      } catch (err) {
        console.warn("Web Worker initialization fallback:", err);
      }
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const encryptBatchAsync = useCallback(
    async (items: string[], keyRaw: ArrayBuffer): Promise<string[]> => {
      if (!workerRef.current) {
        throw new Error("Web Worker not supported or initialized");
      }

      setIsProcessing(true);
      const taskId = crypto.randomUUID();

      return new Promise((resolve, reject) => {
        const handler = (event: MessageEvent) => {
          if (event.data.id === taskId) {
            setIsProcessing(false);
            workerRef.current?.removeEventListener("message", handler);

            if (event.data.status === "SUCCESS") {
              resolve(event.data.result);
            } else {
              reject(new Error(event.data.error));
            }
          }
        };

        workerRef.current?.addEventListener("message", handler);
        workerRef.current?.postMessage({
          id: taskId,
          type: "ENCRYPT_BATCH",
          payload: { items, keyRaw },
        });
      });
    },
    []
  );

  return {
    isProcessing,
    progress,
    encryptBatchAsync,
  };
}
