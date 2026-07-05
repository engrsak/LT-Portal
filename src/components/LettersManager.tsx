import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Search, Plus, Edit2, Trash2, Calendar, FileDown, 
  AlertCircle, X, Check, Clock, UserCheck, Eye, Printer, AlertTriangle, ListFilter
} from 'lucide-react';
import { Letter, Subject, Session, LetterAction } from '../types';

interface LettersManagerProps {
  session: Session;
  activeTab: 'common' | 'subject_letters';
  onLettersUpdated?: () => void;
}

export default function LettersManager({ session, activeTab, onLettersUpdated }: LettersManagerProps) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [auditLetter, setAuditLetter] = useState<Letter | null>(null);

  // Add/Edit Letter Form State
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formRefNo, setFormRefNo] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [formLetterType, setFormLetterType] = useState<'Common' | 'Subject'>('Common');
  const [formPriority, setFormPriority] = useState<'සාමාන්ය' | 'හදිසි' | 'රැස්වීම්'>('සාමාන්ය');
  const [formFileNo, setFormFileNo] = useState('');

  // Searchable Dropdown for Subjects inside Letter Form
  const [subjectSearch, setSubjectSearch] = useState('');
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update Action Form State (Admin & User)
  const [actionLetter, setActionLetter] = useState<Letter | null>(null);
  const [actionFileNo, setActionFileNo] = useState('');
  const [newActionText, setNewActionText] = useState('');

  // Print Report state
  const [printDate, setPrintDate] = useState(new Date().toISOString().split('T')[0]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSubjectDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const lettersRes = await fetch('/api/letters', {
        headers: { 'x-user-id': session.id.toString() }
      });
      const subjectsRes = await fetch('/api/subjects', {
        headers: { 'x-user-id': session.id.toString() }
      });

      if (lettersRes.ok && subjectsRes.ok) {
        const lettersData = await lettersRes.json();
        const subjectsData = await subjectsRes.json();
        setLetters(lettersData);
        setSubjects(subjectsData);
      } else {
        setError('ලිපි දත්ත ලබාගැනීමට නොහැකි විය. / Failed to load letters.');
      }
    } catch (err) {
      setError('සම්බන්ධතා දෝෂයකි. / Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const openAddLetterModal = () => {
    setEditingLetter(null);
    setFormTitle('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormRefNo('');
    // Default subject to CC or first available
    const ccSub = subjects.find(s => s.subject_code === 'CC');
    setFormSubjectId(ccSub ? ccSub.id.toString() : (subjects[0]?.id.toString() || ''));
    setSubjectSearch('');
    setFormLetterType('Common');
    setFormPriority('සාමාන්ය');
    setFormFileNo('');
    setError('');
    setIsLetterModalOpen(true);
  };

  const openEditLetterModal = (letter: Letter) => {
    setEditingLetter(letter);
    setFormTitle(letter.title);
    setFormDate(letter.letter_date);
    setFormRefNo(letter.reference_no);
    setFormSubjectId(letter.subject_id.toString());
    const matchedSub = subjects.find(s => s.id === letter.subject_id);
    setSubjectSearch(matchedSub ? `${matchedSub.subject_code} - ${matchedSub.description}` : '');
    setFormLetterType(letter.letter_type);
    setFormPriority(letter.priority);
    setFormFileNo(letter.file_no);
    setError('');
    setIsLetterModalOpen(true);
  };

  const handleLetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate || !formRefNo.trim() || !formSubjectId) {
      setError('කරුණාකර සියලුම අත්‍යවශ්‍ය ක්ෂේත්‍ර පුරවන්න. / Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const url = editingLetter ? `/api/letters/${editingLetter.id}` : '/api/letters';
    const method = editingLetter ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.id.toString()
        },
        body: JSON.stringify({
          title: formTitle.trim(),
          letter_date: formDate,
          reference_no: formRefNo.trim(),
          subject_id: parseInt(formSubjectId, 10),
          letter_type: formLetterType,
          priority: formPriority,
          file_no: formFileNo.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(editingLetter ? 'ලිපිය සාර්ථකව යාවත්කාලීන කරන ලදී! / Letter updated successfully!' : 'ලිපිය සාර්ථකව ඇතුලත් කරන ලදී! / Letter added successfully!');
        setIsLetterModalOpen(false);
        fetchData();
        if (onLettersUpdated) onLettersUpdated();
      } else {
        setError(data.error || 'ලිපිය සුරැකීම අසාර්ථක විය.');
      }
    } catch (err) {
      setError('සම්බන්ධතා දෝෂයකි.');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (letter: Letter) => {
    setActionLetter(letter);
    setActionFileNo(letter.file_no || '');
    setNewActionText('');
    setError('');
    setIsActionModalOpen(true);
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionLetter) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/letters/${actionLetter.id}/actions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.id.toString()
        },
        body: JSON.stringify({
          file_no: actionFileNo.trim(),
          action_text: newActionText.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('ගොනුව සහ ක්‍රියාමාර්ග සාර්ථකව යාවත්කාලීන කරන ලදී! / Actions updated successfully!');
        setIsActionModalOpen(false);
        fetchData();
        if (onLettersUpdated) onLettersUpdated();
      } else {
        setError(data.error || 'යාවත්කාලීන කිරීම අසාර්ථක විය.');
      }
    } catch (err) {
      setError('සම්බන්ධතා දෝෂයකි.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLetter = async (id: number, refNo: string) => {
    if (!confirm(`මෙම ලිපිය (${refNo}) මකා දැමීමට අවශ්‍ය බව සහතිකද? / Are you sure you want to delete this letter?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/letters/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': session.id.toString() }
      });

      if (res.ok) {
        setSuccess('ලිපිය සාර්ථකව මකා දමන ලදී. / Letter deleted successfully.');
        fetchData();
        if (onLettersUpdated) onLettersUpdated();
      } else {
        const data = await res.json();
        setError(data.error || 'මකා දැමීම අසාර්ථක විය.');
      }
    } catch (err) {
      setError('මකා දැමීමේ දෝෂයකි.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintTrigger = () => {
    setIsPrintModalOpen(false);
    
    // Create a printable window context or standard window print
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Filter letters based on current activeTab and search text (KeyUp Filter emulation)
  const filteredLetters = letters.filter(l => {
    // 1. Tab filtering
    if (activeTab === 'common') {
      // In Common Tab (Only Admin can access), show all letters
      if (!session.isAdmin) return false;
    } else {
      // In Subject Letters Tab:
      // - If admin, only show letters where subject code is 'CC' (it belongs to admin)
      // - If regular user, only show letters where subject matches their allocated subject
      if (session.isAdmin) {
        if (l.subject_code !== 'CC') return false;
      } else {
        if (l.subject_id !== session.subject_id) return false;
      }
    }

    // 2. Search Text filtering
    const term = search.toLowerCase();
    if (!term) return true;

    const matchedSubject = `${l.subject_code || ''} ${l.subject_description || ''}`.toLowerCase();
    const priorityText = l.priority.toLowerCase();
    const letterDate = l.letter_date;
    const createdAt = l.created_at.toLowerCase();
    const actionsText = (l.actions || []).map(a => a.action_text).join(' ').toLowerCase();

    return (
      l.title.toLowerCase().includes(term) ||
      l.reference_no.toLowerCase().includes(term) ||
      l.file_no.toLowerCase().includes(term) ||
      matchedSubject.includes(term) ||
      priorityText.includes(term) ||
      letterDate.includes(term) ||
      createdAt.includes(term) ||
      actionsText.includes(term)
    );
  });

  // Calculate letters for daily report print
  const printableLettersForDate = letters.filter(l => {
    // Standardize created_at date (format YYYY-MM-DD from '2026-07-02 12:00:00')
    const createdDatePart = l.created_at.split(' ')[0];
    return createdDatePart === printDate;
  });

  // Filter subjects for the searchable dropdown
  const filteredSubjectsDropdown = subjects.filter(s => {
    const term = subjectSearch.toLowerCase();
    return (
      s.subject_code.toLowerCase().includes(term) ||
      s.description.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="ලිපි ගොනු කීඅප් සෙවුම / Filter letters on typing (Title, Ref, File, Subject, Date)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-150 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {session.isAdmin && (
            <>
              <button
                onClick={() => setIsPrintModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-all bg-white dark:bg-slate-900"
              >
                <Printer className="h-4 w-4" />
                දිනපතා වාර්තාව / Daily Report
              </button>

              {activeTab === 'common' && (
                <button
                  onClick={openAddLetterModal}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md shadow-sky-100 dark:shadow-none"
                >
                  <Plus className="h-4 w-4" />
                  ලිපියක් එක් කරන්න / Add Letter
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden no-print">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-display uppercase tracking-wider">
            <ListFilter className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            {activeTab === 'common' ? 'පොදු ලිපි ලැයිස්තුව / Common Letters Registry' : 'විෂය ලිපි ලැයිස්තුව / Subject Letters Registry'}
          </h3>
          <span className="bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono border border-sky-100 dark:border-sky-900/30">
            {filteredLetters.length} Records
          </span>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs rounded-xl p-3.5 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs rounded-xl p-3.5 flex items-start gap-2.5 animate-fade-in">
              <Check className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-500" />
              <span>{success}</span>
            </div>
          )}

          {loading && letters.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <svg className="animate-spin h-8 w-8 mx-auto text-sky-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xs mt-3">ලිපි ගොනු දත්ත ලෝඩ් වෙමින් පවතී...</p>
            </div>
          ) : filteredLetters.length === 0 ? (
            <div className="py-16 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
              <FileText className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">ලිපි කිසිවක් සොයාගත නොහැක.</p>
              <p className="text-xs text-slate-400 mt-0.5">No letters found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider bg-slate-100/85">
                    <th className="px-4 py-3.5 rounded-l-xl">යොමුව / Ref No</th>
                    <th className="px-4 py-3.5">මාතෘකාව / Title</th>
                    <th className="px-4 py-3.5">ලිපි දිනය / Date</th>
                    {activeTab === 'common' && <th className="px-4 py-3.5">විෂයය / Subject</th>}
                    {activeTab === 'subject_letters' && <th className="px-4 py-3.5">ගොනුව / File No</th>}
                    <th className="px-4 py-3.5">හදිසිභාවය / Urgency</th>
                    <th className="px-4 py-3.5">ඇතුලත් කල දිනය / Created At</th>
                    {activeTab === 'subject_letters' && <th className="px-4 py-3.5">ක්‍රියාමාර්ග / Action History</th>}
                    <th className="px-4 py-3.5 text-right rounded-r-xl">ක්‍රියාමාර්ග / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm">
                  {filteredLetters.map((l) => (
                    <tr 
                      key={l.id} 
                      onClick={() => setAuditLetter(l)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors cursor-pointer"
                      title="ලිපි විස්තර සහ විගණන වාර්තාව බැලීමට ක්ලික් කරන්න / Click to view detailed audit trail"
                    >
                      {/* Reference No */}
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-900 text-xs">
                        {l.reference_no}
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3.5 font-medium text-slate-850">
                        <div className="max-w-[220px] break-words" title={l.title}>
                          {l.title}
                        </div>
                      </td>

                      {/* Letter Date */}
                      <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap text-slate-550">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {l.letter_date}
                        </span>
                      </td>

                      {/* Subject Name (Only on Common Tab) */}
                      {activeTab === 'common' && (
                        <td className="px-4 py-3.5">
                          {l.subject_code ? (
                            <div className="flex flex-col">
                              <span className="inline-block self-start px-2 py-0.5 bg-sky-50 text-sky-700 text-xs font-bold rounded border border-sky-100 font-mono">
                                {l.subject_code}
                              </span>
                              <span className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[120px]" title={l.subject_description}>
                                {l.subject_description}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-rose-500 font-medium">Unassigned</span>
                          )}
                        </td>
                      )}

                      {/* File No (Only on Subject Letters Tab) */}
                      {activeTab === 'subject_letters' && (
                        <td className="px-4 py-3.5">
                          {l.file_no ? (
                            <span className="inline-block px-2.5 py-0.5 bg-purple-50 text-purple-700 text-xs font-bold font-mono border border-purple-100 rounded">
                              {l.file_no}
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-rose-500 italic">නැත / Not Set</span>
                          )}
                        </td>
                      )}

                      {/* Urgency */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          l.priority === 'හදිසි' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                            : l.priority === 'රැස්වීම්'
                            ? 'bg-amber-50 text-amber-700 border border-amber-100'
                            : 'bg-slate-50 text-slate-600 border border-slate-100'
                        }`}>
                          {l.priority}
                        </span>
                      </td>

                      {/* Created At (Time Audit) */}
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-450 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span>{l.created_at.split(' ')[0]}</span>
                          <span className="text-slate-400 text-[10px]">{l.created_at.split(' ')[1]}</span>
                        </div>
                      </td>

                      {/* Action history column (Only on Subject letters) */}
                      {activeTab === 'subject_letters' && (
                        <td className="px-4 py-3.5">
                          {l.actions && l.actions.length > 0 ? (
                            <div className="max-w-[200px] text-xs space-y-1.5">
                              {/* Show latest action or action timeline snippet */}
                              <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                                <p className="font-medium text-slate-800 line-clamp-2">
                                  {l.actions[l.actions.length - 1].action_text}
                                </p>
                                <span className="text-[9px] text-slate-400 font-mono">
                                  {l.actions[l.actions.length - 1].added_at}
                                </span>
                              </div>
                              {l.actions.length > 1 && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); openActionModal(l); }}
                                  className="text-[10px] text-sky-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  සියලුම ක්‍රියාමාර්ග ({l.actions.length}) බලන්න...
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">කිසිදු ක්‍රියාමාර්ගයක් නැත</span>
                          )}
                        </td>
                      )}

                      {/* Operations */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Update File & Actions (Both admin & user can update file & actions in 'subject_letters' tab) */}
                          {activeTab === 'subject_letters' ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); openActionModal(l); }}
                              className="px-2.5 py-1.5 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-200 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                              title="ගොනුව සහ ක්‍රියාමාර්ග යාවත්කාලීන කිරීම"
                            >
                              <FileDown className="h-3.5 w-3.5" />
                              යාවත්කාලීන / Update
                            </button>
                          ) : (
                            /* Only Admin can edit/delete main fields in Common tab */
                            session.isAdmin && (
                              <>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openEditLetterModal(l); }}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
                                  title="සංස්කරණය / Edit Letter"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteLetter(l.id, l.reference_no); }}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                                  title="மකා දැමීම / Delete Letter"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )
                          )}

                          {/* Audit Record details tooltip or quick view */}
                          {l.last_updated_at && (
                            <div 
                              className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                              title={`Last Audit Update (Colombo): ${l.last_updated_at}`}
                            >
                              <Clock className="h-4 w-4 text-emerald-500" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODAL: ADD / EDIT LETTER (Common) ==================== */}
      {isLetterModalOpen && session.isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider">
                {editingLetter ? 'ලිපිය සංස්කරණය / Edit Letter Registry' : 'නව ලිපියක් පද්ධතියට ඇතුලත් කිරීම / Register New Letter'}
              </h4>
              <button
                onClick={() => setIsLetterModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleLetterSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  මාතෘකාව / Title (මාතෘකාව) *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  placeholder="e.g. රාජකාරි පැවරුම් සම්බන්ධව"
                />
              </div>

              {/* Grid: Date & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    ලිපි දිනය / Letter Date (දිනය) *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    ලිපි යොමුව / Reference No (යොමුව) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRefNo}
                    onChange={(e) => setFormRefNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono"
                    placeholder="e.g. AG/EST/2026/45"
                  />
                </div>
              </div>

              {/* Searchable Dropdown for Subjects (විෂය) */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  විෂයය / Select Subject (විෂය) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="විෂය කේතය හෝ විස්තරය සොයන්න..."
                    value={subjectSearch}
                    onChange={(e) => {
                      setSubjectSearch(e.target.value);
                      setIsSubjectDropdownOpen(true);
                    }}
                    onFocus={() => setIsSubjectDropdownOpen(true)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">
                    {formSubjectId ? 'Selected ✓' : 'සොයන්න ⌕'}
                  </span>
                </div>

                {isSubjectDropdownOpen && (
                  <div className="absolute z-60 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-[200px] overflow-y-auto divide-y divide-slate-50">
                    {filteredSubjectsDropdown.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 italic text-center">කිසිදු විෂයයක් නැත</div>
                    ) : (
                      filteredSubjectsDropdown.map((sub) => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            setFormSubjectId(sub.id.toString());
                            setSubjectSearch(`${sub.subject_code} - ${sub.description}`);
                            setIsSubjectDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs transition-colors flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold font-mono text-blue-700 mr-2 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                              {sub.subject_code}
                            </span>
                            <span className="text-slate-800 font-medium">{sub.description}</span>
                          </div>
                          {formSubjectId === sub.id.toString() && (
                            <Check className="h-4 w-4 text-emerald-600" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Urgency */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  හදිසිභාවය / Urgency (හදිසි/සාමාන්ය/රැස්වීම්) *
                </label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value as 'සාමාන්ය' | 'හදිසි' | 'රැස්වීම්')}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white cursor-pointer"
                >
                  <option value="සාමාන්ය">සාමාන්‍ය / Normal</option>
                  <option value="හදිසි">හදිසි / Urgent</option>
                  <option value="රැස්වීම්">රැස්වීම් / Meeting</option>
                </select>
              </div>

              {/* File Number (Optional at setup, editable later) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  ගොනු අංකය / File Number (ගොනුව)
                </label>
                <input
                  type="text"
                  value={formFileNo}
                  onChange={(e) => setFormFileNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-mono"
                  placeholder="e.g. FILE/ADM/EST/104"
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-fade-in">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsLetterModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  අවලංගු කරන්න / Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm shadow-sky-100 flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  සුරකින්න / Save Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: UPDATE FILE & ACTION (Admin & User) ==================== */}
      {isActionModalOpen && actionLetter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider">
                ක්රියාමාර්ග සහ ගොනු අංකය / Actions & File Number Update
              </h4>
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              
              {/* Brief Letter Info Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">ලිපියෙහි විස්තරය / Letter Details</p>
                <h5 className="text-sm font-bold text-slate-800">{actionLetter.title}</h5>
                <div className="grid grid-cols-2 gap-4 pt-1 text-xs font-medium text-slate-500 font-mono">
                  <p>යොමුව / Ref: <span className="font-bold text-slate-700">{actionLetter.reference_no}</span></p>
                  <p>දිනය / Date: <span className="font-bold text-slate-700">{actionLetter.letter_date}</span></p>
                </div>
              </div>

              {/* 1. File Number Update */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  ගොනු අංකය / File Number (ගොනුව)
                </label>
                <input
                  type="text"
                  value={actionFileNo}
                  onChange={(e) => setActionFileNo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-mono"
                  placeholder="e.g. FILE/ADM/EST/104"
                />
                <p className="text-[10px] text-slate-400 mt-1">භෞතිකව ලිපිය ගොනු කර ඇති ලිපිගොනුවේ අංකය.</p>
              </div>

              {/* 2. Action History (Timeline) */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  පෙර ක්‍රියාමාර්ග / Action History Timeline (ක්රියාමාර්ග)
                </label>
                
                {actionLetter.actions && actionLetter.actions.length > 0 ? (
                  <div className="space-y-3 mt-1.5 border-l-2 border-slate-200 pl-4 py-1 max-h-[160px] overflow-y-auto">
                    {actionLetter.actions.map((act) => (
                      <div key={act.id} className="relative">
                        {/* Dot marker */}
                        <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-sky-600 ring-4 ring-white" />
                        <div className="text-xs">
                          <p className="font-semibold text-slate-800 break-words">{act.action_text}</p>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {act.added_at} (Asia/Colombo)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic mt-1 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 text-center">
                    මෙම ලිපිය සඳහා මෙතෙක් ක්‍රියාමාර්ග කිසිවක් එක් කර නැත.
                  </p>
                )}
              </div>

              {/* 3. New Action Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  නව ක්‍රියාමාර්ගයක් එක් කිරීම / Append New Action *
                </label>
                <textarea
                  value={newActionText}
                  onChange={(e) => setNewActionText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white min-h-[70px]"
                  placeholder="e.g. අදාළ විෂය නිලධාරී වෙත යොමු කෙරිණි. / Sent to the respective subject officer."
                />
              </div>

              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl p-3 flex items-start gap-2.5">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Colombo Date indicator as requested */}
              <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold justify-end">
                <Clock className="h-3 w-3 animate-pulse" />
                යාවත්කාලීන වන වේලාව (Colombo): {new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"})}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  අවලංගු කරන්න / Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm shadow-sky-100 flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  යාවත්කාලීන කරන්න / Update Actions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DAILY REPORT SELECTOR ==================== */}
      {isPrintModalOpen && session.isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h4 className="text-sm font-bold text-slate-900 font-display uppercase tracking-wider">
                දිනපතා වාර්තාව මුද්‍රණය / Print Daily Report
              </h4>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                ඇතුලත් කල දිනය (Created At) අනුව දින අවසානයේ වාර්තාව මුද්‍රණය කිරීමට දිනය තෝරන්න.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-550 uppercase tracking-wider mb-1.5">
                  දිනය තෝරන්න / Select Date *
                </label>
                <input
                  type="date"
                  value={printDate}
                  onChange={(e) => setPrintDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white font-mono cursor-pointer"
                />
              </div>

              {/* Stats Preview */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-450 font-medium">අදාළ දිනට ඇතුලත් කර ඇති ලිපි:</span>
                  <p className="text-xs text-slate-400">Letters added on this date</p>
                </div>
                <span className="text-xl font-bold font-mono text-sky-700 bg-sky-50 border border-sky-100 px-3 py-0.5 rounded-lg">
                  {printableLettersForDate.length}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  අවලංගු කරන්න / Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePrintTrigger}
                  disabled={printableLettersForDate.length === 0}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-100 disabled:border-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm shadow-sky-100 flex items-center gap-1.5"
                >
                  <Printer className="h-3.5 w-3.5" />
                  මුද්‍රණ පෙරදසුන / Open Print Layout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRINTABLE SCREEN MARKUP (Hidden on screen, visible only when printing) ==================== */}
      <div className="hidden print:block print-only p-8 bg-white min-h-screen text-black">
        <div className="border-b-2 border-black pb-4 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LT PORTAL - FILE TRACKING REPORT</h1>
            <p className="text-sm font-semibold text-slate-650">ශ්‍රී ලංකා ප්‍රාදේශීය ලේකම් කාර්යාලය / Divisional Secretariat Registry</p>
            <p className="text-xs mt-1">දිනපතා ලිපි ලේඛන වාර්තාව / Daily Letters Registry Report</p>
          </div>
          <div className="text-right font-mono text-xs">
            <p><strong>Report Date:</strong> {printDate}</p>
            <p><strong>Printed At (Colombo):</strong> {new Date().toLocaleString("en-US", {timeZone: "Asia/Colombo"})}</p>
          </div>
        </div>

        <div className="mb-4 text-xs font-semibold bg-slate-100 p-3.5 rounded border border-slate-300 flex justify-between">
          <span>මුද්‍රණය කරන ලද්දේ: {session.username}</span>
          <span>මුළු ලිපි සංඛ්‍යාව: {printableLettersForDate.length}</span>
        </div>

        {printableLettersForDate.length === 0 ? (
          <p className="text-center italic py-12 text-slate-500 border border-dashed rounded">
            මෙම දිනය සඳහා කිසිදු ලිපියක් පද්ධතියට ඇතුලත් කර නොමැත. / No letters were added on this date.
          </p>
        ) : (
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">යොමුව / Ref No</th>
                <th className="p-2 border-r border-slate-300">මාතෘකාව / Title</th>
                <th className="p-2 border-r border-slate-300">ලිපි දිනය / Date</th>
                <th className="p-2 border-r border-slate-300">විෂයය / Subject</th>
                <th className="p-2 border-r border-slate-300">හදිසිභාවය / Urgency</th>
                <th className="p-2">ඇතුලත් කල දිනය / Created At</th>
              </tr>
            </thead>
            <tbody>
              {printableLettersForDate.map((l) => (
                <tr key={l.id} className="border-b border-slate-300">
                  <td className="p-2 border-r border-slate-300 font-bold font-mono">{l.reference_no}</td>
                  <td className="p-2 border-r border-slate-300 font-medium">{l.title}</td>
                  <td className="p-2 border-r border-slate-300 font-mono">{l.letter_date}</td>
                  <td className="p-2 border-r border-slate-300 font-mono">{l.subject_code} - {l.subject_description}</td>
                  <td className="p-2 border-r border-slate-300">{l.priority}</td>
                  <td className="p-2 font-mono">{l.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-16 grid grid-cols-2 text-center text-xs">
          <div>
            <div className="w-48 border-b border-black mx-auto mb-1 h-8" />
            <p className="font-semibold">සකස් කළේ / Prepared By</p>
          </div>
          <div>
            <div className="w-48 border-b border-black mx-auto mb-1 h-8" />
            <p className="font-semibold">තහවුරු කළේ / Verified By</p>
          </div>
        </div>

        <div className="mt-16 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
          <p>Powered by Exceat Lab © {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* ==================== MODAL: DETAILED AUDIT TRAIL / TIMELINE (Row Click) ==================== */}
      {auditLetter && (
        <div 
          onClick={() => setAuditLetter(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden animate-fade-in"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-sky-500" />
                ලිපි විගණන වාර්තාව / Detailed Letter Audit Trail
              </h4>
              <button
                onClick={() => setAuditLetter(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-left">
              {/* Basic Meta Cards */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-850 rounded-xl space-y-2">
                <h5 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{auditLetter.title}</h5>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 text-xs font-semibold text-slate-550 dark:text-slate-450 font-mono">
                  <p>යොමුව / Ref No: <span className="text-slate-850 dark:text-slate-200">{auditLetter.reference_no}</span></p>
                  <p>ලිපි දිනය / Date: <span className="text-slate-850 dark:text-slate-200">{auditLetter.letter_date}</span></p>
                  <p>ගොනු අංකය / File No: <span className="text-slate-850 dark:text-slate-200">{auditLetter.file_no || 'නැත (Not set)'}</span></p>
                  <p>පවරා ඇති විෂය / Subject: <span className="text-slate-850 dark:text-slate-200 bg-sky-50 dark:bg-sky-950 px-1 py-0.5 rounded">{auditLetter.subject_code}</span></p>
                </div>
              </div>

              {/* Status Summary & Timestamps */}
              <div className="space-y-3.5">
                <h6 className="text-xs font-bold text-slate-400 uppercase tracking-wider">විගණන සටහන / System Audit Logs</h6>
                
                <div className="space-y-2.5 text-xs">
                  {/* Created Log */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-150 dark:border-slate-800/60 rounded-xl">
                    <span className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center font-bold text-[10px] text-emerald-700 dark:text-emerald-400 shrink-0">1</span>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-850 dark:text-slate-200">ලිපිය ලියාපදිංචි කිරීම / Letter Registered in System</p>
                      <p className="text-slate-450 dark:text-slate-500 font-mono text-[10.5px]">
                        වේලාව / Timestamp: {auditLetter.created_at} (Asia/Colombo)
                      </p>
                      <p className="text-[10.5px] text-slate-500 dark:text-slate-450">සැකසූ පරිශීලකයා: <span className="font-bold">Admin</span></p>
                    </div>
                  </div>

                  {/* Actions logs list */}
                  {auditLetter.actions && auditLetter.actions.length > 0 ? (
                    auditLetter.actions.map((act, idx) => (
                      <div key={act.id} className="flex items-start gap-3 p-3 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100/50 dark:border-sky-900/40 rounded-xl animate-fade-in">
                        <span className="h-5 w-5 rounded-full bg-sky-100 dark:bg-sky-950 flex items-center justify-center font-bold text-[10px] text-sky-700 dark:text-sky-400 shrink-0">{idx + 2}</span>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-850 dark:text-slate-200">ක්‍රියාමාර්ගය / Action Taken</p>
                          <p className="text-slate-800 dark:text-slate-300 font-medium bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 shadow-3xs mt-1 leading-relaxed">
                            {act.action_text}
                          </p>
                          <p className="text-slate-450 dark:text-slate-500 font-mono text-[10.5px] pt-1">
                            වේලාව / Timestamp: {act.added_at} (Asia/Colombo)
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-400 dark:text-slate-600">
                      <AlertTriangle className="h-5 w-5 mx-auto text-slate-300 dark:text-slate-700 mb-1" />
                      <p className="text-xs font-semibold">මෙතෙක් කිසිදු ක්‍රියාමාර්ගයක් ගෙන නැත.</p>
                      <p className="text-[10px]">No action history recorded for this letter yet.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAuditLetter(null)}
                  className="px-4.5 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  වසන්න / Close Audit Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
