import React, { useState, useMemo, useEffect } from 'react';
import * as math from 'mathjs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Database, Play, Search, Plus, Trash2, Save, Download, Info, X, Calculator, FunctionSquare } from 'lucide-react';
import { generateInitialData, evaluateRecords, DataRecord, DATA_TYPES, CLASSES, STRUCTURES, MODULES, FUNCTIONS, LOGIC, CONFIGS, STORAGE_LOCATIONS, getByteSize } from '../utils/dashboardLogic';

import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-sql';

interface Sheet {
  id: string;
  name: string;
  records: DataRecord[];
  past: DataRecord[][];
  future: DataRecord[][];
}

interface ConditionalRule {
  id: string;
  field: keyof DataRecord;
  threshold: number;
  operator: '>' | '<' | '===';
  color: string;
}

const initialSheet: Sheet = {
  id: 'sheet-1',
  name: 'Sheet1',
  records: generateInitialData(),
  past: [],
  future: []
};

export default function Dashboard() {
  const [sheets, setSheets] = useState<Sheet[]>([initialSheet]);
  const [activeSheetId, setActiveSheetId] = useState('sheet-1');
  const [query, setQuery] = useState('SELECT * FROM sys_bytes WHERE size = 8;');
  const [architecture, setArchitecture] = useState<number>(8); // 8, 16, 32, 64, 96, 128, 256, 512, 1024
  
  const activeSheet = useMemo(() => sheets.find(s => s.id === activeSheetId) || sheets[0], [sheets, activeSheetId]);
  const records = activeSheet.records;
  
  const undo = () => {
    setSheets(prev => prev.map(s => {
      if (s.id === activeSheetId && s.past.length > 0) {
        const previous = s.past[s.past.length - 1];
        const newPast = s.past.slice(0, s.past.length - 1);
        return {
          ...s,
          records: previous,
          past: newPast,
          future: [s.records, ...s.future]
        };
      }
      return s;
    }));
  };

  const redo = () => {
    setSheets(prev => prev.map(s => {
      if (s.id === activeSheetId && s.future.length > 0) {
        const next = s.future[0];
        const newFuture = s.future.slice(1);
        return {
          ...s,
          records: next,
          past: [...s.past, s.records],
          future: newFuture
        };
      }
      return s;
    }));
  };
  
  const setRecords = (newRecordsOrUpdater: DataRecord[] | ((prev: DataRecord[]) => DataRecord[])) => {
    setSheets(prev => prev.map(s => {
      if (s.id === activeSheetId) {
        
        const nextRecords = typeof newRecordsOrUpdater === 'function' ? newRecordsOrUpdater(s.records) : newRecordsOrUpdater;
        
        return { 
          ...s, 
          records: nextRecords,
          past: [...s.past, s.records],
          future: [] // Clear future on new action
        };
      }
      return s;
    }));
  };

  const addSheet = () => {
    const newId = `sheet-${Date.now()}`;
    const newSheet = {
      id: newId,
      name: `Sheet${sheets.length + 1}`,
      records: [], // empty
      past: [],
      future: []
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetId(newId);
  };

  const handleRename = (id: string, newName: string) => {
      setSheets(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
      setEditingSheetId(null);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [groupBy, setGroupBy] = useState<keyof DataRecord | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [showRowNumbers, setShowRowNumbers] = useState(true);
  const [density, setDensity] = useState<'Compact' | 'Comfortable' | 'Relaxed'>('Comfortable');
  const [selectedRowIds, setSelectedRowIds] = useState<number[]>([]);
  const [byteNotation, setByteNotation] = useState<'decimal' | 'scientific' | 'fixed'>('decimal');
  const [rules, setRules] = useState<ConditionalRule[]>([]);
  const [showRulesPanel, setShowRulesPanel] = useState(false);
  const [nextId, setNextId] = useState(21);

  const [binarySearchField, setBinarySearchField] = useState<keyof DataRecord>('id');
  const [binarySearchQuery, setBinarySearchQuery] = useState('');
  const [highlightedRowId, setHighlightedRowId] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hoveredRecord, setHoveredRecord] = useState<DataRecord | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [showDetailsPane, setShowDetailsPane] = useState(false);
  const [invalidValues, setInvalidValues] = useState<Record<number, string>>({});
  const tooltipRef = React.useRef<HTMLDivElement>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>([
    'checkbox', 'rowNumber', 'id', 'rowId', 'byteSize', 'decValue', 'hex', 'octal', 'binary', 
    'name', 'type', 'classStr', 'structures', 'modules', 'array', 'functions', 'logic', 
    'configFiles', 'storageLocation'
  ]);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLTableHeaderCellElement>, columnId: string) => {
    setDraggedColumn(columnId);
    e.dataTransfer.setData('text/plain', columnId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableHeaderCellElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLTableHeaderCellElement>, targetColumnId: string) => {
    e.preventDefault();
    if (draggedColumn === targetColumnId) return;

    const newOrder = [...columnOrder];
    const fromIndex = newOrder.indexOf(draggedColumn!);
    const toIndex = newOrder.indexOf(targetColumnId);

    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggedColumn!);
    
    setColumnOrder(newOrder);
    setDraggedColumn(null);
  };

  const getHeader = (col: string) => {
    switch (col) {
      case 'checkbox': return <th className="border border-[#c8c6c4] bg-[#f3f2f1] w-8 sticky left-0 z-20"><input type="checkbox" onChange={(e) => {
        if (e.target.checked) setSelectedRowIds(filteredData.map(r => r.id));
        else setSelectedRowIds([]);
      }} checked={filteredData.length > 0 && selectedRowIds.length === filteredData.length} /></th>;
      case 'rowNumber': return showRowNumbers ? <th className="border border-[#c8c6c4] bg-[#f3f2f1] w-10 sticky left-[32px] z-20">#</th> : null;
      case 'id': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">ID</th>;
      case 'rowId': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Row ID</th>;
      case 'byteSize': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Byte Size</th>;
      case 'decValue': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700 w-24">Dec Value</th>;
      case 'hex': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Hexadecimal</th>;
      case 'octal': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Octal</th>;
      case 'binary': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Binary</th>;
      case 'name': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Name</th>;
      case 'type': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Type</th>;
      case 'classStr': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Class</th>;
      case 'structures': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Structures</th>;
      case 'modules': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Modules</th>;
      case 'array': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Array</th>;
      case 'functions': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Functions</th>;
      case 'logic': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Logic</th>;
      case 'configFiles': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Config Files</th>;
      case 'storageLocation': return <th className="border border-[#c8c6c4] px-3 py-1.5 text-left text-xs font-semibold text-gray-700">Storage Location</th>;
      default: return null;
    }
  };

  const getHeaderDraggable = (col: string) => {
    const header = getHeader(col);
    if (!header || col === 'checkbox' || col === 'rowNumber') return header;
    
    return React.cloneElement(header as React.ReactElement, {
        draggable: true,
        onDragStart: (e: React.DragEvent<HTMLTableHeaderCellElement>) => handleDragStart(e, col),
        onDragOver: handleDragOver,
        onDrop: (e: React.DragEvent<HTMLTableHeaderCellElement>) => handleDrop(e, col),
    });
  };

  const selectedRecord = useMemo(() => records.find(r => r.id === selectedRecordId) || null, [records, selectedRecordId]);

  const evaluatedValues = useMemo(() => evaluateRecords(records, architecture), [records, architecture]);

  const typeFrequencies = useMemo(() => {
    const counts = DATA_TYPES.reduce((acc, type) => {
        acc[type] = 0;
        return acc;
    }, {} as Record<string, number>);

    records.forEach(r => {
        if (counts.hasOwnProperty(r.type)) {
            counts[r.type]++;
        }
    });

    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  }, [records]);

  const checkMatch = (row: DataRecord, term: string) => {
      if (!term.trim()) return false;
      const terms = term.toLowerCase().split(' ').filter(t => t.length > 0);
      const evalVal = evaluatedValues[row.id] || "0";
      const rowText = Object.values(row).join(' ').toLowerCase() + ' ' + 
                      BigInt(evalVal).toString(16).toLowerCase() + ' ' + 
                      BigInt(evalVal).toString(2);
      return terms.every(t => rowText.includes(t));
  };

  const filteredData = useMemo(() => {
    let filtered = records;
    if (filterType !== 'All') {
      filtered = filtered.filter(row => row.type === filterType);
    }
    
    if (!searchTerm.trim()) return filtered;
    return filtered.filter(row => checkMatch(row, searchTerm));
  }, [searchTerm, filterType, records, evaluatedValues]);

  const groupedData = useMemo(() => {
    if (!groupBy) return { 'All': filteredData };
    
    return filteredData.reduce((acc, record) => {
      const key = String(record[groupBy]) || 'Unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(record);
      return acc;
    }, {} as Record<string, DataRecord[]>);
  }, [filteredData, groupBy]);

  const [activeCellId, setActiveCellId] = useState<number | null>(null);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const formulas = ['SUM', 'AVERAGE', 'MAX', 'MIN', 'SQRT', 'ABS', 'PI', 'E', 'SIN', 'COS', 'TAN', 'LOG', 'LN', 'POW', 'ROUND', 'CEIL', 'FLOOR', 'BITAND', 'BITOR', 'BITXOR', 'BITNOT', 'SHL', 'SHR'];
  
  const recordReferences = useMemo(() => records.map(r => `R${r.id}`), [records]);
  const allSuggestions = useMemo(() => [...formulas, ...recordReferences].sort(), [formulas, recordReferences]);

  const validateFormula = (formula: string) => {
    if (!formula.startsWith('=')) return null;
    try {
      const expr = formula.substring(1).toUpperCase();
      // Temporarily replace R<number> with 0 for parse validation, 
      // otherwise it might complain
      const exprWithNumbers = expr.replace(/R\d+/g, '0');
      math.parse(exprWithNumbers);
      return null;
    } catch (e: any) {
      return e.message;
    }
  };

  const handleFormulaChange = (id: number, rawValue: string) => {
    const error = validateFormula(rawValue);
    setFormulaError(error);
    
    // Suggestion logic
    const parts = rawValue.split(/[()\,]/);
    const lastPart = parts[parts.length - 1]?.trim().toUpperCase() || '';
    
    if (lastPart.length > 0) {
      const found = allSuggestions.find(s => s.startsWith(lastPart));
      setSuggestion(found && found !== lastPart ? found : null);
    } else {
      setSuggestion(null);
    }

    updateRecord(id, 'value', rawValue);
  };

  const acceptSuggestion = (id: number, rawValue: string, suggestion: string) => {
    const parts = rawValue.split(/[()\,]/);
    const lastPart = parts.pop() || '';
    const prefix = rawValue.substring(0, rawValue.length - lastPart.length);
    
    const newValue = prefix + suggestion;
    
    updateRecord(id, 'value', newValue);
    setSuggestion(null);
  };

  const renderCell = (col: string, row: DataRecord, index: number, hexValue: string, octalValue: string, binaryValue: string, arrayValue: string, valueStyle: string, displayValue: string) => {
    switch (col) {
      case 'checkbox': return <td className="border border-[#c8c6c4] bg-[#f3f2f1] text-center sticky left-0 z-20 w-8 p-0">
          <input type="checkbox" checked={selectedRowIds.includes(row.id)} onChange={() => {
              setSelectedRowIds(prev => prev.includes(row.id) ? prev.filter(id => id !== row.id) : [...prev, row.id]);
          }}/>
      </td>;
      case 'rowNumber': return showRowNumbers ? <td className="border border-[#c8c6c4] bg-[#f3f2f1] text-center text-gray-500 font-mono text-[10px] sticky left-[32px] group-hover:bg-[#e1dfdd] transition-colors z-10 w-10 h-full p-0">
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={() => deleteRecord(row.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute" title="Delete Record"><Trash2 className="w-3.5 h-3.5" /></button>
            <span className="group-hover:opacity-0 transition-opacity">{index + 1}</span>
          </div>
      </td> : null;
      case 'id': return <td className="border border-[#c8c6c4] px-3 py-1.5 text-gray-600 text-xs">{row.id}</td>;
      case 'rowId': return <td className="border border-[#c8c6c4] px-3 py-1.5 text-gray-600 text-xs">{row.rowId}</td>;
      case 'byteSize': return <td className="border border-[#c8c6c4] px-3 py-1.5 text-gray-600 text-xs text-center">{getByteSize(row.type, architecture)}</td>;
      case 'decValue': return <td className={`border border-[#c8c6c4] p-0 text-xs relative ${valueStyle}`}>
         <input type="text" value={activeCellId === row.id ? row.value : displayValue}
          onFocus={() => { setActiveCellId(row.id); setFormulaError(validateFormula(row.value)); }}
          onBlur={() => { setActiveCellId(null); setFormulaError(null); setSuggestion(null); }}
          onChange={(e) => handleFormulaChange(row.id, e.target.value)}
          className={`w-full h-full min-h-[28px] px-3 font-mono font-medium bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-inset ${(formulaError && activeCellId === row.id) ? 'text-red-700 bg-red-50 focus:ring-red-600' : (row.value.startsWith('=') && evaluatedValues[row.id] === "0" && row.value !== "=0") ? 'text-red-700 bg-red-50 focus:ring-red-600' : 'text-blue-700 focus:ring-[#107c41]'}`}
        />
        {activeCellId === row.id && suggestion && <div className="absolute top-7 left-0 bg-white border border-gray-300 p-1 text-[10px] text-gray-800 z-50 cursor-pointer hover:bg-gray-100" onClick={() => acceptSuggestion(row.id, row.value, suggestion)}>Click to accept: {suggestion}</div>}
        {activeCellId === row.id && formulaError && <div className="absolute top-7 left-0 bg-red-100 border border-red-300 p-1 text-[10px] text-red-700 z-50 w-full">{formulaError}</div>}
      </td>;
      case 'hex': return <td className="border border-[#c8c6c4] p-0 text-xs bg-gray-50/50"><input type="text" readOnly value={hexValue} className="w-full h-full min-h-[28px] px-3 font-mono text-purple-700 bg-transparent outline-none cursor-default" /></td>;
      case 'octal': return <td className="border border-[#c8c6c4] p-0 text-xs bg-gray-50/50"><input type="text" readOnly value={octalValue} className="w-full h-full min-h-[28px] px-3 font-mono text-orange-700 bg-transparent outline-none cursor-default" /></td>;
      case 'binary': return <td className="border border-[#c8c6c4] p-0 text-xs bg-gray-50/50"><input type="text" readOnly value={binaryValue} className="w-full h-full min-h-[28px] px-3 font-mono text-teal-700 tracking-widest bg-transparent outline-none cursor-default" /></td>;
      case 'name': return <td className="border border-[#c8c6c4] p-0 text-xs"><input type="text" value={row.name} onChange={(e) => updateRecord(row.id, 'name', e.target.value)} className="w-full h-full min-h-[28px] px-3 font-medium text-gray-800 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-inset focus:ring-[#107c41]" /></td>;
      case 'type': return <td className="border border-[#c8c6c4] p-0 text-xs"><select value={row.type} onChange={(e) => updateRecord(row.id, 'type', e.target.value)} className="w-full h-full min-h-[28px] px-2 text-[#107c41] bg-transparent outline-none focus:bg-white">{DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></td>;
      case 'classStr': return <td className="border border-[#c8c6c4] p-0 text-xs text-gray-600"><select value={row.classStr} onChange={(e) => updateRecord(row.id, 'classStr', e.target.value)} className="w-full h-full min-h-[28px] px-2 bg-transparent outline-none focus:bg-white">{CLASSES.map(t => <option key={t} value={t}>{t}</option>)}</select></td>;
      case 'structures': return <td className="border border-[#c8c6c4] p-0 text-xs italic text-gray-500"><select value={row.structures} onChange={(e) => updateRecord(row.id, 'structures', e.target.value)} className="w-full h-full min-h-[28px] px-2 bg-transparent outline-none focus:bg-white">{STRUCTURES.map(t => <option key={t} value={t}>{t}</option>)}</select></td>;
      case 'modules': return <td className="border border-[#c8c6c4] p-0 text-xs font-medium text-gray-700"><select value={row.modules} onChange={(e) => updateRecord(row.id, 'modules', e.target.value)} className="w-full h-full min-h-[28px] px-2 bg-transparent outline-none focus:bg-white">{MODULES.map(t => <option key={t} value={t}>{t}</option>)}</select></td>;
      case 'array': return <td className="border border-[#c8c6c4] p-0 text-xs bg-gray-50/50"><input type="text" readOnly value={arrayValue} className="w-full h-full min-h-[28px] px-3 font-mono text-gray-500 bg-transparent outline-none cursor-default" /></td>;
      case 'functions': return <td className="border border-[#c8c6c4] p-0 text-xs font-mono text-pink-700"><select value={row.functions} onChange={(e) => updateRecord(row.id, 'functions', e.target.value)} className="w-full h-full min-h-[28px] px-2 bg-transparent outline-none focus:bg-white">{FUNCTIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></td>;
      case 'logic': return <td className="border border-[#c8c6c4] p-0 text-xs font-medium text-indigo-700"><select value={row.logic} onChange={(e) => updateRecord(row.id, 'logic', e.target.value)} className="w-full h-full min-h-[28px] px-2 bg-transparent outline-none focus:bg-white">{LOGIC.map(t => <option key={t} value={t}>{t}</option>)}</select></td>;
      case 'configFiles': return <td className="border border-[#c8c6c4] p-0 text-xs font-mono text-gray-600"><select value={row.configFiles} onChange={(e) => updateRecord(row.id, 'configFiles', e.target.value)} className="w-full h-full min-h-[28px] px-2 bg-transparent outline-none focus:bg-white">{CONFIGS.map(t => <option key={t} value={t}>{t}</option>)}</select></td>;
      case 'storageLocation': return <td className="border border-[#c8c6c4] p-0 text-xs text-gray-600"><select value={row.storageLocation} onChange={(e) => updateRecord(row.id, 'storageLocation', e.target.value)} className="w-full h-full min-h-[28px] px-2 bg-transparent outline-none focus:bg-white">{STORAGE_LOCATIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></td>;
      default: return null;
    }
  };

  const renderRow = (row: DataRecord, index: number) => {
    const rawEvalVal = evaluatedValues[row.id] || "0";
    let displayValue = rawEvalVal;
    if (activeCellId !== row.id) {
        const val = BigInt(rawEvalVal);
        if (byteNotation === 'scientific') displayValue = Number(val).toExponential(2);
        else if (byteNotation === 'fixed') displayValue = Number(val).toFixed(2);
    }
    
    const hexValue = `0x${BigInt(rawEvalVal).toString(16).toUpperCase().padStart(Math.ceil(architecture/4), '0')}`;
    const octalValue = `0o${BigInt(rawEvalVal).toString(8).padStart(Math.ceil(architecture/3), '0')}`;
    const binaryValue = BigInt(rawEvalVal).toString(2).padStart(architecture, '0');
    const arrayValue = `[${rawEvalVal}, ...]`
    
    const isMatch = checkMatch(row, searchTerm);
    
    const valueStyle = rules.some(r => r.field === 'value' && (
        (r.operator === '>' && Number(rawEvalVal) > r.threshold) ||
        (r.operator === '<' && Number(rawEvalVal) < r.threshold) ||
        (r.operator === '===' && Number(rawEvalVal) === r.threshold)
    )) ? 'bg-red-200' : '';
    
    return (
    <tr 
      key={row.id} 
      id={`record-row-${row.id}`}
      onClick={() => {
        setSelectedRecordId(row.id);
        if (!showDetailsPane) setShowDetailsPane(true);
      }}
      onMouseEnter={() => setHoveredRecord(row)}
      onMouseLeave={() => setHoveredRecord(null)}
      onMouseMove={handleMouseMove}
      className={`group transition-colors border-b border-[#e1dfdd] last:border-0 relative cursor-pointer ${
        highlightedRowId === row.id 
          ? 'bg-amber-100 outline outline-2 outline-amber-400 z-10' 
          : selectedRecordId === row.id
          ? 'bg-[#e1dfdd] outline outline-1 outline-[#107c41] z-10'
          : isMatch
          ? 'bg-yellow-100'
          : 'hover:bg-blue-50/50'
      }`}
    >
      {columnOrder.map(col => <React.Fragment key={col}>{renderCell(col, row, index, hexValue, octalValue, binaryValue, arrayValue, valueStyle, displayValue)}</React.Fragment>)}
    </tr>
    );
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltipRef.current) {
      tooltipRef.current.style.left = `${e.clientX + 15}px`;
      tooltipRef.current.style.top = `${e.clientY + 15}px`;
    }
  };

  const performBinarySearch = () => {
    if (!binarySearchQuery) return;
    
    // Sort array based on the selected field to ensure binary search works
    const sortedRecords = [...records].sort((a, b) => {
      if (a[binarySearchField] < b[binarySearchField]) return -1;
      if (a[binarySearchField] > b[binarySearchField]) return 1;
      return 0;
    });

    let left = 0;
    let right = sortedRecords.length - 1;
    let foundId = null;

    let target: string | number = binarySearchQuery;
    if (binarySearchField === 'id' || binarySearchField === 'value') {
      if (binarySearchField === 'id') {
        target = Number(target);
        if (isNaN(target)) { alert('Please enter a valid number'); return; }
      } else if (binarySearchField === 'value') {
        target = target.toString();
      }
    }

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const midValue = sortedRecords[mid][binarySearchField];

      let compareResult = 0;
      if (midValue === target) compareResult = 0;
      else if (midValue < target) compareResult = -1;
      else compareResult = 1;

      if (compareResult === 0) {
        foundId = sortedRecords[mid].id;
        break;
      } else if (compareResult < 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    if (foundId !== null) {
      setHighlightedRowId(foundId);
      // Ensure the search filter doesn't hide our result
      setSearchTerm('');
      
      setTimeout(() => {
        const rowElement = document.getElementById(`record-row-${foundId}`);
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      setTimeout(() => setHighlightedRowId(null), 3500);
    } else {
      alert(`No record found with ${binarySearchField} = ${target}`);
      setHighlightedRowId(null);
    }
  };

  const addRecord = () => {
    const newRecord: DataRecord = {
      id: nextId,
      rowId: nextId,
      value: "0",
      name: `New_Alloc_${nextId}`,
      type: DATA_TYPES[0],
      classStr: CLASSES[0],
      structures: STRUCTURES[0],
      modules: MODULES[0],
      functions: FUNCTIONS[0],
      logic: LOGIC[0],
      configFiles: CONFIGS[0],
      storageLocation: STORAGE_LOCATIONS[0]
    };
    setRecords([newRecord, ...records]);
    setNextId(nextId + 1);
    setHasUnsavedChanges(true);
  };

  const deleteRecord = (id: number) => {
    setRecords(records.filter(r => r.id !== id));
    setHasUnsavedChanges(true);
  };

  const updateRecord = (id: number, field: keyof DataRecord, newValue: string | number) => {
    setHasUnsavedChanges(true);
    setRecords(records.map(r => {
      if (r.id === id) {
        let updatedValue = newValue;
        if (field === 'value') {
           updatedValue = newValue.toString(); // e.g., "=SUM(R1, R2)"
        }
        if (field === 'type') {
          if (!DATA_TYPES.includes(newValue as string)) {
             console.error(`Invalid type: ${newValue}`);
             return r; // Do not update if invalid
          }
        }
        return { ...r, [field]: updatedValue };
      }
      return r;
    }));
  };

  const exportJSON = () => {
    const exportedData = records.map(r => ({
      ...r,
      evaluatedValue: evaluatedValues[r.id]
    }));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportedData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `${architecture}bit_database_export.json`);
    dlAnchorElem.click();
  };

  const exportCSV = () => {
    const headers = ['ID', 'Formula', 'Value', 'Hex', 'Octal', 'Binary', 'Name', 'Type', 'Class', 'Structures', 'Modules', 'Array', 'Functions', 'Logic', 'Config Files'];
    
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of filteredData) {
      const evalVal = evaluatedValues[row.id] || "0";
      const hexValue = `0x${BigInt(evalVal).toString(16).toUpperCase().padStart(Math.ceil(architecture/4), '0')}`;
      const octalValue = `0o${BigInt(evalVal).toString(8).padStart(Math.ceil(architecture/3), '0')}`;
      const binaryValue = BigInt(evalVal).toString(2).padStart(architecture, '0');
      const arrayValue = `"[${evalVal}]"`; 

      const values = [
        row.id,
        `"${row.value.replace(/"/g, '""')}"`,
        evalVal,
        hexValue,
        octalValue,
        binaryValue,
        `"${row.name.replace(/"/g, '""')}"`,
        `"${row.type.replace(/"/g, '""')}"`,
        `"${row.classStr.replace(/"/g, '""')}"`,
        `"${row.structures.replace(/"/g, '""')}"`,
        `"${row.modules.replace(/"/g, '""')}"`,
        arrayValue,
        `"${row.functions.replace(/"/g, '""')}"`,
        `"${row.logic.replace(/"/g, '""')}"`,
        `"${row.configFiles.replace(/"/g, '""')}"`
      ];
      csvRows.push(values.join(','));
    }
    
    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", url);
    dlAnchorElem.setAttribute("download", `${architecture}bit_database_export.csv`);
    document.body.appendChild(dlAnchorElem);
    dlAnchorElem.click();
    document.body.removeChild(dlAnchorElem);
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call to save data
    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
      alert('Changes saved to the system successfully.');
    }, 800);
  };

  const totalBytes = records.length * (architecture / 8);
  const totalBits = totalBytes * 8;

  return (
    <div className="flex flex-col h-full bg-white relative font-sans">
      {/* Sheets Navigation */}
      <div className="flex items-center bg-gray-200 border-b border-gray-300 px-2 pt-1 gap-1 overflow-x-auto">
        {sheets.map(s => (
           editingSheetId === s.id ? (
             <input
               key={s.id}
               value={editingName}
               onChange={(e) => setEditingName(e.target.value)}
               onBlur={() => handleRename(s.id, editingName)}
               onKeyDown={(e) => e.key === 'Enter' && handleRename(s.id, editingName)}
               className="px-3 py-1 text-xs rounded-t bg-white"
               autoFocus
             />
           ) : (
           <button 
             key={s.id}
             onClick={() => setActiveSheetId(s.id)}
             onDoubleClick={() => {
                 setEditingSheetId(s.id);
                 setEditingName(s.name);
             }}
             className={`px-3 py-1 text-xs rounded-t ${activeSheetId === s.id ? 'bg-white' : 'bg-gray-300'}`}
           >
             {s.name}
           </button>
           )
        ))}
        <button onClick={addSheet} className="px-3 py-1 text-xs bg-gray-300 rounded-t">+</button>
      </div>
      <div className="bg-gray-100 border-b border-gray-300 p-2 flex flex-col gap-2 shadow-sm z-10 shrink-0">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center w-full gap-2 xl:gap-0">
          <div className="flex items-center space-x-2 w-full xl:w-1/2">
            <Database className="w-5 h-5 text-gray-600 hidden sm:block" />
            <span className="font-mono font-bold text-gray-600 text-xs tracking-wider hidden sm:block">SQL QRY</span>
            <div className="flex-1 flex items-center bg-white border border-gray-300 rounded px-2 focus-within:ring-1 focus-within:ring-[#107c41] focus-within:border-[#107c41] overflow-hidden">
              <Editor 
                value={query}
                onValueChange={setQuery}
                highlight={code => highlight(code, languages.sql!, 'sql')}
                className="w-full py-1.5 outline-none font-mono text-xs text-blue-800 bg-transparent"
                placeholder="SELECT * FROM sys_bytes WHERE size = 8;"
              />
            </div>
            <button className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 rounded transition-colors font-medium shrink-0">
              <Play className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Execute</span>
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 overflow-x-auto w-full xl:w-auto scrollbar-hide pb-1 xl:pb-0">
            <button 
              onClick={handleSave} 
              disabled={!hasUnsavedChanges || isSaving}
              className={`flex items-center px-3 py-1.5 border rounded transition-colors text-xs font-medium shrink-0 ${
                hasUnsavedChanges 
                  ? 'bg-[#107c41] hover:bg-[#0c592e] border-[#107c41] text-white shadow-sm' 
                  : 'bg-white border-gray-300 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <div className="w-3 h-3 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-3 h-3 mr-1.5" />
              )}
              <span className="hidden sm:inline">Save Let</span>
              <span className="sm:hidden">Save</span>
            </button>
            <button
                onClick={undo}
                disabled={activeSheet.past.length === 0}
                className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded transition-colors text-xs font-medium text-gray-700 disabled:opacity-50"
            >Undo</button>
            <button
                onClick={redo}
                disabled={activeSheet.future.length === 0}
                className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded transition-colors text-xs font-medium text-gray-700 disabled:opacity-50"
            >Redo</button>
            <button 
              onClick={() => setShowDetailsPane(!showDetailsPane)} 
              disabled={!selectedRecordId}
              className={`flex items-center px-3 py-1.5 border rounded transition-colors text-xs font-medium shrink-0 ${
                !selectedRecordId 
                  ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400' 
                  : showDetailsPane 
                    ? 'bg-[#c8c6c4] border-gray-400 text-gray-800 shadow-inner' 
                    : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              <Info className="w-3 h-3 sm:mr-1" /> <span className="hidden sm:inline">{showDetailsPane ? 'Hide Details' : 'Show Details'}</span>
            </button>
            <button 
              onClick={() => setShowRulesPanel(!showRulesPanel)} 
              className={`flex items-center px-3 py-1.5 border rounded transition-colors text-xs font-medium shrink-0 ${
                showRulesPanel 
                    ? 'bg-[#c8c6c4] border-gray-400 text-gray-800 shadow-inner' 
                    : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-700'
              }`}
            >
              <Calculator className="w-3 h-3 sm:mr-1" /> <span className="hidden sm:inline">Rules</span>
            </button>
            <button onClick={addRecord} className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded transition-colors text-xs font-medium text-gray-700 shrink-0">
              <Plus className="w-3 h-3 sm:mr-1" /> <span className="hidden sm:inline">Insert Row</span>
            </button>
            {selectedRowIds.length > 0 && (
              <button onClick={() => {
                setRecords(records.filter(r => !selectedRowIds.includes(r.id)));
                setSelectedRowIds([]);
                setHasUnsavedChanges(true);
              }} className="flex items-center px-3 py-1.5 bg-red-100 hover:bg-red-200 border border-red-300 rounded transition-colors text-xs font-medium text-red-700 shrink-0">
                <Trash2 className="w-3 h-3 sm:mr-1" /> <span className="hidden sm:inline">Delete ({selectedRowIds.length})</span>
              </button>
            )}
            <button onClick={exportJSON} className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded transition-colors text-xs font-medium text-gray-700 shrink-0">
              <Download className="w-3 h-3 sm:mr-1" /> <span className="hidden sm:inline">JSON</span>
            </button>
            <button onClick={exportCSV} className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded transition-colors text-xs font-medium text-gray-700 shrink-0">
              <Download className="w-3 h-3 sm:mr-1" /> <span className="hidden sm:inline">CSV</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center flex-1 space-x-2 w-full sm:w-auto min-w-[300px]">
             <span className="font-mono italic text-gray-500 font-bold w-6 sm:w-8 text-center bg-gray-200 px-1 py-1 text-xs border border-gray-300 rounded shadow-inner disabled:opacity-50">fx</span>
             <div className="flex flex-1 items-center bg-white border border-gray-300 rounded px-2 w-full">
                <input 
                  type="text"
                  value={selectedRecord ? selectedRecord.value : ''}
                  onChange={(e) => selectedRecord && handleFormulaChange(selectedRecord.id, e.target.value)}
                  disabled={!selectedRecordId}
                  className="w-full py-1 outline-none text-xs bg-transparent font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={selectedRecord ? `Formula for Row ${selectedRecord.id}` : "Select a cell to edit formula (e.g. =SUM(R1, R2))"}
                />
             </div>
          </div>
          
          <div className="flex items-center bg-white border border-gray-300 rounded px-2 w-full sm:w-64">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-1 outline-none text-xs bg-transparent"
              placeholder="Search direct..."
            />
          </div>

          <div className="flex items-center bg-white border border-gray-300 rounded px-2 w-full sm:w-auto text-xs shrink-0">
            <span className="text-gray-400 mr-2 text-[10px] font-bold">DENSITY</span>
            <select 
              value={density} 
              onChange={(e) => setDensity(e.target.value as 'Compact' | 'Comfortable' | 'Relaxed')}
              className="bg-transparent text-xs outline-none py-1 cursor-pointer text-gray-600 shrink-0"
            >
              <option value="Compact">Compact</option>
              <option value="Comfortable">Comfortable</option>
              <option value="Relaxed">Relaxed</option>
            </select>
          </div>
          <div className="flex items-center bg-white border border-gray-300 rounded px-2 w-full sm:w-auto text-xs shrink-0">
            <span className="text-gray-400 mr-2 text-[10px] font-bold">TYPE</span>
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-transparent text-xs outline-none py-1 cursor-pointer text-gray-600 shrink-0"
            >
              <option value="All">All Types</option>
              {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="flex items-center bg-white border border-gray-300 rounded px-2 w-full sm:w-auto text-xs shrink-0">
            <span className="text-gray-400 mr-2 text-[10px] font-bold">GROUP</span>
            <select 
              value={groupBy || ''} 
              onChange={(e) => setGroupBy(e.target.value ? (e.target.value as keyof DataRecord) : null)}
              className="bg-transparent text-xs outline-none py-1 cursor-pointer text-gray-600 shrink-0"
            >
              <option value="">No Grouping</option>
              {['type', 'classStr', 'structures', 'modules', 'logic', 'functions', 'configFiles', 'storageLocation'].map(col => <option key={col} value={col}>{col}</option>)}
            </select>
          </div>

          <div className="flex items-center bg-white border border-gray-300 rounded px-2 py-1.5 w-full sm:w-auto text-xs shrink-0 gap-2">
            <input 
                type="checkbox" 
                checked={showRowNumbers} 
                onChange={() => setShowRowNumbers(!showRowNumbers)}
                className="w-3 h-3 cursor-pointer"
            />
            <span className="text-gray-600 font-semibold">Row Numbers</span>
          </div>

          <div className="flex items-center bg-white border border-gray-300 rounded px-2 w-full sm:w-auto text-xs shrink-0">
            <span className="text-gray-400 mr-2 text-[10px] font-bold">BYTE NOTATION</span>
            <select 
              value={byteNotation} 
              onChange={(e) => setByteNotation(e.target.value as 'decimal' | 'scientific' | 'fixed')}
              className="bg-transparent text-xs outline-none py-1 cursor-pointer text-gray-600 shrink-0"
            >
              <option value="decimal">Decimal</option>
              <option value="scientific">Scientific</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
          
          <div className="flex items-center bg-white border border-gray-300 rounded px-2 w-full sm:w-auto text-xs shrink-0">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <select 
              value={binarySearchField} 
              onChange={(e) => setBinarySearchField(e.target.value as keyof DataRecord)}
              className="bg-transparent text-xs outline-none py-1 border-r border-gray-300 pr-1 mr-1 sm:pr-2 sm:mr-2 cursor-pointer text-gray-600 shrink-0"
            >
              <option value="id">ID</option>
              <option value="rowId">Row ID</option>
              <option value="name">Name</option>
              <option value="value">Value</option>
            </select>
            <input 
              type="text" 
              value={binarySearchQuery}
              onChange={(e) => setBinarySearchQuery(e.target.value)}
              className="w-full sm:w-32 py-1 outline-none text-xs bg-transparent min-w-[50px]"
              placeholder="Binary..."
            />
            <button 
              onClick={performBinarySearch}
              className="ml-1 sm:ml-2 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium px-2 py-0.5 rounded transition-colors shrink-0"
            >
              Find
            </button>
          </div>
        </div>
      </div>

      {showRulesPanel && (
        <div className="bg-white border-b border-gray-300 p-4 shadow-sm z-10">
          <h3 className="font-semibold text-xs text-gray-700 mb-3">Conditional Formatting Rules</h3>
          <div className="flex gap-2 mb-3">
             <select className="border rounded p-1 text-xs" onChange={(e) => {
                const field = e.target.value as keyof DataRecord;
                // Simplified UI: Assume adding new rule with temp values, then edit
                const newRule: ConditionalRule = { id: Date.now().toString(), field, threshold: 0, operator: '>', color: 'bg-red-200' };
                setRules([...rules, newRule]);
             }}>
                 <option value="">Select Field to Format</option>
                 {Object.keys(records[0] || {}).map(f => <option key={f} value={f}>{f}</option>)}
             </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {rules.map(rule => (
                <div key={rule.id} className="flex items-center gap-2 border rounded p-1 text-xs bg-gray-50">
                    <span>{rule.field} {rule.operator} {rule.threshold}</span>
                    <button onClick={() => setRules(rules.filter(r => r.id !== rule.id))}><X className="w-3 h-3"/></button>
                </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-row bg-gray-50 relative">
        <div className="flex-1 overflow-auto relative">
          <div className="p-4 bg-white border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Record Frequency by Type</h2>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeFrequencies}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" fontSize={10} />
                  <YAxis fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#107c41" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <table className="w-full border-collapse min-w-[max-content] bg-white excel-table">
          <thead className="bg-[#f3f2f1] border-b-2 border-[#c8c6c4] sticky top-0 z-10">
            <tr>
              {columnOrder.map(col => <React.Fragment key={col}>{getHeaderDraggable(col)}</React.Fragment>)}
            </tr>
          </thead>
          <tbody className="text-gray-800">
            {groupBy ? (
              Object.entries(groupedData as Record<string, DataRecord[]>).map(([groupName, rows]) => (
                <React.Fragment key={groupName}>
                  <tr className="bg-gray-200">
                    <td colSpan={19} className="px-3 py-2 font-bold text-xs cursor-pointer" onClick={() => setExpandedGroups(prev => ({...prev, [groupName]: !prev[groupName]}))}>
                       {expandedGroups[groupName] ? '▼' : '▶'} {groupName} ({rows.length})
                    </td>
                  </tr>
                  {(expandedGroups[groupName] ?? true) && rows.map((row, index) => renderRow(row, index))}
                </React.Fragment>
              ))
            ) : (
              filteredData.map((row, index) => renderRow(row, index))
            )}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={19} className="border border-[#c8c6c4] px-4 py-12 text-center text-gray-500 bg-white">
                  <Database className="w-8 h-8 mx-auto text-gray-300 mb-3" />
                  <p className="text-base font-medium text-gray-600">No records found</p>
                  <p className="text-sm">Try adjusting your search criteria or add a new record.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>

        {/* Right Sidebar Details Pane */}
        {showDetailsPane && (
          <div className="absolute right-0 inset-y-0 w-full md:w-80 md:static bg-white border-l border-gray-300 shadow-xl z-20 flex flex-col shrink-0">
            <div className="p-3 bg-[#f3f2f1] border-b border-[#c8c6c4] flex justify-between items-center shadow-sm">
              <div className="flex items-center text-gray-700 font-semibold text-sm">
                <Info className="w-4 h-4 mr-2 text-[#107c41]" />
                System Metadata
              </div>
              <button 
                onClick={() => setShowDetailsPane(false)}
                className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                title="Close panel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-gray-50/50">
              {selectedRecord ? (
                <div className="space-y-6">
                  <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">Identification</h3>
                    <div className="grid grid-cols-[1fr_2fr] gap-y-2 text-xs">
                      <div className="text-gray-500">ID:</div><div className="font-mono text-gray-800 font-bold">{selectedRecord.id}</div>
                      <div className="text-gray-500">Name:</div><div className="text-gray-800 font-medium break-all">{selectedRecord.name}</div>
                      <div className="text-gray-500">Value:</div><div className="font-mono text-[#107c41] font-bold">{selectedRecord.value} <span className="text-gray-400 font-normal ml-1">(0x{selectedRecord.value.toString(16).toUpperCase().padStart(2, '0')})</span></div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">Classification</h3>
                    <div className="grid grid-cols-[1fr_2fr] gap-y-2 text-xs">
                      <div className="text-gray-500">Type:</div><div className="text-gray-800 font-medium">{selectedRecord.type}</div>
                      <div className="text-gray-500">Class:</div><div className="text-gray-800 font-medium">{selectedRecord.classStr}</div>
                      <div className="text-gray-500">Structures:</div><div className="text-gray-800 font-medium">{selectedRecord.structures}</div>
                      <div className="text-gray-500">Modules:</div><div className="text-gray-800 font-medium">{selectedRecord.modules}</div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-3 border border-gray-200 rounded shadow-sm">
                    <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3 pb-1 border-b border-gray-100">System Logic</h3>
                     <div className="grid grid-cols-[1fr_2fr] gap-y-2 text-xs">
                        <div className="text-gray-500">Functions:</div><div className="font-mono text-pink-700 bg-pink-50 px-1 py-0.5 rounded ml-[-4px] table">{selectedRecord.functions}</div>
                        <div className="text-gray-500">Logic Gate:</div><div className="font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded ml-[-4px] table">{selectedRecord.logic}</div>
                        <div className="text-gray-500">Config File:</div><div className="font-mono text-gray-600 bg-gray-100 px-1 py-0.5 rounded ml-[-4px] table">{selectedRecord.configFiles}</div>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Info className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm">Select a row to view its metadata</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sheets Tabs Bar */}
      <div className="bg-[#f3f2f1] border-t border-[#c8c6c4] flex items-center shadow-inner z-10 shrink-0 overflow-x-auto excel-tabs">
        <div className="flex">
          {sheets.map((sheet) => (
            <button
              key={sheet.id}
              onClick={() => setActiveSheetId(sheet.id)}
              className={`px-4 py-1.5 text-xs font-medium border-r border-[#c8c6c4] whitespace-nowrap transition-colors ${
                activeSheetId === sheet.id
                  ? 'bg-white text-[#107c41] border-b-2 border-b-[#107c41]'
                  : 'bg-[#e1dfdd] text-gray-700 hover:bg-[#d2d0ce]'
              }`}
            >
              {sheet.name}
            </button>
          ))}
          <button 
            onClick={addSheet}
            className="px-3 py-1.5 bg-[#f3f2f1] text-gray-600 hover:bg-[#e1dfdd] transition-colors border-r border-[#c8c6c4]"
            title="New Sheet"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 bg-[#f3f2f1] border-b-2 border-transparent relative"></div>
      </div>

      {/* Status Bar */}
      <div className="bg-[#107c41] text-white px-2 sm:px-4 py-1.5 text-[10px] sm:text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center z-10 shrink-0 gap-1 sm:gap-0">
        <div className="flex space-x-3 sm:space-x-6 w-full sm:w-auto">
          <span className="flex items-center">Ready</span>
          <span>Records: <strong>{filteredData.length}</strong> / {records.length}</span>
        </div>
        <div className="flex space-x-3 sm:space-x-6 w-full sm:w-auto overflow-x-auto whitespace-nowrap scrollbar-hide pb-0.5 sm:pb-0 items-center">
          <span>Capacity: <strong>{totalBytes} Bytes</strong> ({totalBits} bits)</span>
          <span className="flex items-center">Architecture: 
          <select 
            value={architecture} 
            onChange={(e) => setArchitecture(Number(e.target.value))}
            className="mx-1 sm:ml-2 bg-[#0c592e] text-white border border-[#107c41] outline-none rounded px-1 py-0.5 font-mono"
          >
            <option value={8}>8-bit</option>
            <option value={16}>16-bit</option>
            <option value={32}>32-bit</option>
            <option value={64}>64-bit</option>
            <option value={96}>96-bit</option>
            <option value={128}>128-bit</option>
            <option value={256}>256-bit</option>
            <option value={512}>512-bit</option>
            <option value={1024}>1024-bit</option>
          </select> Storage</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredRecord && (
        <div 
          ref={tooltipRef}
          className="fixed z-[100] bg-white border border-gray-300 text-gray-700 p-3 rounded shadow-lg pointer-events-none w-56"
          style={{ 
            transition: 'opacity 0.15s ease',
            opacity: hoveredRecord ? 1 : 0 
          }}
        >
          <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-2">
            <span className="font-bold text-sm truncate">{hoveredRecord.name}</span>
            <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono border border-gray-200">ID:{hoveredRecord.id}</span>
          </div>
          <div className="grid grid-cols-[80px_1fr] gap-y-1.5 text-xs">
             <span className="text-gray-500">Value:</span> 
             <span className="font-mono text-gray-800">{hoveredRecord.value} <span className="text-gray-400 text-[10px] ml-1">(0x{hoveredRecord.value.toString(16).toUpperCase().padStart(2, '0')})</span></span>
             
             <span className="text-gray-500">Type:</span> 
             <span className="text-gray-800">{hoveredRecord.type}</span>
             
             <span className="text-gray-500">Class:</span> 
             <span className="text-gray-800">{hoveredRecord.classStr}</span>
             
             <span className="text-gray-500">Module:</span> 
             <span className="text-gray-800">{hoveredRecord.modules}</span>
             
             <span className="text-gray-500">Structure:</span> 
             <span className="text-gray-800">{hoveredRecord.structures}</span>
             
             <span className="text-gray-500">Function:</span> 
             <span className="font-mono text-gray-800">{hoveredRecord.functions}</span>
             
             <span className="text-gray-500">Logic:</span> 
             <span className="font-mono text-gray-800">{hoveredRecord.logic}</span>
             
             <span className="text-gray-500">Config:</span> 
             <span className="font-mono text-gray-800">{hoveredRecord.configFiles}</span>
          </div>
        </div>
      )}
    </div>
  );
}
