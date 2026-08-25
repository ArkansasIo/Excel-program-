import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Settings from './pages/Settings';
import Queries from './pages/Queries';
import Reports from './pages/Reports';
import Editor from './pages/Editor';
import LoadingScreen from './components/LoadingScreen';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  const [appInitializing, setAppInitializing] = useState(true);

  if (appInitializing) {
    return <LoadingScreen onComplete={() => setAppInitializing(false)} />;
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <div className="flex flex-col h-[100dvh] w-[100dvw] overflow-hidden font-sans">
              <div className="bg-[#107c41] text-white flex items-center px-4 py-2 shadow-md z-10 border-b border-[#0c592e]">
                <h1 className="font-semibold text-base tracking-wide flex items-center">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2 shadow-sm"></span>
                  System Connection
                </h1>
              </div>
              <Login />
            </div>
          } />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="queries" element={<Queries />} />
            <Route path="editor" element={<Editor />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


