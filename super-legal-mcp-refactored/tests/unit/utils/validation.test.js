/**
 * Unit tests for Validation utilities
 * Tests all validation functions with valid, invalid, and edge-case inputs
 */

import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import {
  validateDate,
  validateCourtId,
  validateLimit,
  validateRequired,
  validateEmail,
  validateYear,
  validateCIK,
  validateStateCode,
  validatePatentNumber,
  validateURL,
  sanitizeString,
  validatePagination,
  validateDateRange
} from '../../../src/utils/validation.js';

describe('Validation Utilities', () => {
  describe('validateDate', () => {
    test('should accept valid date formats', () => {
      expect(() => validateDate('2023-12-25', 'testDate')).not.toThrow();
      expect(() => validateDate('2023-01-01', 'testDate')).not.toThrow();
      expect(() => validateDate('2023-02-28', 'testDate')).not.toThrow();
    });

    test('should reject invalid date formats', () => {
      expect(() => validateDate('2023-1-1', 'testDate')).toThrow('Invalid date format');
      expect(() => validateDate('23-12-25', 'testDate')).toThrow('Invalid date format');
      expect(() => validateDate('2023/12/25', 'testDate')).toThrow('Invalid date format');
      expect(() => validateDate('invalid-date', 'testDate')).toThrow('Invalid date format');
    });

    test('should reject invalid date values', () => {
      expect(() => validateDate('2023-13-01', 'testDate')).toThrow('Invalid date value');
      expect(() => validateDate('2023-02-30', 'testDate')).toThrow('Invalid date value');
      expect(() => validateDate('2023-00-01', 'testDate')).toThrow('Invalid date value');
    });

    test('should include field name in error messages', () => {
      expect(() => validateDate('invalid', 'startDate')).toThrow('startDate');
      expect(() => validateDate('2023-13-01', 'endDate')).toThrow('endDate');
    });
  });

  describe('validateCourtId', () => {
    test('should accept valid court IDs', () => {
      expect(() => validateCourtId('ca1')).not.toThrow();
      expect(() => validateCourtId('scotus')).not.toThrow();
      expect(() => validateCourtId('nysd')).not.toThrow();
      expect(() => validateCourtId('ca9')).not.toThrow();
      expect(() => validateCourtId('dcd')).not.toThrow();
    });

    test('should reject invalid court IDs', () => {
      expect(() => validateCourtId('CA1')).toThrow('Invalid court ID format');
      expect(() => validateCourtId('ca-1')).toThrow('Invalid court ID format');
      expect(() => validateCourtId('ca_1')).toThrow('Invalid court ID format');
      expect(() => validateCourtId('ca 1')).toThrow('Invalid court ID format');
      expect(() => validateCourtId('')).toThrow('Invalid court ID format');
    });
  });

  describe('validateLimit', () => {
    test('should return valid limits unchanged', () => {
      expect(validateLimit(10)).toBe(10);
      expect(validateLimit(5)).toBe(5);
      expect(validateLimit(20)).toBe(20);
    });

    test('should enforce minimum limit of 1', () => {
      expect(validateLimit(0)).toBe(1);
      expect(validateLimit(-5)).toBe(1);
      expect(validateLimit(-100)).toBe(1);
    });

    test('should enforce maximum limit', () => {
      expect(validateLimit(25, 20)).toBe(20);
      expect(validateLimit(100, 50)).toBe(50);
      expect(validateLimit(1000, 100)).toBe(100);
    });

    test('should floor decimal values', () => {
      expect(validateLimit(10.7)).toBe(10);
      expect(validateLimit(5.2)).toBe(5);
      expect(validateLimit(19.9)).toBe(19);
    });

    test('should use default max of 20', () => {
      expect(validateLimit(25)).toBe(20);
      expect(validateLimit(100)).toBe(20);
    });
  });

  describe('validateRequired', () => {
    test('should pass when all required parameters are present', () => {
      const params = { name: 'test', id: 123, active: true };
      expect(() => validateRequired(params, ['name', 'id'])).not.toThrow();
    });

    test('should throw when required parameter is missing', () => {
      const params = { name: 'test' };
      expect(() => validateRequired(params, ['name', 'id'])).toThrow('Required parameter missing: id');
    });

    test('should throw when required parameter is null', () => {
      const params = { name: 'test', id: null };
      expect(() => validateRequired(params, ['name', 'id'])).toThrow('Required parameter missing: id');
    });

    test('should throw when required parameter is undefined', () => {
      const params = { name: 'test', id: undefined };
      expect(() => validateRequired(params, ['name', 'id'])).toThrow('Required parameter missing: id');
    });

    test('should accept falsy values that are not null/undefined', () => {
      const params = { name: '', count: 0, active: false };
      expect(() => validateRequired(params, ['name', 'count', 'active'])).not.toThrow();
    });
  });

  describe('validateEmail', () => {
    test('should accept valid email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.org')).toBe(true);
      expect(validateEmail('123@456.com')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@example')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateYear', () => {
    const currentYear = new Date().getFullYear();

    test('should accept valid years within range', () => {
      expect(() => validateYear(2023)).not.toThrow();
      expect(() => validateYear(currentYear)).not.toThrow();
      expect(() => validateYear(1950)).not.toThrow();
    });

    test('should reject years outside default range', () => {
      expect(() => validateYear(1800)).toThrow('Invalid year');
      expect(() => validateYear(currentYear + 2)).toThrow('Invalid year');
    });

    test('should accept custom year ranges', () => {
      expect(() => validateYear(1850, 1800, 1900)).not.toThrow();
      expect(() => validateYear(1750, 1800, 1900)).toThrow('Invalid year');
      expect(() => validateYear(1950, 1800, 1900)).toThrow('Invalid year');
    });

    test('should include year bounds in error message', () => {
      expect(() => validateYear(1800, 1900, 2000)).toThrow('Must be between 1900 and 2000');
    });
  });

  describe('validateCIK', () => {
    test('should accept valid 10-digit CIKs', () => {
      expect(validateCIK('0000123456')).toBe(true);
      expect(validateCIK('1234567890')).toBe(true);
      expect(validateCIK('0000000001')).toBe(true);
    });

    test('should reject invalid CIK formats', () => {
      expect(validateCIK('123456')).toBe(false); // Too short
      expect(validateCIK('12345678901')).toBe(false); // Too long
      expect(validateCIK('123456789a')).toBe(false); // Contains letter
      expect(validateCIK('123-456-789')).toBe(false); // Contains dashes
      expect(validateCIK('')).toBe(false); // Empty
    });
  });

  describe('validateStateCode', () => {
    test('should accept valid state codes', () => {
      expect(validateStateCode('CA')).toBe(true);
      expect(validateStateCode('NY')).toBe(true);
      expect(validateStateCode('TX')).toBe(true);
      expect(validateStateCode('FL')).toBe(true);
    });

    test('should reject invalid state codes', () => {
      expect(validateStateCode('ca')).toBe(false); // Lowercase
      expect(validateStateCode('CAL')).toBe(false); // Too long
      expect(validateStateCode('C')).toBe(false); // Too short
      expect(validateStateCode('C1')).toBe(false); // Contains number
      expect(validateStateCode('')).toBe(false); // Empty
    });
  });

  describe('validatePatentNumber', () => {
    test('should accept valid patent number formats', () => {
      expect(validatePatentNumber('1234567')).toBe(true);
      expect(validatePatentNumber('12345678')).toBe(true);
      expect(validatePatentNumber('US1234567')).toBe(true);
      expect(validatePatentNumber('US12345678')).toBe(true);
      expect(validatePatentNumber('1234567A')).toBe(true);
      expect(validatePatentNumber('1234567A1')).toBe(true);
    });

    test('should reject invalid patent number formats', () => {
      expect(validatePatentNumber('12345')).toBe(false); // Too short
      expect(validatePatentNumber('123456789')).toBe(false); // Too long
      expect(validatePatentNumber('ABC123456')).toBe(false); // Invalid prefix
      expect(validatePatentNumber('')).toBe(false); // Empty
    });
  });

  describe('validateURL', () => {
    test('should accept valid URLs', () => {
      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('http://example.com')).toBe(true);
      expect(validateURL('https://example.com/path')).toBe(true);
      expect(validateURL('https://example.com:8080')).toBe(true);
      expect(validateURL('ftp://example.com')).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(validateURL('not-a-url')).toBe(false);
      expect(validateURL('example.com')).toBe(false); // Missing protocol
      expect(validateURL('')).toBe(false); // Empty
      expect(validateURL('http://')).toBe(false); // Incomplete
    });
  });

  describe('sanitizeString', () => {
    test('should remove angle brackets', () => {
      expect(sanitizeString('Hello <script>alert("xss")</script> World')).toBe('Hello alert("xss") World');
      expect(sanitizeString('<div>content</div>')).toBe('content');
    });

    test('should remove javascript: protocol', () => {
      expect(sanitizeString('javascript:alert("xss")')).toBe('alert("xss")');
      expect(sanitizeString('JAVASCRIPT:alert("xss")')).toBe('alert("xss")');
    });

    test('should trim whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
      expect(sanitizeString('\n\ttest\n\t')).toBe('test');
    });

    test('should convert non-strings to strings', () => {
      expect(sanitizeString(123)).toBe('123');
      expect(sanitizeString(true)).toBe('true');
      expect(sanitizeString(null)).toBe('null');
    });

    test('should preserve legal text content', () => {
      expect(sanitizeString('Section 123(a)(1) of the Code')).toBe('Section 123(a)(1) of the Code');
      expect(sanitizeString('Case No. 2023-CV-1234')).toBe('Case No. 2023-CV-1234');
    });
  });

  describe('validatePagination', () => {
    test('should return valid pagination with defaults', () => {
      const result = validatePagination({});
      expect(result).toEqual({ page: 1, limit: 20 });
    });

    test('should validate and normalize page numbers', () => {
      expect(validatePagination({ page: 5 })).toEqual({ page: 5, limit: 20 });
      expect(validatePagination({ page: 0 })).toEqual({ page: 1, limit: 20 });
      expect(validatePagination({ page: -5 })).toEqual({ page: 1, limit: 20 });
      expect(validatePagination({ page: 5.7 })).toEqual({ page: 5, limit: 20 });
    });

    test('should validate and normalize limits', () => {
      expect(validatePagination({ limit: 50 })).toEqual({ page: 1, limit: 50 });
      expect(validatePagination({ limit: 150 }, 100)).toEqual({ page: 1, limit: 100 });
      expect(validatePagination({ limit: 0 })).toEqual({ page: 1, limit: 1 });
    });

    test('should use custom max limit', () => {
      expect(validatePagination({ limit: 200 }, 150)).toEqual({ page: 1, limit: 150 });
    });
  });

  describe('validateDateRange', () => {
    test('should accept valid date ranges', () => {
      expect(() => validateDateRange('2023-01-01', '2023-12-31')).not.toThrow();
      expect(() => validateDateRange('2023-06-15', '2023-06-15')).not.toThrow(); // Same date
    });

    test('should accept single dates', () => {
      expect(() => validateDateRange('2023-01-01', null)).not.toThrow();
      expect(() => validateDateRange(null, '2023-12-31')).not.toThrow();
    });

    test('should reject invalid date formats in range', () => {
      expect(() => validateDateRange('invalid', '2023-12-31')).toThrow('Invalid date format');
      expect(() => validateDateRange('2023-01-01', 'invalid')).toThrow('Invalid date format');
    });

    test('should reject start date after end date', () => {
      expect(() => validateDateRange('2023-12-31', '2023-01-01')).toThrow('Start date must be before or equal to end date');
      expect(() => validateDateRange('2023-06-15', '2023-06-14')).toThrow('Start date must be before or equal to end date');
    });

    test('should handle null/undefined dates gracefully', () => {
      expect(() => validateDateRange(null, null)).not.toThrow();
      expect(() => validateDateRange(undefined, undefined)).not.toThrow();
    });
  });
});