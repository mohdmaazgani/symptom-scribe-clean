/**
 * Async Mutex Lock / Semaphore to prevent concurrent offline database sync executions.
 */
export class AsyncMutex {
  private isLocked: boolean = false;
  private queue: (() => void)[] = [];

  async runExclusive<T>(callback: () => Promise<T>): Promise<T | null> {
    if (this.isLocked) {
      // If already locked, skip or wait to avoid race condition duplicates
      return null;
    }

    this.isLocked = true;
    try {
      return await callback();
    } finally {
      this.isLocked = false;
      const next = this.queue.shift();
      if (next) {
        next();
      }
    }
  }

  isCurrentlyLocked(): boolean {
    return this.isLocked;
  }
}

export const syncMutex = new AsyncMutex();
