import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { LiveHuddlePage } from './pages/LiveHuddlePage';
import { ActionsRegistryPage } from './pages/ActionsRegistryPage';
import { DepartmentSnapshotPage } from './pages/DepartmentSnapshotPage';
import { OvernightDashboardPage } from './pages/OvernightDashboardPage';
import { HuddleHistoryPage } from './pages/HuddleHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const AppShell: React.FC = () => {
  const { notification } = useApp();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#F0F4F5]">
      {/* Top NHS Header */}
      <Navbar />

      {/* Main Body: Left Sidebar + Content Area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="no-print h-full flex flex-col">
          <Sidebar />
        </div>
        <main className="flex-1 overflow-hidden relative flex flex-col">
          <Routes>
            <Route path="/" element={<LiveHuddlePage />} />
            <Route path="/actions" element={<ActionsRegistryPage />} />
            <Route path="/snapshot" element={<DepartmentSnapshotPage />} />
            <Route path="/dashboard" element={<OvernightDashboardPage />} />
            <Route path="/history" element={<HuddleHistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed bottom-12 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-2 duration-200 border bg-white select-none">
          {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          {notification.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600" />}
          {notification.type === 'info' && <Info className="w-4 h-4 text-[#005EB8]" />}
          <span className="text-slate-800">{notification.message}</span>
        </div>
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <HashRouter>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </HashRouter>
  );
};

export default App;
