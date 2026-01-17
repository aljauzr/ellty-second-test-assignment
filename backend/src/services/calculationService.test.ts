import { CalculationService } from '../services/calculationService';

describe('CalculationService', () => {
  describe('calculate', () => {
    it('should add two numbers correctly', () => {
      expect(CalculationService.calculate(10, 'add', 5)).toBe(15);
      expect(CalculationService.calculate(-5, 'add', 3)).toBe(-2);
      expect(CalculationService.calculate(0, 'add', 0)).toBe(0);
    });

    it('should subtract two numbers correctly', () => {
      expect(CalculationService.calculate(10, 'subtract', 5)).toBe(5);
      expect(CalculationService.calculate(5, 'subtract', 10)).toBe(-5);
      expect(CalculationService.calculate(0, 'subtract', 0)).toBe(0);
    });

    it('should multiply two numbers correctly', () => {
      expect(CalculationService.calculate(10, 'multiply', 5)).toBe(50);
      expect(CalculationService.calculate(-5, 'multiply', 3)).toBe(-15);
      expect(CalculationService.calculate(0, 'multiply', 100)).toBe(0);
    });

    it('should divide two numbers correctly', () => {
      expect(CalculationService.calculate(10, 'divide', 2)).toBe(5);
      expect(CalculationService.calculate(7, 'divide', 2)).toBe(3.5);
      expect(CalculationService.calculate(-10, 'divide', 2)).toBe(-5);
    });

    it('should throw error for division by zero', () => {
      expect(() => CalculationService.calculate(10, 'divide', 0)).toThrow('Division by zero is not allowed');
    });

    it('should throw error for unknown operation', () => {
      expect(() => CalculationService.calculate(10, 'unknown' as any, 5)).toThrow('Unknown operation: unknown');
    });
  });
});
