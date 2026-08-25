import { evaluate } from 'mathjs';

/**
 * Robustly converts a value to a number.
 */
export const convertToNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  const num = parseFloat(String(value));
  return isNaN(num) ? 0 : num;
};

/**
 * Parses and evaluates a formula string using mathjs.
 */
export const parseFormula = (formula: string, scope: Record<string, number> = {}): number => {
  try {
    return evaluate(formula, scope);
  } catch (error) {
    console.error('Error evaluating formula:', error);
    return 0;
  }
};
