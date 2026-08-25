import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';

export default function Settings() {
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);
  const [dataStorageAllowed, setDataStorageAllowed] = useState(false);
  const [architecture, setArchitecture] = useState(16);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setTheme(data.theme);
          setNotifications(data.notifications);
          setDataStorageAllowed(data.dataStorageAllowed);
          setArchitecture(data.architecture);
          setIsAdmin(data.isAdmin);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, notifications, dataStorageAllowed, architecture, isAdmin })
      });
      setMessage('Settings saved successfully.');
    } catch (e) {
      setMessage('Error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading settings...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto w-full">
      <div className="flex items-center mb-6 border-b border-slate-200 pb-4">
        <SettingsIcon className="w-6 h-6 mr-3 text-cyan-600" />
        <h2 className="text-xl font-bold text-slate-800">System Options & Settings</h2>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 p-3 rounded mb-6 border border-green-200 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4 border-b border-slate-100 pb-2">System Architecture</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800 text-sm">Bit Depth</p>
              <p className="text-xs text-slate-500">Configure system-wide bit depth</p>
            </div>
            <select 
              value={architecture} 
              onChange={(e) => setArchitecture(Number(e.target.value))}
              className="border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
            >
              <option value={8}>8-bit</option>
              <option value={16}>16-bit</option>
              <option value={32}>32-bit</option>
              <option value={64}>64-bit</option>
            </select>
          </div>
        </div>

        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4 border-b border-slate-100 pb-2">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800 text-sm">Display Theme</p>
              <p className="text-xs text-slate-500">Choose your system UI preference</p>
            </div>
            <select 
              value={theme} 
              onChange={(e) => setTheme(e.target.value)}
              className="border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
            >
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
              <option value="system">System Default</option>
            </select>
          </div>
        </div>

        <div className="bg-white p-5 rounded border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-700 mb-4 border-b border-slate-100 pb-2">Behavior</h3>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-slate-800 text-sm">Admin Control Access</p>
              <p className="text-xs text-slate-500">Enable privileged system functions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={isAdmin} onChange={() => setIsAdmin(!isAdmin)} />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium text-slate-800 text-sm">System Notifications</p>
              <p className="text-xs text-slate-500">Receive alerts for memory allocation events</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={notifications} onChange={() => setNotifications(!notifications)} />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800 text-sm">Persistent Data Storage</p>
              <p className="text-xs text-slate-500">Allow local caching of 8-bit database records</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={dataStorageAllowed} onChange={() => setDataStorageAllowed(!dataStorageAllowed)} />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded transition-colors text-sm shadow-sm"
          >
            {saving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Configuration</>}
          </button>
        </div>
      </div>
    </div>
  );
}
