import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Loader2, Check, Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { KbSpace } from '../types';

interface Props { articleId?: string }

export default function AdminKbForm({ articleId }: Props) {
  const { user } = useAuth();
  const { goBack, navigate } = useNavigation();
  const [spaces, setSpaces] = useState<KbSpace[]>([]);
  const [loading, setLoading] = useState(!!articleId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [confluenceUrl, setConfluenceUrl] = useState('');
  const [tags, setTags] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    supabase.from('kb_spaces').select('*').order('sort_order').then(({ data }) => setSpaces(data || []));
    if (articleId) loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    const { data } = await supabase.from('kb_articles').select('*').eq('id', articleId).maybeSingle();
    if (data) {
      setTitle(data.title || '');
      setContent(data.content || '');
      setSpaceId(data.space_id || '');
      setConfluenceUrl(data.confluence_page_url || '');
      setTags((data.tags || []).join(', '));
      setIsPublished(data.is_published ?? true);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const articleData = {
      title: title.trim(),
      content: content.trim(),
      space_id: spaceId || null,
      confluence_page_url: confluenceUrl.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      is_published: isPublished,
      author_id: user?.id,
      updated_at: new Date().toISOString(),
    };

    if (articleId) {
      await supabase.from('kb_articles').update(articleData).eq('id', articleId);
    } else {
      await supabase.from('kb_articles').insert(articleData);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); navigate('admin-kb'); }, 1000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{articleId ? 'Editar Artículo' : 'Nuevo Artículo'}</h1>
        <button onClick={handleSave} disabled={saving || !title.trim()}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Título *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Título del artículo" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Espacio</label>
          <select value={spaceId} onChange={e => setSpaceId(e.target.value)}
            className="w-full bg-slate-700/50 border border-slate-600 text-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Sin espacio</option>
            {spaces.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">URL de Confluence</label>
          <input type="url" value={confluenceUrl} onChange={e => setConfluenceUrl(e.target.value)}
            className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="https://wiki.empresa.com/pages/..." />
          <p className="text-xs text-slate-500 mt-1">Si se provee, los usuarios serán redirigidos a Confluence al hacer clic</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Contenido</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={12}
            className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono"
            placeholder="Escribe el contenido del artículo aquí..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Etiquetas (separadas por coma)</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)}
            className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="instalación, configuración, soporte" />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={() => setIsPublished(!isPublished)} className={`w-10 h-6 rounded-full transition-all flex items-center ${isPublished ? 'bg-emerald-500' : 'bg-slate-600'}`}>
            <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${isPublished ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-sm text-slate-300">Publicado</span>
        </label>
      </div>
    </div>
  );
}
