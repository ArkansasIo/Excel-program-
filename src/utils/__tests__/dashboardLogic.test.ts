import { describe, it, expect } from 'vitest';
import { generateInitialData, evaluateRecords, DataRecord } from '../dashboardLogic';

describe('dashboardLogic', () => {
    describe('generateInitialData', () => {
        it('should generate 20 records', () => {
            const records = generateInitialData();
            expect(records.length).toBe(20);
        });

        it('should have correct initial values', () => {
             const records = generateInitialData();
             expect(records[0].value).toBe('10');
             expect(records[1].value).toBe('255');
        });
    });

    describe('evaluateRecords', () => {
        it('should evaluate simple addition', () => {
             const records: DataRecord[] = [
                 { id: 1, value: "10", name: 'A', type: 'Int', classStr: 'M', structures: '', modules: '', functions: '', logic: '', configFiles: '' },
                 { id: 2, value: "20", name: 'B', type: 'Int', classStr: 'M', structures: '', modules: '', functions: '', logic: '', configFiles: '' },
                 { id: 3, value: "=SUM(R1, R2)", name: 'C', type: 'Int', classStr: 'M', structures: '', modules: '', functions: '', logic: '', configFiles: '' }
             ] as DataRecord[];
             const results = evaluateRecords(records, 16);
             expect(results[3]).toBe('30');
        });

        it('should handle formulas with math functions', () => {
            const records: DataRecord[] = [
                { id: 1, value: "16", name: 'A', type: 'Int', classStr: 'M', structures: '', modules: '', functions: '', logic: '', configFiles: '' },
                { id: 2, value: "=SQRT(R1)", name: 'C', type: 'Int', classStr: 'M', structures: '', modules: '', functions: '', logic: '', configFiles: '' }
            ] as DataRecord[];
            const results = evaluateRecords(records, 16);
            expect(results[2]).toBe('4');
        });

        it('should bound values to architecture', () => {
             const records: DataRecord[] = [
                 { id: 1, value: "300", name: 'A', type: 'Int', classStr: 'M', structures: '', modules: '', functions: '', logic: '', configFiles: '' }
             ] as DataRecord[];
             // 8-bit architecture: 2^8 - 1 = 255. 300 should be bounded to 0.
             const results = evaluateRecords(records, 8);
             expect(results[1]).toBe('0');
        });

        it('should handle formula errors by defaulting to 0', () => {
            const records: DataRecord[] = [
                { id: 1, value: "=INVALID(R2)", name: 'C', type: 'Int', classStr: 'M', structures: '', modules: '', functions: '', logic: '', configFiles: '' }
            ] as DataRecord[];
            const results = evaluateRecords(records, 16);
            expect(results[1]).toBe('0');
        });
    });
});
