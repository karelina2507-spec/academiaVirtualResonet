import React, { useEffect, useState } from 'react';
import {
  Plus, Loader2, Pencil, Trash2, Check, X, Tag,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category } from '../types';

const ICON_OPTIONS = [
  'users', 'package', 'headphones', 'wrench', 'shield', 'book', 'star',
  'zap', 'cpu', 'settings', 'layers', 'globe', 'award', 'briefcase',
];

const COLOR_OPTIONS = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#6366F1',
  '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#64748B',
];

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'technical', label: 'Técnico' },
];

interface CategoryForm {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  audience: 'all' | 'technical';
  level: string;
  sort_order: number;
}

const emptyForm = (): CategoryForm => ({
  name: '',
  slug: '',
  description: '',
  icon: 'book',
  color: '#10B981',
  audience: 'all',
  level: '',
  sort_order: 99,
});

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface FormPanelProps {
  form: CategoryForm;
  setForm: React.Dispatch<React.SetStateAction<CategoryForm>>;
  editingId: string | null;
  saving: boolean;
  error: string;
  onSave: () => void;
  onCancel: () => void;
}

function CategoryFormPanel({ form, setForm, editingId, saving, error, onSave, onCancel }: FormPanelProps) {
  const handleNameChange = (val: string) => {
    setForm(f => ({ ...f, name: val, slug: slugify(val) }));
  };

  return (
    <div className="bg-slate-800/70 border border-slate-700 rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">{editingId ? 'Editar categoría' : 'Nueva categoría'}</h3>

      {error && <p className="text-xs text-red-400 bg-red-400/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Nombre *</label>
          <input
            value={form.name}
            onChange={e => handleNameChange(e.target.value)}
            placeholder="Nombre de la categoría"
            className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Slug (auto-generado)</label>
          <input
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            placeholder="slug-url"
            className="w-full bg-slate-700 border border-slate-600 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-400 mb-1">Descripción</label>
          <input
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descripción breve"
            className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Audiencia</label>
          <select
            value={form.audience}
            onChange={e => setForm(f => ({ ...f, audience: e.target.value as 'all' | 'technical' }))}
            className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Nivel (opcional)</label>
          <input
            value={form.level}
            onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
            placeholder="ej: 1, 2, avanzado..."
            className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Orden</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
            className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map(c => (
            <button
              key={c}
              onClick={() => setForm(f => ({ ...f, color: c }))}
              className={`w-7 h-7 rounded-full ring-offset-2 ring-offset-slate-800 transition ${form.color === c ? 'ring-2 ring-white' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Otro:</label>
            <input
              type="color"
              value={form.color}
              onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
              className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-2">Icono</label>
        <div className="flex flex-wrap gap-2">
          {ICON_OPTIONS.map(ic => (
            <button
              key={ic}
              onClick={() => setForm(f => ({ ...f, icon: ic }))}
              className={`px-2.5 py-1 text-xs rounded-lg transition border ${form.icon === ic ? 'bg-green-600/20 border-green-500/40 text-green-400' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'}`}
            >
              {ic}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {editingId ? 'Guardar cambios' : 'Crear categoría'}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium px-4 py-2 rounded-xl transition"
        >
          <X className="w-4 h-4" /> Cancelar
        </button>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<CategoryForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    setCategories(data || []);
    setLoading(false);
  };

  const startNew = () => {
    setForm({ ...emptyForm(), sort_order: (categories.length + 1) });
    setEditingId(null);
    setShowNew(true);
    setError('');
  };

  const startEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || 'book',
      color: cat.color || '#10B981',
      audience: (cat.audience as 'all' | 'technical') || 'all',
      level: cat.level || '',
      sort_order: cat.sort_order,
    });
    setEditingId(cat.id);
    setShowNew(false);
    setError('');
  };

  const cancelForm = () => {
    setEditingId(null);
    setShowNew(false);
    setError('');
  };

  const save = async () => {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return; }
    setSaving(true);
    setError('');

    const payload = {
      name: form.name.trim(),
      slug: form.slug || slugify(form.name),
      description: form.description.trim(),
      icon: form.icon,
      color: form.color,
      audience: form.audience,
      level: form.level.trim() || null,
      sort_order: form.sort_order,
    };

    if (editingId) {
      const { error: err } = await supabase.from('categories').update(payload).eq('id', editingId);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from('categories').insert(payload);
      if (err) { setError(err.message); setSaving(false); return; }
    }

    await load();
    cancelForm();
    setSaving(false);
  };

  const moveOrder = async (cat: Category, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const other = categories[swapIdx];
    await Promise.all([
      supabase.from('categories').update({ sort_order: other.sort_order }).eq('id', cat.id),
      supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', other.id),
    ]);
    await load();
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    await supabase.from('categories').delete().eq('id', id);
    setCategories(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
  };

  const formProps: FormPanelProps = {
    form,
    setForm,
    editingId,
    saving,
    error,
    onSave: save,
    onCancel: cancelForm,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Categorías</h1>
          <p className="text-slate-400 mt-1">Organiza los cursos por categoría</p>
        </div>
        {!showNew && !editingId && (
          <button
            onClick={startNew}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-green-600/20"
          >
            <Plus className="w-4 h-4" /> Nueva Categoría
          </button>
        )}
      </div>

      {showNew && (
        <div className="mb-4">
          <CategoryFormPanel {...formProps} />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No hay categorías</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((cat, idx) => (
            <div key={cat.id}>
              {editingId === cat.id ? (
                <CategoryFormPanel {...formProps} />
              ) : (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                    style={{ backgroundColor: cat.color + 'cc' }}
                  >
                    {cat.sort_order}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white text-sm">{cat.name}</h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: cat.color + 'cc' }}
                      >
                        {cat.icon}
                      </span>
                      <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full">
                        {cat.audience === 'all' ? 'Todos' : 'Técnico'}
                      </span>
                      {cat.level && (
                        <span className="text-xs text-slate-400">Nivel: {cat.level}</span>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{cat.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => moveOrder(cat, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-20 rounded-lg transition"
                      title="Subir"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveOrder(cat, 'down')}
                      disabled={idx === categories.length - 1}
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 disabled:opacity-20 rounded-lg transition"
                      title="Bajar"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove(cat.id)}
                      disabled={deletingId === cat.id}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 disabled:opacity-40 rounded-lg transition"
                      title="Eliminar"
                    >
                      {deletingId === cat.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
