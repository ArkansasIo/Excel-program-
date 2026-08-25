import * as math from 'mathjs';

export interface DataRecord {
  id: number;
  rowId: number;
  value: string; // BigInt as string
  name: string;
  type: string;
  classStr: string;
  structures: string;
  modules: string;
  functions: string;
  logic: string;
  configFiles: string;
  storageLocation: string;
}

export const DATA_TYPES = ['UInt8', 'Char', 'Byte', 'Flags', 'Array'];
export const CLASSES = ['Memory', 'Register', 'Disk', 'Cache'];
export const STRUCTURES = ['Buffer', 'Stream', 'Queue', 'Stack'];
export const MODULES = ['I/O', 'Kernel', 'Userland', 'Driver'];
export const FUNCTIONS = ['read()', 'write()', 'alloc()', 'free()'];
export const LOGIC = ['AND', 'OR', 'XOR', 'NOT'];
export const CONFIGS = ['sys.ini', 'mem.conf', 'hw.xml', 'app.json'];
export const STORAGE_LOCATIONS = ['Local', 'Remote', 'Cloud', 'Tape'];

export const getByteSize = (type: string, architecture: number): number => {
  switch (type) {
    case 'UInt8': return 1;
    case 'Char': return 1;
    case 'Byte': return 1;
    case 'Flags': return 1;
    case 'Array': return Math.ceil(architecture / 8);
    default: return Math.ceil(architecture / 8);
  }
};

export const generateInitialData = (): DataRecord[] => {
  const initialBytes = [
    10, 255, 128, 64, 32, 16, 8, 4, 2, 1,
    0, 127, 42, 69, 100, 200, 250, 170, 85, 50
  ];
  return initialBytes.map((val, i) => ({
    id: i + 1,
    rowId: i + 1,
    value: val.toString(),
    name: `System_Alloc_${i.toString().padStart(2, '0')}`,
    type: DATA_TYPES[i % DATA_TYPES.length],
    classStr: CLASSES[i % CLASSES.length],
    structures: STRUCTURES[i % STRUCTURES.length],
    modules: MODULES[i % MODULES.length],
    functions: FUNCTIONS[i % FUNCTIONS.length],
    logic: LOGIC[i % LOGIC.length],
    configFiles: CONFIGS[i % CONFIGS.length],
    storageLocation: STORAGE_LOCATIONS[i % STORAGE_LOCATIONS.length],
  }));
};

export const evaluateRecords = (records: DataRecord[], architecture: number): Record<number, string> => {
    const vals: Record<number, string> = {};
    const scope: any = {
      // Excel/Wolfram functions
      SUM: math.sum, AVERAGE: math.mean, MAX: math.max, MIN: math.min,
      SQRT: math.sqrt, ABS: math.abs, PI: math.pi, E: math.e, SIN: math.sin, COS: math.cos, TAN: math.tan,
      LOG: math.log10, LN: math.log, POW: math.pow, ROUND: math.round, CEIL: math.ceil, FLOOR: math.floor,
      // Bitwise/Asm functions
      BITAND: math.bitAnd, BITOR: math.bitOr, BITXOR: math.bitXor, BITNOT: math.bitNot, SHL: math.leftShift, SHR: math.rightArithShift
    };
    
    const maxVal = (2n ** BigInt(architecture)) - 1n;

    // Build variables
    records.forEach(r => {
      if (!r.value.startsWith('=')) {
        let v = r.value.replace(/[^0-9]/g, '');
        if (v === '') v = '0';
        vals[r.id] = v;
        scope[`R${r.id}`] = Number(v);
      }
    });

    // Evaluate formulas
    records.forEach(r => {
      if (r.value.startsWith('=')) {
        try {
          const expr = r.value.substring(1).toUpperCase(); // UpperCase for excel functions
          let res = math.evaluate(expr, scope);
          if (typeof res === 'number') {
             res = Math.floor(res);
          }
          vals[r.id] = res.toString();
          scope[`R${r.id}`] = Number(res);
        } catch (err) {
          vals[r.id] = "0"; // Default on error
        }
      }
    });
    
    // Bounds check
    Object.keys(vals).forEach(id => {
       try {
         const num = BigInt(vals[Number(id)]);
         if (num < 0n || num > maxVal) {
             vals[Number(id)] = "0"; // Revert to 0 if out of bounds
         }
       } catch {
         vals[Number(id)] = "0";
       }
    });

    return vals;
};
