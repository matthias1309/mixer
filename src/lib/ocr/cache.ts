// Persistent cache for OCR results during development
// In production, this should use Redis or a database
export interface OcrCacheEntry {
  status: string;
  userId: number;
  raw_text?: string;
  ingredients?: any[];
  error?: string;
}

export const ocrCache = new Map<string, OcrCacheEntry>();

// Clear cache after 30 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(
    () => {
      const now = Date.now();
      for (const [key, value] of ocrCache.entries()) {
        // If cache entry doesn't have timestamp, add it and skip
        if (!(value as any).timestamp) {
          (value as any).timestamp = now;
        } else if (now - (value as any).timestamp > 30 * 60 * 1000) {
          ocrCache.delete(key);
        }
      }
    },
    5 * 60 * 1000
  ).unref(); // Check every 5 minutes; unref so the timer never keeps the process alive
}
