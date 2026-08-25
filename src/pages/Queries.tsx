import React, { useState } from 'react';
import { Database, Play, Save, FolderOpen, AlertCircle } from 'lucide-react';
import Editor from 'react-simple-code-editor';
import { fastHighlight, Language } from '../utils/fastTokenizer';

export default function Queries() {
  const [queryCode, setQueryCode] = useState('SELECT * FROM sys_bytes\nWHERE value > 128');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('sql');

  const MOCK_DATA = [
    { id: 1, name: 'Core_System', value: 256, type: 'int' },
    { id: 2, name: 'UI_Renderer', value: 128, type: 'int' },
    { id: 3, name: 'Audio_Engine', value: 512, type: 'int' },
    { id: 4, name: 'Network_Stack', value: 64, type: 'int' },
  ];

  const SQL_TEMPLATES = [
    { name: 'SELECT ALL', code: 'SELECT * FROM table_name;' },
    { name: 'JOIN', code: 'SELECT * FROM table_a JOIN table_b ON table_a.id = table_b.a_id;' },
    { name: 'GROUP BY', code: 'SELECT column_name, COUNT(*) FROM table_name GROUP BY column_name;' },
  ];

  const executeQuery = () => {
    setError(null);
    try {
      // Very simple parser for demo purposes
      const query = queryCode.toLowerCase();
      if (!query.startsWith('select')) {
        throw new Error('Only SELECT queries are supported.');
      }
      
      let filtered = [...MOCK_DATA];
      if (query.includes('where value > 128')) {
        filtered = filtered.filter(d => d.value > 128);
      }
      
      setResults(filtered);
    } catch (e: any) {
      setError(e.message);
      setResults([]);
    }
  };

  const insertTemplate = (code: string) => {
    setQueryCode(code);
    setLanguage('sql');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-[#f3f2f1] border-b border-[#c8c6c4] p-3 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center">
          <Database className="w-5 h-5 mr-3 text-gray-700" />
          <h2 className="text-sm font-semibold text-gray-700">Query Editor</h2>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="ml-4 px-2 py-1 text-xs border border-gray-300 rounded"
          >
            <option value="sql">SQL</option>
            <option value="cpp">C++</option>
            <option value="csharp">C#</option>
            <option value="asm6502">Assembly</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-medium text-gray-700 transition-colors">
            <FolderOpen className="w-4 h-4 mr-1.5" /> Open
          </button>
          <button className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-medium text-gray-700 transition-colors">
            <Save className="w-4 h-4 mr-1.5" /> Save
          </button>
          <button onClick={executeQuery} className="flex items-center px-4 py-1.5 bg-[#107c41] hover:bg-[#0c592e] border border-[#107c41] text-white rounded text-xs font-medium transition-colors">
            <Play className="w-4 h-4 mr-1.5" /> Execute
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 bg-gray-50 border-r border-gray-200 p-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Templates</h3>
          <div className="space-y-1">
            {SQL_TEMPLATES.map((template) => (
              <button 
                key={template.name}
                onClick={() => insertTemplate(template.code)}
                className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:bg-gray-200 rounded transition-colors"
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col p-4 bg-gray-50 overflow-hidden">
          <div className="flex-1 border border-gray-300 rounded overflow-hidden flex flex-col shadow-sm bg-white">
            <div className="bg-gray-100 border-b border-gray-200 px-3 py-1.5 text-xs font-mono font-medium text-gray-500">
              Scratchpad.{language === 'cpp' ? 'cpp' : language === 'csharp' ? 'cs' : language === 'asm6502' ? 'asm' : 'sql'}
            </div>
            <Editor
              value={queryCode}
              onValueChange={setQueryCode}
              highlight={(code) => fastHighlight(code, language)}
              padding={16}
              className="flex-1 font-mono text-sm leading-relaxed"
              style={{
                fontFamily: '"Fira Code", "Fira Mono", monospace',
                fontSize: 14,
              }}
            />
          </div>
          
          <div className="mt-4 h-64 border border-gray-300 rounded overflow-hidden flex flex-col shadow-sm bg-white">
            <div className="bg-gray-100 border-b border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 flex justify-between">
              <span>Results</span>
              <span>{results.length} rows</span>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {error ? (
                <div className="flex items-center text-red-600 text-sm p-4">
                  <AlertCircle className="w-4 h-4 mr-2" /> {error}
                </div>
              ) : results.length > 0 ? (
                <table className="w-full text-xs text-left">
                  <thead className="text-gray-500 border-b">
                    <tr>
                      {Object.keys(results[0]).map(key => <th key={key} className="px-2 py-1">{key}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <tr key={i} className="border-b">
                        {Object.values(row).map((val: any, j) => <td key={j} className="px-2 py-1">{val}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Execute a query to see results here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

