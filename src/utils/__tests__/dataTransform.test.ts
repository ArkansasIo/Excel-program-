import { describe, it, expect } from 'vitest';
import { convertToNumber, parseFormula } from '../dataTransform';

describe('dataTransform utilities', () => {
  describe('convertToNumber', () => {
    it('should convert valid number strings', () => {
      expect(convertToNumber('123')).toBe(123);
      expect(convertToNumber('12.34')).toBe(12.34);
    });

    it('should handle non-numeric values by returning 0', () => {
      expect(convertToNumber('abc')).toBe(0);
      expect(convertToNumber(null)).toBe(0);
      expect(convertToNumber(undefined)).toBe(0);
    });

    it('should pass through existing numbers', () => {
      expect(convertToNumber(42)).toBe(42);
    });
  });

  describe('parseFormula', () => {
    it('should evaluate basic arithmetic', () => {
      expect(parseFormula('2 + 3')).toBe(5);
      expect(parseFormula('10 * 2')).toBe(20);
    });

    it('should use scope variables', () => {
      expect(parseFormula('a + b', { a: 1, b: 2 })).toBe(3);
    });

    it('should handle invalid formulas by returning 0', () => {
      expect(parseFormula('invalid + formula')).toBe(0);
    });
  });
});
