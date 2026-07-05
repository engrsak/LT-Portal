import React from 'react';
import { FileText, Inbox, Library, Users, FileCheck } from 'lucide-react';
import { DashboardStats, Session } from '../types';

interface StatsCardsProps {
  stats: DashboardStats | null;
  session: Session;
}

export default function StatsCards({ stats, session }: StatsCardsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      
      {/* Total Letters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
        <div className="p-2.5 bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 rounded-lg shrink-0">
          <FileText className="h-5.5 w-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">මුළු ලිපි ගණන</p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Total Letters</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 leading-none">{stats.totalLetters}</p>
        </div>
      </div>

      {/* Common Letters (Only for Admin) */}
      {session.isAdmin ? (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg shrink-0">
            <Inbox className="h-5.5 w-5.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">පොදු ලිපි</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Common Letters</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 leading-none">{stats.commonLetters}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md transition-all opacity-75">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 rounded-lg shrink-0">
            <Inbox className="h-5.5 w-5.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-tight">පොදු ලිපි</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Common Letters</p>
            <p className="text-[11px] font-semibold text-rose-500 mt-1 leading-tight">ප්‍රවේශය නැත / Locked</p>
          </div>
        </div>
      )}

      {/* Subject Letters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
        <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg shrink-0">
          <FileCheck className="h-5.5 w-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">විෂය ලිපි</p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Subject Letters</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 leading-none">
            {session.isAdmin ? stats.subjectLetters : stats.totalLetters}
          </p>
        </div>
      </div>

      {/* Subjects */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
          <Library className="h-5.5 w-5.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">විෂයයන්</p>
          <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Subjects</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 leading-none">{stats.subjects}</p>
        </div>
      </div>

      {/* Users (Only for Admin) */}
      {session.isAdmin ? (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
          <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg shrink-0">
            <Users className="h-5.5 w-5.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">පරිශීලකයන්</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">System Users</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5 leading-none">{stats.users}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-4 hover:shadow-md transition-all opacity-75">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-850 text-slate-400 dark:text-slate-500 rounded-lg shrink-0">
            <Users className="h-5.5 w-5.5" />
          </div>
          <div className="min-w-0 overflow-hidden">
            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">විෂය පථය</p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">Assigned Scope</p>
            <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1 truncate max-w-[130px]" title={session.subject_description}>
              {session.subject_code} - {session.subject_description}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
