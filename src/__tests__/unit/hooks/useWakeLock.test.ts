import { renderHook, act } from '@testing-library/react';
import { useWakeLock } from '@/hooks/useWakeLock';

const mockWakeLockSentinel = {
  release: jest.fn().mockResolvedValue(undefined),
  addEventListener: jest.fn(),
};

const mockWakeLockRequest = jest.fn().mockResolvedValue(mockWakeLockSentinel);

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  Object.defineProperty(navigator, 'wakeLock', {
    value: { request: mockWakeLockRequest },
    configurable: true,
    writable: true,
  });
});

describe('useWakeLock', () => {
  it('reports supported when navigator.wakeLock exists', () => {
    const { result } = renderHook(() => useWakeLock());
    expect(result.current.isSupported).toBe(true);
  });

  it('is inactive by default', () => {
    const { result } = renderHook(() => useWakeLock());
    expect(result.current.isActive).toBe(false);
  });

  it('acquires wake lock and sets isActive true on toggle', async () => {
    const { result } = renderHook(() => useWakeLock());
    await act(async () => { await result.current.toggle(); });
    expect(mockWakeLockRequest).toHaveBeenCalledWith('screen');
    expect(result.current.isActive).toBe(true);
  });

  it('releases wake lock and sets isActive false on second toggle', async () => {
    const { result } = renderHook(() => useWakeLock());
    await act(async () => { await result.current.toggle(); });
    await act(async () => { await result.current.toggle(); });
    expect(mockWakeLockSentinel.release).toHaveBeenCalled();
    expect(result.current.isActive).toBe(false);
  });

  it('persists enabled state to localStorage', async () => {
    const { result } = renderHook(() => useWakeLock());
    await act(async () => { await result.current.toggle(); });
    expect(localStorage.getItem('wake_lock_enabled')).toBe('true');
  });

  it('persists disabled state to localStorage on toggle off', async () => {
    const { result } = renderHook(() => useWakeLock());
    await act(async () => { await result.current.toggle(); });
    await act(async () => { await result.current.toggle(); });
    expect(localStorage.getItem('wake_lock_enabled')).toBe('false');
  });

  it('auto-acquires on mount when localStorage is true', async () => {
    localStorage.setItem('wake_lock_enabled', 'true');
    const { result } = renderHook(() => useWakeLock());
    await act(async () => { await Promise.resolve(); });
    expect(mockWakeLockRequest).toHaveBeenCalledWith('screen');
    expect(result.current.isActive).toBe(true);
  });

  it('reports unsupported when navigator.wakeLock missing', () => {
    Object.defineProperty(navigator, 'wakeLock', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const { result } = renderHook(() => useWakeLock());
    expect(result.current.isSupported).toBe(false);
  });
});
