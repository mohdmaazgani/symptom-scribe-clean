import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNetworkStatus } from './useNetworkStatus';
import { syncOfflineData } from '@/lib/offline-db';
import { showSuccess } from '@/lib/toast-helpers';

// Mock dependencies
vi.mock('@/lib/offline-db', () => ({
  syncOfflineData: vi.fn()
}));

vi.mock('@/lib/toast-helpers', () => ({
  showSuccess: vi.fn()
}));

describe('useNetworkStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default to online
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true
    });
  });

  const fireOnline = () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true, configurable: true });
    window.dispatchEvent(new Event('online'));
  };

  const fireOffline = () => {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true, configurable: true });
    window.dispatchEvent(new Event('offline'));
  };

  it('should initialize with correct online state', () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.isSyncing).toBe(false);
  });

  it('should track offline/online transitions', () => {
    const { result } = renderHook(() => useNetworkStatus());
    
    act(() => {
      fireOffline();
    });
    expect(result.current.isOnline).toBe(false);

    act(() => {
      fireOnline();
    });
    expect(result.current.isOnline).toBe(true);
  });

  it('should auto-sync when coming back online if autoSync is true', async () => {
    vi.mocked(syncOfflineData).mockResolvedValue(true);
    const onSynced = vi.fn();
    
    act(() => {
      fireOffline();
    });

    const { result } = renderHook(() => useNetworkStatus({ autoSync: true, onSynced }));
    
    expect(result.current.isOnline).toBe(false);
    
    await act(async () => {
      fireOnline();
    });

    expect(syncOfflineData).toHaveBeenCalledTimes(1);
    expect(onSynced).toHaveBeenCalledTimes(1);
    expect(showSuccess).toHaveBeenCalled();
  });

  it('should not auto-sync when coming back online if autoSync is false', async () => {
    const onSynced = vi.fn();
    
    act(() => {
      fireOffline();
    });

    renderHook(() => useNetworkStatus({ autoSync: false, onSynced }));
    
    await act(async () => {
      fireOnline();
    });

    expect(syncOfflineData).not.toHaveBeenCalled();
    expect(onSynced).not.toHaveBeenCalled();
  });

  it('manual triggerSync should sync if online and not already syncing', async () => {
    vi.mocked(syncOfflineData).mockResolvedValue(true);
    const onSynced = vi.fn();
    
    const { result } = renderHook(() => useNetworkStatus({ onSynced }));
    
    await act(async () => {
      await result.current.triggerSync();
    });

    expect(syncOfflineData).toHaveBeenCalledTimes(1);
    expect(onSynced).toHaveBeenCalledTimes(1);
  });

  it('manual triggerSync should not sync if offline', async () => {
    act(() => {
      fireOffline();
    });
    
    const onSynced = vi.fn();
    const { result } = renderHook(() => useNetworkStatus({ onSynced }));
    
    await act(async () => {
      await result.current.triggerSync();
    });

    expect(syncOfflineData).not.toHaveBeenCalled();
    expect(onSynced).not.toHaveBeenCalled();
  });

  it('onSynced is not called if sync fails or nothing to sync', async () => {
    // syncOfflineData returning false means nothing to sync or failed
    vi.mocked(syncOfflineData).mockResolvedValue(false);
    const onSynced = vi.fn();
    
    const { result } = renderHook(() => useNetworkStatus({ onSynced }));
    
    await act(async () => {
      await result.current.triggerSync();
    });

    expect(syncOfflineData).toHaveBeenCalledTimes(1);
    expect(onSynced).not.toHaveBeenCalled();
    expect(showSuccess).not.toHaveBeenCalled();
  });

  it('should update isSyncing state during sync', async () => {
    let resolveSync: (val: boolean) => void = () => {};
    const syncPromise = new Promise<boolean>((resolve) => {
      resolveSync = resolve;
    });
    vi.mocked(syncOfflineData).mockReturnValue(syncPromise);
    
    const { result } = renderHook(() => useNetworkStatus());
    
    let triggerPromise: Promise<void> | undefined;
    act(() => {
      triggerPromise = result.current.triggerSync();
    });

    expect(result.current.isSyncing).toBe(true);

    await act(async () => {
      resolveSync(true);
      await triggerPromise;
    });

    expect(result.current.isSyncing).toBe(false);
  });
});
