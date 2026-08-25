import React from 'react';
import { Database, BarChart2, PieChart as PieChartIcon } from 'lucide-react';

export default function Reports() {
  return (
    <div className="p-6 bg-white h-full overflow-auto">
      <div className="flex items-center mb-6">
        <BarChart2 className="w-6 h-6 mr-3 text-[#107c41]" />
        <h2 className="text-xl font-bold text-gray-800">Advanced Reports</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="border border-gray-200 rounded p-5 bg-gray-50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Storage Distribution</h3>
            <PieChartIcon className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Analyze how byte storage is distributed across your structures and modules.</p>
          <button className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors">
            Generate Report
          </button>
        </div>

        <div className="border border-gray-200 rounded p-5 bg-gray-50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Query Performance Logs</h3>
            <Database className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-sm text-gray-500 mb-4">View execution times and performance metrics for recent queries.</p>
          <button className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors">
            View Analytics
          </button>
        </div>
        
        <div className="border border-gray-200 rounded p-5 bg-gray-50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Memory Integrity Check</h3>
            <Database className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-sm text-gray-500 mb-4">Scan the current 8-bit memory structures for anomalies or corruption.</p>
          <button className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-100 transition-colors">
            Start Diagnostic
          </button>
        </div>
      </div>
    </div>
  );
}
