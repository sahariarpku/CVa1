
import React from 'react';
import { View } from '../types';

import { auth } from '../src/lib/firebase';

interface TopNavProps {
  currentView: View;
  navigate: (view: View) => void;
  showLinks?: boolean;
}

const TopNav: React.FC<TopNavProps> = ({ currentView, navigate, showLinks = true }) => {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  return (
    <header className="flex items-center justify-between border-b border-solid border-slate-200 dark:border-[#232f48] px-6 lg:px-40 py-3 bg-white dark:bg-[#101622] sticky top-0 z-50">
      <div className="flex items-center gap-4 text-primary cursor-pointer" onClick={() => navigate(View.DISCOVER)}>
        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
          <span className="material-symbols-outlined">school</span>
        </div>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">AcademiaAI</h2>
      </div>

      {showLinks && (
        <div className="flex flex-1 justify-end gap-8">
          <div className="hidden md:flex items-center gap-8 h-full">
            <button
              className={`h-full px-2 border-b-2 transition-all text-sm font-medium ${currentView === View.CV_BUILDER ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              onClick={() => navigate(View.CV_BUILDER)}
            >
              CV Builder
            </button>
            <button
              className={`h-full px-2 border-b-2 transition-all text-sm font-medium ${currentView === View.DISCOVER ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              onClick={() => navigate(View.DISCOVER)}
            >
              Discover
            </button>
            <button
              className={`h-full px-2 border-b-2 transition-all text-sm font-medium ${currentView === View.APPLICATIONS ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              onClick={() => navigate(View.APPLICATIONS)}
            >
              Applications
            </button>
            <button
              className={`h-full px-2 border-b-2 transition-all text-sm font-medium ${currentView === View.TRACKER ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              onClick={() => navigate(View.TRACKER)}
            >
              Tracker
            </button>
            <button
              className={`h-full px-2 border-b-2 transition-all text-sm font-medium ${currentView === View.SETTINGS ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              onClick={() => navigate(View.SETTINGS)}
            >
              Settings
            </button>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-[#232f48] text-slate-600 dark:text-white hover:bg-primary/20 transition-all">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-[#232f48] text-slate-600 dark:text-white hover:bg-primary/20 transition-all"
              >
                <span className="material-symbols-outlined">account_circle</span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-[#1e293b] rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 py-2 z-50 flex flex-col">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Account</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{auth.currentUser?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate(View.SETTINGS);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      auth.signOut();
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopNav;
