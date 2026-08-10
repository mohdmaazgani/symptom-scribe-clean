import { describe, it, expect } from "vitest";
import { AsyncMutex } from "../sync-mutex";

describe("Offline Sync Race Condition Prevention", () => {
  it("should prevent concurrent execution using AsyncMutex", async () => {
    const mutex = new AsyncMutex();
    let counter = 0;

    const task = async () => {
      return await mutex.runExclusive(async () => {
        counter++;
        await new Promise((r) => setTimeout(r, 50));
        return counter;
      });
    };

    // Run two sync tasks simultaneously
    const promise1 = task();
    const promise2 = task();

    const [res1, res2] = await Promise.all([promise1, promise2]);

    // The first task runs to completion; the second task gets skipped (null) because lock is held
    expect(res1).toBe(1);
    expect(res2).toBeNull();
    expect(counter).toBe(1);
  });
});
