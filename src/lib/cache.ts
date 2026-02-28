
export function saveToCache(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to save cache for key "${key}":`, error);
    }
  }
  
  export function getFromCache<T = any>(key: string): T | null {
    try {
      const cached = localStorage.getItem(key);
      return cached ? (JSON.parse(cached) as T) : null;
    } catch (error) {
      console.warn(`Failed to get cache for key "${key}":`, error);
      return null;
    }
  }
  