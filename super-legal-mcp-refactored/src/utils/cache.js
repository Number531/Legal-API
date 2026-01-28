/**
 * Cache Management Utilities
 * Provides in-memory caching with TTL support and automatic cleanup
 */

import { DEFAULT_CACHE_TTL } from '../config/apiConfig.js';

/**
 * Cache class for managing in-memory cache with TTL support
 */
export class Cache {
  constructor() {
    this.cache = new Map();
    this.cleanupInterval = null;
  }

  /**
   * Generates a cache key from endpoint and parameters
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Request parameters
   * @returns {string} Cache key
   */
  getCacheKey(endpoint, params) {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  /**
   * Retrieves data from cache if not expired
   * @param {string} key - Cache key
   * @returns {*} Cached data or null if not found/expired
   */
  getFromCache(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Stores data in cache with TTL
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  setCache(key, data, ttl) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || DEFAULT_CACHE_TTL
    });
  }

  /**
   * Removes expired entries from cache
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Starts automatic cache cleanup
   * @param {number} intervalMs - Cleanup interval in milliseconds (default: 60000)
   */
  startCacheCleanup(intervalMs = 60 * 1000) {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpired();
    }, intervalMs);
  }

  /**
   * Stops automatic cache cleanup
   */
  stopCacheCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Clears all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Gets cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      totalSize += JSON.stringify(entry.data).length;
      
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      approximateSizeBytes: totalSize
    };
  }

  /**
   * Removes a specific cache entry
   * @param {string} key - Cache key to remove
   * @returns {boolean} True if entry was removed
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Checks if a key exists in cache (regardless of expiration)
   * @param {string} key - Cache key to check
   * @returns {boolean} True if key exists
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Gets all cache keys
   * @returns {string[]} Array of cache keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Sets TTL for an existing cache entry
   * @param {string} key - Cache key
   * @param {number} ttl - New TTL in milliseconds
   * @returns {boolean} True if entry was updated
   */
  setTTL(key, ttl) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    entry.ttl = ttl;
    entry.timestamp = Date.now(); // Reset timestamp
    return true;
  }

  /**
   * Gets remaining TTL for a cache entry
   * @param {string} key - Cache key
   * @returns {number} Remaining TTL in milliseconds, or -1 if not found
   */
  getRemainingTTL(key) {
    const entry = this.cache.get(key);
    if (!entry) return -1;
    
    const elapsed = Date.now() - entry.timestamp;
    const remaining = entry.ttl - elapsed;
    
    return Math.max(0, remaining);
  }
}

// Create and export a default cache instance
export const defaultCache = new Cache();

// Export individual functions for backward compatibility
export function getCacheKey(endpoint, params) {
  return defaultCache.getCacheKey(endpoint, params);
}

export function getFromCache(key) {
  return defaultCache.getFromCache(key);
}

export function setCache(key, data, ttl) {
  return defaultCache.setCache(key, data, ttl);
}

export function startCacheCleanup(intervalMs) {
  return defaultCache.startCacheCleanup(intervalMs);
}

export function stopCacheCleanup() {
  return defaultCache.stopCacheCleanup();
}

export function clearCache() {
  return defaultCache.clear();
}

export function getCacheStats() {
  return defaultCache.getStats();
}