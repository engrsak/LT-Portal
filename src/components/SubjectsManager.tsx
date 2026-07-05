import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Library, AlertCircle, X, Check } from 'lucide-react';
import { Subject, Session } from '../types';

interface SubjectsManagerProps {
  session: Session;
  onSubjectsUpdated?: () => void;
}

export default function SubjectsManager({ session, onSubjectsUpdated }: SubjectsManagerProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formCode, setFormCode] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/subjects', {
        headers: { 'x-user-id': session.id.toString() }
      });
      if (res.ok) {
        const data = await res.json();
        setSubjects(data);
      } else {
        setError('විෂයයන් දත්ත ලබාගැනීමට නොහැකි විය. / Failed to fetch subjects.');
      }
    } catch (err) {
      setError('සම්බන්ධතා දෝෂයකි. / Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const openAddModal = () => {
    setEditingSubject(null);
    setFormCode('');
    setFormDesc('');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub: Subject) => {
    if (sub.subject_code === 'CC') {
      setError("Admin ගේ 'CC' විෂය කේතය වෙනස් කිරීමට නොහැක. / 'CC' is reserved and cannot be modified.");
      return;
    }
    setEditingSubject(sub);
    setFormCode(sub.subject_code);
    setFormDesc(sub.description);
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCode.trim() || !formDesc.trim()) {
      setError('සියලුම ක්ෂේත්‍ර පුරවන්න. / Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const url = editingSubject ? `/api/subjects/${editingSubject.id}` : '/api/subjects';
    const method = editingSubject ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.id.toString()
        },
        body: JSON.stringify({
          subject_code: formCode.trim().toUpperCase(),
          description: formDesc.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(editingSubject ? 'විෂය සාර්ථකව යාවත්කාලීන කරන ලදී! / Subject updated successfully!' : 'විෂය සාර්ථකව එක් කරන ලදී! / Subject created successfully!');
        setIsModalOpen(false);
        fetchSubjects();
        if (onSubjectsUpdated) onSubjectsUpdated();
      } else {
        setError(data.error || 'ක්‍රියාවලිය අසාර්ථක විය. / Operation failed.');
      }
    } catch (err) {
      setError('සම්බන්ධතා දෝෂයකි. / Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (code === 'CC') {
      alert("ප්‍රධාන ලේඛනාගාර විෂය කේතය (CC) මකා දැමිය නොහැක. / 'CC' cannot be deleted.");
      return;
    }
    if (!confirm(`මෙම විෂය (${code}) මකා දැමීමට අවශ්‍ය බව සහතිකද? / Are you sure you want to delete subject '${code}'?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/subjects/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': session.id.toString() }
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('විෂය සාර්ථකව මකා දමන ලදී! / Subject deleted successfully!');
        fetchSubjects();
        if (onSubjectsUpdated) onSubjectsUpdated();
      } else {
        setError(data.error || 'මෙම විෂය වෙනත් ලේඛන හෝ පරිශීලකයන් සමඟ සම්බන්ධ බැවින් මකා දැමිය නොහැක.');
      }
    } catch (err) {
      setError('මකා දැමීම අසාර්ථක විය. / Delete failed.');
    } finally {
      setLoading(false);
    }
  };

  // Filter subjects based on search text
  const filteredSubjects = subjects.filter(sub => {
    const term = search.toLowerCase();
    return (
      sub.subject_code.toLowerCase().includes(term) ||
      sub.description.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
      
      {/* Header section with Search and Add Action */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-display">
            <Library className="h-5 w-5 text-sky-600 dark:text-sky-450" />
            විෂය වර්ගීකරණය / Subjects Management
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ලිපි ගොනු වර්ගීකරණය සඳහා විෂය කේත ඇතුලත් කිරීම සහ පාලනය.</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="සොයන්න / Search Subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-850 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 w-full md:w-64 transition-all"
            />
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-sm shadow-sky-100 dark:shadow-none"
          >
            <Plus className="h-4 w-4" />
            එක් කරන්න / Add Subject
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {error && (
          <div className="mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
            <Check className="h-4.5 w-4.5 shrink-0 mt-0.5 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {loading && subjects.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <svg className="animate-spin h-8 w-8 mx-auto text-sky-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs mt-3 text-slate-400">විෂයයන් ලෝඩ් වෙමින් පවතී...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
            <p className="text-sm font-medium">කිසිදු විෂයයක් සොයාගත නොහැක.</p>
            <p className="text-xs mt-0.5">No subjects found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider bg-slate-100/85 dark:bg-slate-800/40">
                  <th className="px-4 py-3.5 rounded-l-xl">ID</th>
                  <th className="px-4 py-3.5">විෂය කේතය / Code</th>
                  <th className="px-4 py-3.5">විස්තරය / Description</th>
                  <th className="px-4 py-3.5 text-right rounded-r-xl">ක්‍රියාමාර්ග / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                {filteredSubjects.map((sub, idx) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400 dark:text-slate-500">{sub.id}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold font-mono border border-slate-200 dark:border-slate-700">
                        {sub.subject_code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{sub.description}</td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(sub)}
                          disabled={sub.subject_code === 'CC'}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-sky-600 transition-colors cursor-pointer ${sub.subject_code === 'CC' ? 'opacity-40 cursor-not-allowed' : ''}`}
                          title="සංස්කරණය / Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sub.id, sub.subject_code)}
                          disabled={sub.subject_code === 'CC'}
                          className={`p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer ${sub.subject_code === 'CC' ? 'opacity-40 cursor-not-allowed' : ''}`}
                          title="මකා දමන්න / Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Add / Edit Subject */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display uppercase tracking-wider">
                {editingSubject ? 'විෂය සංස්කරණය / Edit Subject' : 'නව විෂයයක් එක් කිරීම / Add New Subject'}
              </h4>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  විෂය කේතය / Subject Code (e.g. ADM, FIN, DEV)
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  placeholder="e.g. EST"
                  disabled={editingSubject?.subject_code === 'CC'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  විස්තරය / Description
                </label>
                <textarea
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 min-h-[80px]"
                  placeholder="e.g. Establishment Division (ස්ථාපන අංශය)"
                />
              </div>

              {error && (
                <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs rounded-xl p-3 flex items-start gap-2.5">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  අවලංගු කරන්න / Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm shadow-sky-100 dark:shadow-none flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  සුරකින්න / Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
