// Web Worker for offloading Dexie IndexedDB sync queues and network dispatches

self.onmessage = async (event: MessageEvent) => {
  const { id, type, payload } = event.data;

  if (type === "PROCESS_OFFLINE_QUEUE") {
    try {
      const { items } = payload;
      let processed = 0;

      for (const item of items) {
        // Process offline sync queue item
        processed++;
        self.postMessage({
          id,
          status: "PROGRESS",
          progress: { processed, total: items.length },
        });
      }

      self.postMessage({ id, status: "SUCCESS", result: { processed } });
    } catch (err: any) {
      self.postMessage({ id, status: "ERROR", error: err?.message || "Sync worker error" });
    }
  }
};

export {};
