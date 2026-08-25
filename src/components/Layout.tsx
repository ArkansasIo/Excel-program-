import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Database, LogOut, Settings, LayoutDashboard, FileSpreadsheet, 
  Maximize, Minimize, Home, ChevronRight, ChevronDown, Table, Server, Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dbOpen, setDbOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on location change for mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-[100dvh] w-[100dvw] overflow-hidden bg-white font-sans text-sm text-gray-800">
      {/* Mobile Sidebar Overlay */}
      {user && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Left Sidebar - phpMyAdmin Style */}
      {user && (
        <div className={`fixed md:static inset-y-0 left-0 w-64 bg-[#f8f9fa] border-r border-[#dee2e6] flex flex-col shrink-0 flex-nowrap z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="px-4 py-3 flex items-center justify-between border-b border-[#dee2e6] bg-white">
            <div className="flex items-center text-[#107c41] font-bold">
              <Database className="w-5 h-5 mr-2" />
              SQL Excel Admin
            </div>
          </div>
          
          <div className="flex items-center px-4 py-2 border-b border-[#dee2e6] bg-gray-50 flex-wrap gap-2">
            <Link to="/" title="Home" className="p-1 hover:bg-gray-200 rounded text-gray-600"><Home className="w-4 h-4" /></Link>
            <button onClick={handleLogout} title="Log out" className="p-1 hover:bg-gray-200 rounded text-gray-600"><LogOut className="w-4 h-4" /></button>
            <Link to="/settings" title="Settings" className="p-1 hover:bg-gray-200 rounded text-gray-600"><Settings className="w-4 h-4" /></Link>
            <button
              onClick={toggleFullscreen}
              className="p-1 hover:bg-gray-200 rounded text-gray-600"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-auto p-2 text-sm bg-[#f8f9fa]">
            <div className="flex flex-col space-y-1">
              <div 
                className="flex items-center space-x-1 cursor-pointer hover:underline text-blue-700 py-1"
                onClick={() => setDbOpen(!dbOpen)}
              >
                {dbOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                <Database className="w-3 h-3 text-orange-400" />
                <span>main_database</span>
              </div>
              
              {dbOpen && (
                <div className="pl-6 flex flex-col space-y-1">
                  <Link to="/" className={`flex items-center space-x-1 py-1 hover:underline ${location.pathname === '/' ? 'bg-blue-100 rounded' : ''} text-blue-700`}>
                    <Table className="w-3 h-3 text-gray-500" />
                    <span>sys_bytes</span>
                  </Link>
                  <Link to="/queries" className={`flex items-center space-x-1 py-1 hover:underline ${location.pathname === '/queries' ? 'bg-blue-100 rounded' : ''} text-blue-700`}>
                    <Table className="w-3 h-3 text-gray-500" />
                    <span>queries_log</span>
                  </Link>
                  <Link to="/editor" className={`flex items-center space-x-1 py-1 hover:underline ${location.pathname === '/editor' ? 'bg-blue-100 rounded' : ''} text-blue-700`}>
                    <Table className="w-3 h-3 text-gray-500" />
                    <span>asm_editor</span>
                  </Link>
                  <Link to="/reports" className={`flex items-center space-x-1 py-1 hover:underline ${location.pathname === '/reports' ? 'bg-blue-100 rounded' : ''} text-blue-700`}>
                    <Table className="w-3 h-3 text-gray-500" />
                    <span>system_reports</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full h-full relative">
        {/* phpMyAdmin Breadcrumb Header */}
        {user && (
           <div className="bg-[#f8f9fa] border-b border-[#dee2e6] px-4 py-2 flex items-center text-xs text-gray-600 overflow-x-auto whitespace-nowrap scrollbar-hide">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-1 mr-2 hover:bg-gray-200 rounded text-gray-700 shrink-0">
               <Menu className="w-4 h-4" />
             </button>
             <Server className="w-4 h-4 mr-2 text-gray-400 shrink-0" /> 
             <span className="shrink-0">Server: 127.0.0.1</span>
             <span className="mx-2 shrink-0">»</span>
             <Database className="w-4 h-4 mr-1 text-gray-400 shrink-0" /> 
             <span className="shrink-0">Database: <strong>main_database</strong></span>
             <span className="mx-2 shrink-0">»</span>
             <Table className="w-4 h-4 mr-1 text-gray-400 shrink-0" />
             <span className="shrink-0">Table: <strong>sys_bytes</strong></span>
           </div>
        )}

        {/* phpMyAdmin Tabs Layer */}
        {user && (
          <div className="bg-[#f8f9fa] px-3 pt-3 flex space-x-1 border-b border-[#dee2e6] text-xs overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link 
              to="/" 
              className={`flex items-center px-4 py-1.5 border border-b-0 rounded-t-md transition-colors ${location.pathname === '/' ? 'bg-white border-[#dee2e6] text-black font-bold z-10 -mb-px' : 'bg-gray-100 border-transparent text-blue-700 hover:bg-gray-200'}`}
            >
              <LayoutDashboard className="w-4 h-4 mr-1.5" /> Browse (Excel)
            </Link>
            <Link 
              to="/queries" 
              className={`flex items-center px-4 py-1.5 border border-b-0 rounded-t-md transition-colors ${location.pathname === '/queries' ? 'bg-white border-[#dee2e6] text-black font-bold z-10 -mb-px' : 'bg-gray-100 border-transparent text-blue-700 hover:bg-gray-200'}`}
            >
              <Database className="w-4 h-4 mr-1.5" /> SQL
            </Link>
            <Link 
              to="/editor" 
              className={`flex items-center px-4 py-1.5 border border-b-0 rounded-t-md transition-colors ${location.pathname === '/editor' ? 'bg-white border-[#dee2e6] text-black font-bold z-10 -mb-px' : 'bg-gray-100 border-transparent text-blue-700 hover:bg-gray-200'}`}
            >
              <Server className="w-4 h-4 mr-1.5" /> IDE (ASM)
            </Link>
            <Link 
              to="/reports" 
              className={`flex items-center px-4 py-1.5 border border-b-0 rounded-t-md transition-colors ${location.pathname === '/reports' ? 'bg-white border-[#dee2e6] text-black font-bold z-10 -mb-px' : 'bg-gray-100 border-transparent text-blue-700 hover:bg-gray-200'}`}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Reports
            </Link>
            <Link 
              to="/settings" 
              className={`flex items-center px-4 py-1.5 border border-b-0 rounded-t-md transition-colors ${location.pathname === '/settings' ? 'bg-white border-[#dee2e6] text-black font-bold z-10 -mb-px' : 'bg-gray-100 border-transparent text-blue-700 hover:bg-gray-200'}`}
            >
              <Settings className="w-4 h-4 mr-1.5" /> Operations
            </Link>
          </div>
        )}

        <div className="flex-1 overflow-hidden relative bg-white">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
