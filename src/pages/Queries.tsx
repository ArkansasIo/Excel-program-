import React, { useState } from 'react';
import { Database, Play, Save, FolderOpen } from 'lucide-react';

export default function Queries() {
  const [queryCode, setQueryCode] = useState('SELECT *\nFROM sys_bytes\nWHERE value > 128\nORDER BY value DESC');

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-[#f3f2f1] border-b border-[#c8c6c4] p-3 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center">
          <Database className="w-5 h-5 mr-3 text-gray-700" />
          <h2 className="text-sm font-semibold text-gray-700">Query Editor</h2>
        </div>
        <div className="flex space-x-2">
          <button className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-medium text-gray-700 transition-colors">
            <FolderOpen className="w-4 h-4 mr-1.5" /> Open
          </button>
          <button className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-medium text-gray-700 transition-colors">
            <Save className="w-4 h-4 mr-1.5" /> Save
          </button>
          <button className="flex items-center px-4 py-1.5 bg-[#107c41] hover:bg-[#0c592e] border border-[#107c41] text-white rounded text-xs font-medium transition-colors">
            <Play className="w-4 h-4 mr-1.5" /> Execute
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-4 bg-gray-50">
        <div className="flex-1 border border-gray-300 rounded overflow-hidden flex flex-col shadow-sm bg-white">
          <div className="bg-gray-100 border-b border-gray-200 px-3 py-1.5 text-xs font-mono font-medium text-gray-500">
            Scratchpad.sql
          </div>
          <textarea
            value={queryCode}
            onChange={(e) => setQueryCode(e.target.value)}
            className="flex-1 p-4 outline-none font-mono text-sm text-blue-800 leading-relaxed resize-none bg-transparent"
            spellCheck="false"
          />
        </div>
        
        <div className="mt-4 h-64 border border-gray-300 rounded overflow-hidden flex flex-col shadow-sm bg-white">
          <div className="bg-gray-100 border-b border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 flex justify-between">
            <span>Results Line</span>
            <span>0 rows affected</span>
          </div>
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            Execute a query to see results here
          </div>
        </div>
      </div>
    </div>
  );
}
