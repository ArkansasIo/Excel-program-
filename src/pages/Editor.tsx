import React, { useState } from 'react';
import { Play, Save, Code, Database, FileCode2, Command, FileSpreadsheet } from 'lucide-react';
import Dashboard from './Dashboard';

export default function Editor() {
  const [activeFile, setActiveFile] = useState('main.asm');
  const [code, setCode] = useState(`; ASM IDE for SQL Excel Database
; ... ASM code ...
; ...
`);
  const [output, setOutput] = useState('');

  const executeCode = () => {
    setOutput('Assembling... \nLinking...\nExecuting payload...\n\nHello SQL Excel\nDatabase Hook Executed: [sys_bytes ID 1 returned value: 255]\n\nProgram exited with code 0.');
  };

  const renderEditor = () => {
    if (activeFile === 'data.xlsx') {
        return <Dashboard />;
    }
    
    return (
        <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[13px] p-4 outline-none resize-none leading-relaxed"
            spellCheck="false"
        />
    );
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans">
      <div className="bg-[#f3f2f1] border-b border-[#c8c6c4] px-3 py-2 flex justify-between items-center z-10 shrink-0 shadow-sm">
        <div className="flex items-center text-[#107c41]">
          <Code className="w-5 h-5 mr-2" />
          <h2 className="text-sm font-bold">ASM / SQL / Sheet Developer IDE</h2>
        </div>
        <div className="flex space-x-2">
          {activeFile !== 'data.xlsx' && (
              <>
                <button className="flex items-center px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 rounded text-xs font-medium text-gray-700 transition-colors">
                    <Save className="w-4 h-4 mr-1.5" /> Save
                </button>
                <button 
                  onClick={executeCode}
                  className="flex items-center px-4 py-1.5 bg-[#107c41] hover:bg-[#0c592e] border border-[#107c41] text-white rounded text-xs font-medium transition-colors"
                >
                  <Play className="w-4 h-4 mr-1.5" /> Build & Run
                </button>
              </>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden bg-[#1e1e1e]">
        {/* Sidebar */}
        <div className="hidden sm:flex w-48 bg-[#252526] border-r border-[#3c3c3c] flex-col shrink-0 text-[#cccccc] text-xs">
          <div className="uppercase tracking-widest font-semibold p-3 border-b border-[#3c3c3c]">EXPLORER</div>
          <div className="p-2 space-y-1">
            <div className={`flex items-center hover:bg-[#37373d] p-1 rounded cursor-pointer ${activeFile === 'main.asm' ? 'bg-[#37373d]' : ''}`} onClick={() => setActiveFile('main.asm')}>
              <FileCode2 className="w-4 h-4 mr-2 text-blue-400" />
              main.asm
            </div>
            <div className={`flex items-center hover:bg-[#37373d] p-1 rounded cursor-pointer ${activeFile === 'queries.sql' ? 'bg-[#37373d]' : ''}`} onClick={() => setActiveFile('queries.sql')}>
              <Command className="w-4 h-4 mr-2 text-yellow-500" />
              queries.sql
            </div>
            <div className={`flex items-center hover:bg-[#37373d] p-1 rounded cursor-pointer ${activeFile === 'data.xlsx' ? 'bg-[#37373d]' : ''}`} onClick={() => setActiveFile('data.xlsx')}>
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-500" />
              data.xlsx
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex bg-[#2d2d2d] border-b border-[#1e1e1e] text-xs">
            <div className="px-4 py-2 bg-[#1e1e1e] text-blue-400 border-t border-t-blue-500 flex items-center">
               {activeFile === 'main.asm' && <FileCode2 className="w-3.5 h-3.5 mr-2" />}
               {activeFile === 'queries.sql' && <Command className="w-3.5 h-3.5 mr-2" />}
               {activeFile === 'data.xlsx' && <FileSpreadsheet className="w-3.5 h-3.5 mr-2" />}
               {activeFile}
            </div>
          </div>
          <div className="flex-1 relative flex">
             <div className="absolute inset-0 flex flex-col">
              {renderEditor()}
            </div>
          </div>

          {/* Terminal / Output */}
          {activeFile !== 'data.xlsx' && (
              <div className="h-48 bg-[#1e1e1e] border-t border-[#3c3c3c] flex flex-col shrink-0">
                <div className="flex bg-[#2d2d2d] text-xs px-4 py-1.5 text-gray-400">
                   <span className="uppercase tracking-widest font-semibold mr-6 text-white">Terminal</span>
                   <span className="uppercase tracking-widest font-semibold hover:text-white cursor-pointer">Problems</span>
                   <span className="uppercase tracking-widest font-semibold mx-6 hover:text-white cursor-pointer">Output</span>
                </div>
                <div className="flex-1 p-3 font-mono text-[11px] text-gray-300 overflow-auto whitespace-pre-wrap">
                  {output || 'No output. Click "Build & Run" to execute.'}
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
}
