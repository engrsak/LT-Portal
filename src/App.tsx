import React, { useState, useEffect } from 'react';
import { 
  FileText, Library, Users, LogOut, Info, Shield, 
  Building2, UserCheck, AlertCircle, RefreshCw, Database, Sun, Moon, Check, X
} from 'lucide-react';
import { Session, DashboardStats } from './types';
import Login from './components/Login';
import StatsCards from './components/StatsCards';
import LettersManager from './components/LettersManager';
import SubjectsManager from './components/SubjectsManager';
import UsersManager from './components/UsersManager';

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem('lt_portal_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<'common' | 'subject_letters' | 'subjects' | 'users'>('common');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsTrigger, setStatsTrigger] = useState(0);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Toggle Dark / Light Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('lt_portal_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lt_portal_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Persistence of session
  useEffect(() => {
    if (session) {
      localStorage.setItem('lt_portal_session', JSON.stringify(session));
      // Standard user should only see subject letters tab
      if (!session.isAdmin) {
        setActiveTab('subject_letters');
      } else {
        setActiveTab('common');
      }
    } else {
      localStorage.removeItem('lt_portal_session');
    }
  }, [session]);

  const fetchStats = async () => {
    if (!session) return;
    setLoadingStats(true);
    try {
      const res = await fetch('/api/stats', {
        headers: { 'x-user-id': session.id.toString() }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [session, statsTrigger]);

  const triggerStatsReload = () => {
    setStatsTrigger(prev => prev + 1);
  };

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleBackupDownload = async () => {
    if (!session) return;
    try {
      const response = await fetch('/api/backup/csv', {
        headers: { 'x-user-id': session.id.toString() }
      });
      if (!response.ok) {
        throw new Error('Failed to download backup');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lt_portal_backup_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Backup error:', error);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <Login onLoginSuccess={setSession} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* ==================== NAVIGATION HEADER (no-print) ==================== */}
      <header className="bg-slate-900 border-b border-slate-800 shadow-md sticky top-0 z-40 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Title Branding */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-sky-600 rounded-lg flex items-center justify-center font-bold font-mono text-white text-md">
                LT
              </div>
              <div>
                <h1 className="text-md font-bold tracking-tight text-white font-display flex items-center gap-1.5 leading-none">
                  LT PORTAL
                  <span className="text-[10px] bg-slate-800 border border-slate-750 text-slate-400 rounded px-1 font-mono font-bold">V1.2</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">The File Tracking Tool • ප්‍රාදේශීය ලේකම් කාර්යාලය</p>
              </div>
            </div>

            {/* Navigation Tabs (Only Admin gets all tabs, User gets restricted view) */}
            <nav className="hidden md:flex space-x-1 h-full items-center">
              {session.isAdmin ? (
                <>
                  <button
                    onClick={() => setActiveTab('common')}
                    className={`px-4 h-full text-xs font-semibold flex items-center transition-all cursor-pointer border-b-2 ${
                      activeTab === 'common'
                        ? 'border-sky-500 text-white bg-white/5'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    පොදු ලිපි / Common Letters
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('subject_letters')}
                    className={`px-4 h-full text-xs font-semibold flex items-center transition-all cursor-pointer border-b-2 ${
                      activeTab === 'subject_letters'
                        ? 'border-sky-500 text-white bg-white/5'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    විෂය ලිපි / Subject Letters
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('subjects')}
                    className={`px-4 h-full text-xs font-semibold flex items-center transition-all cursor-pointer border-b-2 ${
                      activeTab === 'subjects'
                        ? 'border-sky-500 text-white bg-white/5'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    විෂයයන් / Subjects
                  </button>
                  
                  <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 h-full text-xs font-semibold flex items-center transition-all cursor-pointer border-b-2 ${
                      activeTab === 'users'
                        ? 'border-sky-500 text-white bg-white/5'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    පරිශීලකයන් / Users
                  </button>
                </>
              ) : (
                <div className="h-full flex items-center">
                  <span className="px-4 h-full text-xs font-semibold flex items-center border-b-2 border-sky-500 text-white bg-white/5">
                    <FileText className="h-3.5 w-3.5 text-sky-400 mr-1.5" />
                    විෂය ලිපි / My Subject Letters
                  </span>
                </div>
              )}
            </nav>

            {/* Profile & Logout Badges */}
            <div className="flex items-center gap-3">
              
              {/* User badge */}
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200 flex items-center justify-end gap-1">
                  {session.isAdmin ? <Shield className="h-3.5 w-3.5 text-sky-400" /> : <UserCheck className="h-3.5 w-3.5 text-emerald-400" />}
                  {session.username}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Scope: {session.subject_code} ({session.subject_description})
                </span>
              </div>

              {/* Theme Toggle button */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
              </button>

              {/* Backup button (Admin only) */}
              {session.isAdmin && (
                <button
                  onClick={handleBackupDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/45 border border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/60 hover:text-emerald-300 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                  title="Backup Data to CSV"
                >
                  <Database className="h-3.5 w-3.5" />
                  <span className="hidden lg:inline">Backup (.csv)</span>
                </button>
              )}

              {/* Refresh stats button */}
              <button
                onClick={triggerStatsReload}
                disabled={loadingStats}
                className="p-1.5 rounded-lg border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
                title="Refresh Statistics"
              >
                <RefreshCw className={`h-4 w-4 ${loadingStats ? 'animate-spin text-sky-400' : ''}`} />
              </button>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 px-3 py-2 bg-rose-950/30 border border-rose-900/50 text-rose-300 hover:bg-rose-900/60 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                title="Logout"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>

            </div>
          </div>
        </div>
      </header>

      {/* ==================== MOBILE MENU (no-print) ==================== */}
      <div className="md:hidden bg-slate-800 border-b border-slate-700 p-2.5 flex items-center justify-around gap-2 no-print">
        {session.isAdmin ? (
          <>
            <button
              onClick={() => setActiveTab('common')}
              className={`flex-1 text-center py-2 px-1 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'common' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Common
            </button>
            <button
              onClick={() => setActiveTab('subject_letters')}
              className={`flex-1 text-center py-2 px-1 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'subject_letters' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Subjects Ltr
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex-1 text-center py-2 px-1 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'subjects' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Categories
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 text-center py-2 px-1 text-[11px] font-bold rounded-lg transition-all ${
                activeTab === 'users' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              Users
            </button>
          </>
        ) : (
          <div className="w-full text-center py-2 px-4 bg-slate-900 text-slate-300 text-xs font-bold rounded-xl border border-slate-700">
            පවරා ඇති විෂය / Allocated Scope: <span className="font-mono font-extrabold text-sky-400">{session.subject_code}</span>
          </div>
        )}
      </div>

      {/* ==================== PORTAL BODY CONTENT ==================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Statistics cards header (no-print) */}
        <div className="no-print">
          <StatsCards stats={stats} session={session} />
        </div>

        {/* Informational banner */}
        {!session.isAdmin && (
          <div className="mb-6 bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 no-print animate-fade-in">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-blue-900">පරිශීලක දැනුම්දීම / User Information Badge</p>
              <p className="text-[11px] text-blue-700/80 mt-0.5">
                ඔබ දැනට ලොග් වී ඇත්තේ <strong>{session.subject_code} - {session.subject_description}</strong> විෂය කණ්ඩායම යටතේය. ඔබට අදාළ ලිපි ලැයිස්තුව පහත දැක්වෙන අතර, ඒවායෙහි ගොනු අංක සහ අදාළ ක්‍රියාමාර්ග ඇතුලත් කිරීමට ඔබට අවසර ඇත.
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Screen routing based on activeTab state */}
        <div className="mb-8">
          {activeTab === 'common' && session.isAdmin && (
            <LettersManager 
              session={session} 
              activeTab="common" 
              onLettersUpdated={triggerStatsReload} 
            />
          )}

          {activeTab === 'subject_letters' && (
            <LettersManager 
              session={session} 
              activeTab="subject_letters" 
              onLettersUpdated={triggerStatsReload} 
            />
          )}

          {activeTab === 'subjects' && session.isAdmin && (
            <SubjectsManager 
              session={session} 
              onSubjectsUpdated={triggerStatsReload} 
            />
          )}

          {activeTab === 'users' && session.isAdmin && (
            <UsersManager 
              session={session} 
              subjectsUpdatedTrigger={statsTrigger} 
            />
          )}
        </div>

      </main>

      {/* ==================== PAGE FOOTER (no-print) ==================== */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 mt-auto text-center text-xs text-slate-400 font-medium no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-slate-400 text-[11px]">
            <strong>LT Portal</strong> • Divisional Secretariat Registry
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            Powered by <strong className="text-slate-200">Exceat Lab</strong>
            <span className="text-slate-800 mx-1.5">|</span>
            <span>© {new Date().getFullYear()} All rights reserved. Timezone: Asia/Colombo</span>
          </div>
        </div>
      </footer>

      {/* ==================== MODAL: LOGOUT CONFIRMATION ==================== */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xl max-w-sm w-full overflow-hidden p-6 animate-fade-in text-center">
            <div className="mx-auto h-12 w-12 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mb-4">
              <LogOut className="h-6 w-6 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-md font-bold text-slate-900 dark:text-white mb-2">
              ලොග්අවුට් වීමට අවශ්‍යද?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Are you sure you want to logout of your session?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-xl cursor-pointer"
              >
                අවලංගු කරන්න / Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setSession(null);
                  setShowLogoutConfirm(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm shadow-rose-100 dark:shadow-none flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                ලොග්අවුට් වන්න / Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
