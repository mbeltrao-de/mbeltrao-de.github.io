
import React, { useState } from 'react';
import { ViewMode } from './types.ts';
import AdminView from './components/AdminView.tsx';
import CustomerView from './components/CustomerView.tsx';
import { User, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('customer');

  return (
    <div className="min-h-screen">
      {/* Environment Switcher for Development */}
      <div className="fixed top-4 right-4 z-[9999] flex p-1 bg-white/80 backdrop-blur-md rounded-full shadow-2xl border border-white/40 ring-1 ring-black/5 scale-90 md:scale-100">
        <button
          onClick={() => setViewMode('customer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
            viewMode === 'customer' 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User size={14} /> Customer View
        </button>
        <button
          onClick={() => setViewMode('admin')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 ${
            viewMode === 'admin' 
            ? 'bg-amber-600 text-white shadow-lg' 
            : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck size={14} /> Admin Panel
        </button>
      </div>

      {/* Main Content Area */}
      <main>
        {viewMode === 'customer' ? <CustomerView /> : <AdminView />}
      </main>

      {/* Subtle branding/footer for Customer view */}
      {viewMode === 'customer' && (
        <footer className="py-12 px-6 border-t border-slate-200 bg-white text-center">
          <p className="text-slate-400 text-sm font-medium">© 2024 V-Tour Estates. Premium Real Estate Visualization.</p>
        </footer>
      )}
    </div>
  );
};

export default App;
