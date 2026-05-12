import React, { useEffect, useMemo, useRef, useState } from 'react';
import { userService } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';
import translations from '../../translations';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'user',
};

const ITEMS_PER_PAGE = 10;
const sortOptions = ['newest', 'nameAsc', 'nameDesc'];

const ActionMenu = ({ onEdit, onDelete, isDeleting, language, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1 w-36 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden border border-slate-100">
          <div className="py-1">
            <button
              onClick={() => { setIsOpen(false); onEdit(); }}
              className="flex w-full items-center px-4 py-2.5 text-sm text-[var(--teal)] hover:bg-teal-50 font-semibold transition-colors"
            >
              <svg className="mr-2.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              {t.edit[language]}
            </button>
            <button
              onClick={() => { setIsOpen(false); onDelete(); }}
              disabled={isDeleting}
              className="flex w-full items-center px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 font-semibold disabled:opacity-50 transition-colors"
            >
              <svg className="mr-2.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              {isDeleting ? t.deleting[language] : t.delete[language]}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const { language } = useLanguage();
  const t = translations.manageUsers;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await userService.getAll();
      setUsers(response.data.data || response.data || []);
      setFormError(null);
    } catch (err) {
      setFormError(t.loadFailed[language]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return users
      .filter((user) => {
        if (!term) return true;
        return (
          (user.name && user.name.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'nameAsc') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'nameDesc') return (b.name || '').localeCompare(a.name || '');
        return Number(b.id) - Number(a.id);
      });
  }, [users, searchTerm, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage !== currentPageSafe) {
      setCurrentPage(currentPageSafe);
    }
  }, [currentPage, currentPageSafe]);

  const pageItems = useMemo(() => {
    const items = [];

    if (totalPages <= 7) {
      for (let page = 1; page <= totalPages; page += 1) {
        items.push(page);
      }
      return items;
    }

    items.push(1);

    if (currentPageSafe > 3) {
      items.push('ellipsis-start');
    }

    const start = Math.max(2, currentPageSafe - 1);
    const end = Math.min(totalPages - 1, currentPageSafe + 1);

    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }

    if (currentPageSafe < totalPages - 2) {
      items.push('ellipsis-end');
    }

    items.push(totalPages);

    return items;
  }, [currentPageSafe, totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPageSafe - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPageSafe, filteredUsers]);

  const stats = useMemo(() => {
    return {
      totalUsers: users.length,
    };
  }, [users.length]);

  const handleAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'user',
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setFormError(null);
      
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (editingId) {
        await userService.update(editingId, payload);
      } else {
        await userService.create(payload);
      }

      await fetchData();
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);
    } catch (err) {
      setFormError(err.response?.data?.message || t.saveFailed[language]);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    try {
      setDeletingId(deleteConfirmId);
      setFormError(null);
      await userService.delete(deleteConfirmId);
      await fetchData();
    } catch (err) {
      setFormError(t.deleteFailed[language]);
      console.error(err);
    } finally {
      setDeletingId(null);
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setFormError(null);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('newest');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-white/70" />
        <div className="h-40 animate-pulse rounded-lg bg-white/70" />
        <div className="h-80 animate-pulse rounded-lg bg-white/70" />
      </div>
    );
  }

  return (
    <div className="space-y-6 page-fade">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="pill">{t.eyebrow[language]}</span>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{t.title[language]}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">{t.subtitle[language]}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleAdd} className="btn-primary">
            <span aria-hidden="true">+</span>
            {t.addUser[language]}
          </button>
        </div>
      </div>

      {formError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 reveal">
          {formError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 reveal">
        <div className="glass-card rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/60">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{t.totalUsers[language]}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{stats.totalUsers}</p>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[var(--ink)]/40 backdrop-blur-sm page-fade">
          <div className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 md:p-8 shadow-2xl reveal">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/50 pb-4">
              <div>
                <h2 className="text-2xl font-semibold text-slate-900">
                  {editingId ? t.editTitle[language] : t.addTitle[language]}
                </h2>
                <p className="mt-1 text-sm text-slate-600">{t.formHelp[language]}</p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
              >
                <span aria-hidden="true" className="text-xl leading-none">&times;</span>
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">{t.name[language]} *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">{t.email[language]} *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    {t.password[language]} {!editingId && '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
                    required={!editingId}
                  />
                  {editingId && (
                    <p className="mt-1 text-xs text-slate-500">{t.passwordHelp[language]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">{t.role[language]}</label>
                  <select
                    value={formData.role}
                    onChange={(event) => setFormData({ ...formData, role: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200/50 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[var(--gold)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm"
                >
                  {saving ? t.saving[language] : t.save[language]}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  {t.cancel[language]}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/40 backdrop-blur-sm page-fade">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 shadow-2xl reveal">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 mb-4">
                <svg className="h-8 w-8 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900">{t.deleteConfirm[language]}</h3>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={confirmDelete}
                className="inline-flex justify-center rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                {t.delete[language]}
              </button>
              <button
                type="button"
                onClick={cancelDelete}
                className="inline-flex justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                {t.cancel[language]}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-4 reveal reveal-delay-1 transition-all duration-300 hover:shadow-lg">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_auto]">
          <div>
            <label className="sr-only">{t.search[language]}</label>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t.searchPlaceholder[language]}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
            />
          </div>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--ember)]"
            aria-label={t.sortBy[language]}
          >
            {sortOptions.map(option => (
              <option key={option} value={option}>{t.sortOptions[option][language]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {t.reset[language]}
          </button>
        </div>
      </div>

      <div className="glass-card overflow-hidden rounded-2xl reveal reveal-delay-2 transition-all duration-300 hover:shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/70 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{t.listTitle[language]}</h2>
            <p className="text-sm text-slate-600">
              {filteredUsers.length} {t.results[language]}
            </p>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            {t.refresh[language]}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-white/70 bg-white/70">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.name[language]}</th>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.email[language]}</th>
                <th className="px-5 py-4 text-left font-semibold text-slate-600">{t.role[language]}</th>
                <th className="px-5 py-4 text-right font-semibold text-slate-600">{t.actions[language]}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => {
                const isDeleting = deletingId === user.id;

                return (
                  <tr key={user.id} className="border-b border-white/70 transition hover:bg-white/60">
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--teal)]/10 text-[var(--teal)] font-bold">
                          {(user.name || '?').charAt(0).toUpperCase()}
                        </div>
                        {user.name}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {user.email || '-'}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <ActionMenu 
                          onEdit={() => handleEdit(user)}
                          onDelete={() => handleDelete(user.id)}
                          isDeleting={isDeleting}
                          language={language}
                          t={t}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > 0 && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/70 bg-white/70 px-5 py-4 text-sm">
            <div className="text-xs uppercase tracking-[0.25em] text-slate-500">
              {t.page[language]} {currentPageSafe} {t.of[language]} {totalPages}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPageSafe === 1}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.prev[language]}
              </button>

              <div className="flex items-center gap-1">
                {pageItems.map((item) =>
                  typeof item === 'number' ? (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setCurrentPage(item)}
                      className={`h-9 w-9 rounded-full text-xs font-semibold transition ${
                        item === currentPageSafe
                          ? 'bg-[var(--ink)] text-white'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={item} className="px-2 text-xs text-slate-400">
                      ...
                    </span>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPageSafe === totalPages}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.next[language]}
              </button>
            </div>
          </div>
        )}

        {filteredUsers.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="font-semibold text-slate-800">{t.noUsers[language]}</p>
            <p className="mt-2 text-sm text-slate-600">{t.noUsersHelp[language]}</p>
            <button onClick={handleAdd} className="mt-5 btn-primary">
              <span aria-hidden="true">+</span>
              {t.addUser[language]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
