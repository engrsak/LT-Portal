import React, { useState } from 'react';
import { LogIn, ShieldAlert, FileText } from 'lucide-react';
import { Session } from '../types';

interface LoginProps {
  onLoginSuccess: (session: Session) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.message || 'Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 animate-fade-in">
        
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto h-14 w-14 bg-sky-600 rounded-xl flex items-center justify-center shadow-md shadow-sky-100">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 font-display">
            LT PORTAL
          </h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">
            The File Tracking Tool • File Tracking System
          </p>
          <span className="mt-2 inline-block bg-sky-50 text-sky-700 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-sky-100">
            Sri Lankan AG Offices
          </span>
        </div>

        {/* Login Card */}
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-slate-200 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl p-3 flex items-start gap-2.5">
                <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Username
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all text-sm"
                  placeholder="e.g. admin"
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="mt-1.5 relative rounded-md shadow-xs">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:bg-white transition-all text-sm"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-xs font-bold rounded-xl text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 transition-all shadow-sm shadow-sky-100 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Login
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Exceat Lab Branding inside login card */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
            Powered by <strong className="text-slate-600">Exceat Lab</strong>
            <div className="text-[10px] text-slate-400 mt-0.5">
              © {new Date().getFullYear()} All Rights Reserved.
            </div>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center text-xs text-slate-400">
          <p className="font-semibold text-slate-500">LT Portal Sri Lanka</p>
          <p className="text-[10px] mt-0.5 font-sans">Unicode Inputs fully supported.</p>
        </div>

      </div>
    </div>
  );
}
