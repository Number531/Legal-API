/**
 * Unit tests for Cache utilities
 * Tests cache functionality with TTL support and automatic cleanup
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  Cache,
  defaultCache,
  getCacheKey,
  getFromCache,
  setCache,
  startCacheCleanup,
  stopCacheCleanup,
  clearCache,
  getCacheStats
} from '../../../src/utils/cache.js';

describe('Cache Utilities', () => {
  let cache;
  let mockDateNow;

  beforeEach(() => {
    cache = new Cache();
    mockDateNow = jest.spyOn(Date, 'now');
    mockDateNow.mockReturnValue(1000000); // Fixed timestamp for testing
  });

  afterEach(() => {
    cache.stopCacheCleanup();
    cache.clear();
    mockDateNow.mockRestore();
    jest.clearAllTimers();
  });

  describe('Cache Class', () => {
    describe('getCacheKey', () => {
      test('should generate consistent cache keys', () => {
        const key1 = cache.getCacheKey('/api/test', { param1: 'value1', param2: 'value2' });
        const key2 = cache.getCacheKey('/api/test', { param1: 'value1', param2: 'value2' });
        expect(key1).toBe(key2);
      });

      test('should generate different keys for different parameters', () => {
        const key1 = cache.getCacheKey('/api/test', { param1: 'value1' });
        const key2 = cache.getCacheKey('/api/test', { param1: 'value2' });
        expect(key1).not.toBe(key2);
      });

      test('should generate different keys for different endpoints', () => {
        const key1 = cache.getCacheKey('/api/test1', { param1: 'value1' });
        const key2 = cache.getCacheKey('/api/test2', { param1: 'value1' });
        expect(key1).not.toBe(key2);
      });

      test('should handle empty parameters', () => {
        const key = cache.getCacheKey('/api/test', {});
        expect(key).toBe('/api/test:{}');
      });
    });

    describe('setCache and getFromCache', () => {
      test('should store and retrieve data', () => {
        const key = 'test-key';
        const data = { message: 'test data' };
        
        cache.setCache(key, data);
        const retrieved = cache.getFromCache(key);
        
        expect(retrieved).toEqual(data);
      });

      test('should return null for non-existent keys', () => {
        const retrieved = cache.getFromCache('non-existent-key');
        expect(retrieved).toBeNull();
      });

      test('should use default TTL when not specified', () => {
        const key = 'test-key';
        const data = { message: 'test data' };
        
        cache.setCache(key, data);
        const entry = cache.cache.get(key);
        
        expect(entry.ttl).toBe(15 * 60 * 1000); // DEFAULT_CACHE_TTL
      });

      test('should use custom TTL when specified', () => {
        const key = 'test-key';
        const data = { message: 'test data' };
        const customTTL = 5000;
        
        cache.setCache(key, data, customTTL);
        const entry = cache.cache.get(key);
        
        expect(entry.ttl).toBe(customTTL);
      });

      test('should return null for expired entries', () => {
        const key = 'test-key';
        const data = { message: 'test data' };
        const ttl = 1000;
        
        cache.setCache(key, data, ttl);
        
        // Move time forward beyond TTL
        mockDateNow.mockReturnValue(1000000 + ttl + 1);
        
        const retrieved = cache.getFromCache(key);
        expect(retrieved).toBeNull();
      });

      test('should remove expired entries when accessed', () => {
        const key = 'test-key';
        const data = { message: 'test data' };
        const ttl = 1000;
        
        cache.setCache(key, data, ttl);
        expect(cache.has(key)).toBe(true);
        
        // Move time forward beyond TTL
        mockDateNow.mockReturnValue(1000000 + ttl + 1);
        
        cache.getFromCache(key);
        expect(cache.has(key)).toBe(false);
      });
    });

    describe('cleanupExpired', () => {
      test('should remove expired entries', () => {
        const key1 = 'key1';
        const key2 = 'key2';
        const data = { message: 'test' };
        const shortTTL = 1000;
        const longTTL = 10000;
        
        cache.setCache(key1, data, shortTTL);
        cache.setCache(key2, data, longTTL);
        
        expect(cache.has(key1)).toBe(true);
        expect(cache.has(key2)).toBe(true);
        
        // Move time forward to expire first entry
        mockDateNow.mockReturnValue(1000000 + shortTTL + 1);
        
        cache.cleanupExpired();
        
        expect(cache.has(key1)).toBe(false);
        expect(cache.has(key2)).toBe(true);
      });

      test('should not remove valid entries', () => {
        const key = 'test-key';
        const data = { message: 'test' };
        const ttl = 10000;
        
        cache.setCache(key, data, ttl);
        
        // Move time forward but not beyond TTL
        mockDateNow.mockReturnValue(1000000 + ttl - 1000);
        
        cache.cleanupExpired();
        
        expect(cache.has(key)).toBe(true);
      });
    });

    describe('startCacheCleanup and stopCacheCleanup', () => {
      test('should start automatic cleanup', () => {
        const mockSetInterval = jest.spyOn(global, 'setInterval');
        
        cache.startCacheCleanup(5000);
        
        expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
        expect(cache.cleanupInterval).toBeTruthy();
        
        mockSetInterval.mockRestore();
      });

      test('should stop automatic cleanup', () => {
        const mockClearInterval = jest.spyOn(global, 'clearInterval');
        
        cache.startCacheCleanup();
        const intervalId = cache.cleanupInterval;
        
        cache.stopCacheCleanup();
        
        expect(mockClearInterval).toHaveBeenCalledWith(intervalId);
        expect(cache.cleanupInterval).toBeNull();
        
        mockClearInterval.mockRestore();
      });

      test('should clear existing interval when starting new one', () => {
        const mockClearInterval = jest.spyOn(global, 'clearInterval');
        
        cache.startCacheCleanup(1000);
        const firstInterval = cache.cleanupInterval;
        
        cache.startCacheCleanup(2000);
        
        expect(mockClearInterval).toHaveBeenCalledWith(firstInterval);
        
        mockClearInterval.mockRestore();
      });

      test('should use default interval when not specified', () => {
        const mockSetInterval = jest.spyOn(global, 'setInterval');
        
        cache.startCacheCleanup();
        
        expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 60000);
        
        mockSetInterval.mockRestore();
      });
    });

    describe('clear', () => {
      test('should remove all cache entries', () => {
        cache.setCache('key1', 'data1');
        cache.setCache('key2', 'data2');
        cache.setCache('key3', 'data3');
        
        expect(cache.cache.size).toBe(3);
        
        cache.clear();
        
        expect(cache.cache.size).toBe(0);
      });
    });

    describe('getStats', () => {
      test('should return correct statistics for empty cache', () => {
        const stats = cache.getStats();
        
        expect(stats).toEqual({
          totalEntries: 0,
          validEntries: 0,
          expiredEntries: 0,
          approximateSizeBytes: 0
        });
      });

      test('should return correct statistics for cache with valid entries', () => {
        cache.setCache('key1', { data: 'test1' }, 10000);
        cache.setCache('key2', { data: 'test2' }, 10000);
        
        const stats = cache.getStats();
        
        expect(stats.totalEntries).toBe(2);
        expect(stats.validEntries).toBe(2);
        expect(stats.expiredEntries).toBe(0);
        expect(stats.approximateSizeBytes).toBeGreaterThan(0);
      });

      test('should count expired entries correctly', () => {
        cache.setCache('key1', { data: 'test1' }, 1000); // Will expire
        cache.setCache('key2', { data: 'test2' }, 10000); // Will not expire
        
        // Move time forward to expire first entry
        mockDateNow.mockReturnValue(1000000 + 1001);
        
        const stats = cache.getStats();
        
        expect(stats.totalEntries).toBe(2);
        expect(stats.validEntries).toBe(1);
        expect(stats.expiredEntries).toBe(1);
      });
    });

    describe('delete', () => {
      test('should remove specific cache entry', () => {
        cache.setCache('key1', 'data1');
        cache.setCache('key2', 'data2');
        
        const deleted = cache.delete('key1');
        
        expect(deleted).toBe(true);
        expect(cache.has('key1')).toBe(false);
        expect(cache.has('key2')).toBe(true);
      });

      test('should return false for non-existent key', () => {
        const deleted = cache.delete('non-existent');
        expect(deleted).toBe(false);
      });
    });

    describe('has', () => {
      test('should return true for existing keys', () => {
        cache.setCache('test-key', 'data');
        expect(cache.has('test-key')).toBe(true);
      });

      test('should return false for non-existent keys', () => {
        expect(cache.has('non-existent')).toBe(false);
      });

      test('should return true for expired keys (until cleanup)', () => {
        cache.setCache('test-key', 'data', 1000);
        
        // Move time forward beyond TTL
        mockDateNow.mockReturnValue(1000000 + 1001);
        
        expect(cache.has('test-key')).toBe(true); // Still exists until accessed or cleaned up
      });
    });

    describe('keys', () => {
      test('should return all cache keys', () => {
        cache.setCache('key1', 'data1');
        cache.setCache('key2', 'data2');
        cache.setCache('key3', 'data3');
        
        const keys = cache.keys();
        
        expect(keys).toHaveLength(3);
        expect(keys).toContain('key1');
        expect(keys).toContain('key2');
        expect(keys).toContain('key3');
      });

      test('should return empty array for empty cache', () => {
        const keys = cache.keys();
        expect(keys).toEqual([]);
      });
    });

    describe('setTTL', () => {
      test('should update TTL for existing entry', () => {
        const key = 'test-key';
        cache.setCache(key, 'data', 5000);
        
        const updated = cache.setTTL(key, 10000);
        
        expect(updated).toBe(true);
        
        const entry = cache.cache.get(key);
        expect(entry.ttl).toBe(10000);
      });

      test('should reset timestamp when updating TTL', () => {
        const key = 'test-key';
        cache.setCache(key, 'data', 5000);
        
        // Move time forward
        mockDateNow.mockReturnValue(1000000 + 2000);
        
        cache.setTTL(key, 10000);
        
        const entry = cache.cache.get(key);
        expect(entry.timestamp).toBe(1000000 + 2000);
      });

      test('should return false for non-existent key', () => {
        const updated = cache.setTTL('non-existent', 10000);
        expect(updated).toBe(false);
      });
    });

    describe('getRemainingTTL', () => {
      test('should return correct remaining TTL', () => {
        const key = 'test-key';
        const ttl = 10000;
        cache.setCache(key, 'data', ttl);
        
        // Move time forward by 3 seconds
        mockDateNow.mockReturnValue(1000000 + 3000);
        
        const remaining = cache.getRemainingTTL(key);
        expect(remaining).toBe(7000);
      });

      test('should return 0 for expired entries', () => {
        const key = 'test-key';
        const ttl = 5000;
        cache.setCache(key, 'data', ttl);
        
        // Move time forward beyond TTL
        mockDateNow.mockReturnValue(1000000 + ttl + 1000);
        
        const remaining = cache.getRemainingTTL(key);
        expect(remaining).toBe(0);
      });

      test('should return -1 for non-existent key', () => {
        const remaining = cache.getRemainingTTL('non-existent');
        expect(remaining).toBe(-1);
      });
    });
  });

  describe('Backward Compatibility Functions', () => {
    beforeEach(() => {
      // Clear the default cache before each test
      defaultCache.clear();
      defaultCache.stopCacheCleanup();
    });

    test('getCacheKey should work with default cache', () => {
      const key = getCacheKey('/api/test', { param: 'value' });
      expect(key).toBe('/api/test:{"param":"value"}');
    });

    test('setCache and getFromCache should work with default cache', () => {
      const key = 'test-key';
      const data = { message: 'test' };
      
      setCache(key, data);
      const retrieved = getFromCache(key);
      
      expect(retrieved).toEqual(data);
    });

    test('startCacheCleanup should work with default cache', () => {
      const mockSetInterval = jest.spyOn(global, 'setInterval');
      
      startCacheCleanup(5000);
      
      expect(mockSetInterval).toHaveBeenCalledWith(expect.any(Function), 5000);
      
      mockSetInterval.mockRestore();
    });

    test('stopCacheCleanup should work with default cache', () => {
      const mockClearInterval = jest.spyOn(global, 'clearInterval');
      
      startCacheCleanup();
      stopCacheCleanup();
      
      expect(mockClearInterval).toHaveBeenCalled();
      
      mockClearInterval.mockRestore();
    });

    test('clearCache should work with default cache', () => {
      setCache('key1', 'data1');
      setCache('key2', 'data2');
      
      expect(defaultCache.cache.size).toBe(2);
      
      clearCache();
      
      expect(defaultCache.cache.size).toBe(0);
    });

    test('getCacheStats should work with default cache', () => {
      setCache('key1', { data: 'test1' });
      setCache('key2', { data: 'test2' });
      
      const stats = getCacheStats();
      
      expect(stats.totalEntries).toBe(2);
      expect(stats.validEntries).toBe(2);
      expect(stats.expiredEntries).toBe(0);
    });
  });
});