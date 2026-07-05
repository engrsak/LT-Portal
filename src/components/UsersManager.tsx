import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users, AlertCircle, X, Check, Eye, EyeOff } from 'lucide-react';
import { User, Subject, Session } from '../types';

interface UsersManagerProps {
  session: Session;
  subjectsUpdatedTrigger?: number;
}

export default function UsersManager({ session, subjectsUpdatedTrigger = 0 }: UsersManagerProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formSubjectId, setFormSubjectId] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersRes = await fetch('/api/users', {
        headers: { 'x-user-id': session.id.toString() }
      });
      // Fetch subjects for dropdown selection
      const subjectsRes = await fetch('/api/subjects', {
        headers: { 'x-user-id': session.id.toString() }
      });

      if (usersRes.ok && subjectsRes.ok) {
        const usersData = await usersRes.json();
        const subjectsData = await subjectsRes.json();
        setUsers(usersData);
        setSubjects(subjectsData);
      } else {
        setError('දත්ත ලබාගැනීමට නොහැකි විය. / Failed to fetch data.');
      }
    } catch (err) {
      setError('සම්බන්ධතා දෝෂයකි. / Network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subjectsUpdatedTrigger]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormUsername('');
    setFormPassword('');
    // Select first subject if available
    setFormSubjectId(subjects.length > 0 ? subjects[0].id.toString() : '');
    setError('');
    setIsModalOpen(true);
    setShowPassword(false);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormPassword(''); // Keep empty if not updating password!
    setFormSubjectId(user.subject_id.toString());
    setError('');
    setIsModalOpen(true);
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || (!editingUser && !formPassword.trim()) || !formSubjectId) {
      setError('සියලුම ක්ෂේත්‍ර පුරවන්න. / Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': session.id.toString()
        },
        body: JSON.stringify({
          username: formUsername.trim().toLowerCase(),
          password: formPassword.trim() || undefined,
          subject_id: parseInt(formSubjectId, 10)
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(editingUser ? 'පරිශීලක සාර්ථකව යාවත්කාලීන කරන ලදී! / User updated successfully!' : 'පරිශීලක සාර්ථකව සාදන ලදී! / User created successfully!');
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(data.error || 'ක්‍රියාවලිය අසාර්ථක විය. / Operation failed.');
      }
    } catch (err) {
      setError('සම්බන්ධතා දෝෂයකි. / Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (username === 'admin') {
      alert("ප්‍රධාන පරිශීලක 'admin' මකා දැමිය නොහැක. / System admin user cannot be deleted.");
      return;
    }
    if (!confirm(`මෙම පරිශීලකයා (${username}) මකා දැමීමට අවශ්‍ය බව සහතිකද? / Are you sure you want to delete user '${username}'?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': session.id.toString() }
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('පරිශීලක සාර්ථකව මකා දමන ලදී! / User deleted successfully!');
        fetchData();
      } else {
        setError(data.error || 'මකා දැමීම අසාර්ථක විය.');
      }
    } catch (err) {
      setError('මකා දැමීම අසාර්ථක විය. / Delete failed.');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const term = search.toLowerCase();
    return (
      user.username.toLowerCase().includes(term) ||
      (user.subject_code && user.subject_code.toLowerCase().includes(term)) ||
      (user.subject_description && user.subject_description.toLowerCase().includes(term))
    );
  });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
      
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-display">
            <Users className="h-5 w-5 text-sky-600 dark:text-sky-4.5" />
            පරිශීලක කළමනාකරණය / Users Management
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">ලිපි ලුහුබැඳීමේ ක්‍රියාවලිය සඳහා විෂය අංශ නිලධාරීන්ට ප්‍රවේශ ගිණුම් සෑදීම.</p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="සොයන්න / Search User..."
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
            නව පරිශීලක / Create User
          </button>
        </div>
      </div>

      {/* Content */}
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

        {loading && users.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <svg className="animate-spin h-8 w-8 mx-auto text-sky-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-xs mt-3 text-slate-400">පරිශීලකයන් ලෝඩ් වෙමින් පවතී...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400">
            <p className="text-sm font-medium">කිසිදු පරිශීලකයෙකු සොයාගත නොහැක.</p>
            <p className="text-xs mt-0.5">No users found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-wider bg-slate-100/85 dark:bg-slate-800/40">
                  <th className="px-4 py-3.5 rounded-l-xl">ID</th>
                  <th className="px-4 py-3.5">පරිශීලක නාමය / Username</th>
                  <th className="px-4 py-3.5">මුරපදය / Password</th>
                  <th className="px-4 py-3.5">පවරා ඇති විෂය / Allocated Subject</th>
                  <th className="px-4 py-3.5 text-right rounded-r-xl">ක්‍රියාමාර්ග / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 text-sm">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400 dark:text-slate-500">{user.id}</td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">
                      <span className="flex items-center gap-1.5">
                        {user.username}
                        {user.username === 'admin' && (
                          <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.5 rounded">ADMIN</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-400">
                      <span className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 px-1.5 py-0.5 rounded font-medium text-slate-400 dark:text-slate-500 select-none">
                        ••••••••
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {user.subject_code ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-2 py-0.5 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 text-xs font-bold rounded-lg border border-sky-100 dark:border-sky-900/30 font-mono">
                            {user.subject_code}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[200px]" title={user.subject_description}>
                            {user.subject_description}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-rose-500 font-medium">වර්ගීකරණය කර නැත / Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer"
                          title="සංස්කරණය / Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          disabled={user.username === 'admin'}
                          className={`p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 transition-colors cursor-pointer ${user.username === 'admin' ? 'opacity-40 cursor-not-allowed' : ''}`}
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

      {/* Modal - Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display uppercase tracking-wider">
                {editingUser ? 'ගිණුම සංස්කරණය / Edit User' : 'නව පරිශීලක ගිණුමක් සෑදීම / Create User'}
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
                  පරිශීලක නාමය / Username
                </label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  placeholder="e.g. est_officer"
                  disabled={editingUser?.username === 'admin'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  මුරපදය / Password {editingUser && '(යාවත්කාලීන නොකරන්නේ නම් හිස්ව තබන්න / Keep blank if unchanged)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 font-mono"
                    placeholder={editingUser ? "Leave blank to keep unchanged" : "••••••••"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  පවරා ඇති විෂය / Assigned Subject Area
                </label>
                <select
                  required
                  value={formSubjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                  disabled={editingUser?.username === 'admin'}
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subject_code} - {sub.description}
                    </option>
                  ))}
                </select>
                {editingUser?.username === 'admin' && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">ප්‍රධාන පරිපාලකයා සැමවිටම CC (පොදු ලේඛනාගාරය) විෂයෙහි රැඳී සිටී.</p>
                )}
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
