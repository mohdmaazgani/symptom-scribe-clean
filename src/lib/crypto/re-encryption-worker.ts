import { rotateUserEncryptionKeys, type KeyRotationOptions, type RotationResult } from "./key-rotation";

export interface ReEncryptionTaskPayload {
  oldKey: CryptoKey;
  newKey: CryptoKey;
}

/**
 * Worker helper wrapper for handling background batch re-encryption jobs.
 */
export async function executeBackgroundReEncryption(
  payload: ReEncryptionTaskPayload,
  onProgress?: (processed: number, total: number) => void
): Promise<RotationResult> {
  const options: KeyRotationOptions = {
    oldKey: payload.oldKey,
    newKey: payload.newKey,
    onProgress,
  };

  return await rotateUserEncryptionKeys(options);
}
