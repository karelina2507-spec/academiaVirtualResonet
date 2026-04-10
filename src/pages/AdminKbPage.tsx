import React, { useEffect, useState } from 'react';
import { Plus, Database, FileText, CreditCard as Edit2, Eye, EyeOff, Loader2, Tag, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../contexts/NavigationContext';
import { KbSpace, KbArticle } from '../types';

export default function AdminKbPage() {
  const { navigate } = useNavigation();
  const [spaces, setSpaces] = useState<KbSpace[]>([]);
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'articles' | 'spaces'>('articles');
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [spaceName, setSpaceName] = useState('');
  const [spaceSlug, setSpaceSlug] = useState('');
  const [spaceDesc, setSpaceDesc] = useState('');
  const [spaceColor, setSpaceColor] = useState('#16a34a');
  const [spaceConfluenceKey, setSpaceConfluenceKey] = useState('');
  const [spaceConfluenceUrl, setSpaceConfluenceUrl] = useState('');
  const [savingSpace, setSavingSpace] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [spacesRes, articlesRes] = await Promise.all([
      supabase.from('kb_spaces').select('*').order('sort_order'),
      supabase.from('kb_articles').select('*, space:kb_spaces(name, color)').order('created_at', { ascending: false }),
    ]);
    setSpaces(spacesRes.data || []);
    setArticles(articlesRes.data || []);
    setLoading(false);
  };

  const toggleArticlePublish = async (id: string, current: boolean) => {
    await supabase.from('kb_articles').update({ is_published: !current }).eq('id', id);
    setArticles(prev => prev.map(a => a.id === id ? { ...a, is_published: !current } : a));
  };

  const handleSaveSpace = async () => {
    if (!spaceName || !spaceSlug) return;
    setSavingSpace(true);
    await supabase.from('kb_spaces').insert({
      name: spaceName,
      slug: spaceSlug,
      description: spaceDesc,
      color: spaceColor,
      confluence_space_key: spaceConfluenceKey,
      confluence_base_url: spaceConfluenceUrl,
      is_published: true,
    });
    await loadData();
    setShowSpaceForm(false);
    setSpaceName(''); setSpaceSlug(''); setSpaceDesc(''); setSpaceConfluenceKey(''); setSpaceConfluenceUrl('');
    setSavingSpace(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Base de Conocimiento</h1>
          <p className="text-slate-400 mt-1">Administra espacios y artículos de conocimiento</p>
        </div>
        <button
          onClick={() => navigate({ name: 'admin-kb-form' })}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
        >
          <Plus className="w-4 h-4" /> Nuevo Artículo
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('articles')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'articles' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
          Artículos ({articles.length})
        </button>
        <button onClick={() => setActiveTab('spaces')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'spaces' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
          Espacios ({spaces.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-green-500 animate-spin" /></div>
      ) : activeTab === 'articles' ? (
        <div className="space-y-3">
          {articles.length === 0 ? (
            <div className="text-center py-24 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hay artículos. Crea el primero.</p>
            </div>
          ) : articles.map(article => (
            <div key={article.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-semibold text-white text-sm">{article.title}</h3>
                  {article.space && (
                    <span className="text-xs text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: (article.space as any).color + 'cc' }}>
                      {(article.space as any).name}
                    </span>
                  )}
                  {article.confluence_page_url && <ExternalLink className="w-3.5 h-3.5 text-green-400" />}
                </div>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map(t => (
                      <span key={t} className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${article.is_published ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  {article.is_published ? 'Publicado' : 'Borrador'}
                </span>
                <button onClick={() => toggleArticlePublish(article.id, article.is_published)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition">
                  {article.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => navigate({ name: 'admin-kb-form', id: article.id })} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {!showSpaceForm ? (
            <button onClick={() => setShowSpaceForm(true)} className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition border border-dashed border-green-500/30 rounded-xl px-4 py-3 w-full justify-center">
              <Plus className="w-4 h-4" /> Crear nuevo espacio
            </button>
          ) : (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white">Nuevo Espacio</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input type="text" value={spaceName} onChange={e => { setSpaceName(e.target.value); setSpaceSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }}
                  placeholder="Nombre del espacio" className="bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                <input type="text" value={spaceSlug} onChange={e => setSpaceSlug(e.target.value)}
                  placeholder="slug-del-espacio" className="bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                <input type="text" value={spaceDesc} onChange={e => setSpaceDesc(e.target.value)}
                  placeholder="Descripción" className="sm:col-span-2 bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                <input type="text" value={spaceConfluenceKey} onChange={e => setSpaceConfluenceKey(e.target.value)}
                  placeholder="Clave de espacio Confluence (ej: TECH)" className="bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                <input type="url" value={spaceConfluenceUrl} onChange={e => setSpaceConfluenceUrl(e.target.value)}
                  placeholder="URL base Confluence" className="bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500" />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-400">Color:</label>
                  <input type="color" value={spaceColor} onChange={e => setSpaceColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveSpace} disabled={savingSpace} className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-50">
                  {savingSpace ? 'Guardando...' : 'Crear Espacio'}
                </button>
                <button onClick={() => setShowSpaceForm(false)} className="text-slate-400 hover:text-white text-sm px-4 py-2 rounded-lg transition">Cancelar</button>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {spaces.map(space => (
              <div key={space.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: space.color }} />
                  <h3 className="font-semibold text-white text-sm">{space.name}</h3>
                </div>
                <p className="text-xs text-slate-400 mb-2">{space.description}</p>
                {space.confluence_space_key && (
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <Database className="w-3 h-3" /> {space.confluence_space_key}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">{articles.filter(a => a.space_id === space.id).length} artículos</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
