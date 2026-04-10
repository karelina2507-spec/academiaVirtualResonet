import React, { useEffect, useState } from 'react';
import { Search, Database, FileText, ExternalLink, Tag, Eye, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../contexts/NavigationContext';
import { KbSpace, KbArticle } from '../types';

export default function KnowledgeBase() {
  const { navigate } = useNavigation();
  const [spaces, setSpaces] = useState<KbSpace[]>([]);
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<KbArticle[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let filtered = articles;
    if (selectedSpace !== 'all') filtered = filtered.filter(a => a.space_id === selectedSpace);
    if (search) filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content?.toLowerCase().includes(search.toLowerCase()) ||
      a.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );
    setFilteredArticles(filtered);
  }, [search, selectedSpace, articles]);

  const loadData = async () => {
    const [spacesRes, articlesRes] = await Promise.all([
      supabase.from('kb_spaces').select('*').eq('is_published', true).order('sort_order'),
      supabase.from('kb_articles').select('*, space:kb_spaces(*)').eq('is_published', true).order('created_at', { ascending: false }),
    ]);
    setSpaces(spacesRes.data || []);
    setArticles(articlesRes.data || []);
    setFilteredArticles(articlesRes.data || []);
    setLoading(false);
  };

  const incrementViews = async (articleId: string) => {
    await supabase.from('kb_articles').update({ views: supabase.rpc('', {}) }).eq('id', articleId);
  };

  const handleArticleClick = async (article: KbArticle) => {
    if (article.confluence_page_url) {
      window.open(article.confluence_page_url, '_blank');
    } else {
      navigate({ name: 'kb-article', id: article.id });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Base de Conocimiento</h1>
        <p className="text-slate-400 mt-1">Documentación, guías y recursos de referencia</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar artículos, guías, documentación..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {spaces.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <button
            onClick={() => setSelectedSpace('all')}
            className={`p-4 rounded-xl border text-left transition-all ${selectedSpace === 'all' ? 'bg-green-600/20 border-green-500/30 text-green-300' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-white'}`}
          >
            <Database className="w-6 h-6 mb-2" />
            <p className="text-sm font-medium">Todos</p>
            <p className="text-xs opacity-70">{articles.length} artículos</p>
          </button>
          {spaces.map(space => {
            const count = articles.filter(a => a.space_id === space.id).length;
            return (
              <button
                key={space.id}
                onClick={() => setSelectedSpace(space.id)}
                className={`p-4 rounded-xl border text-left transition-all ${selectedSpace === space.id ? 'border-transparent' : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-white'}`}
                style={selectedSpace === space.id ? { backgroundColor: space.color + '20', borderColor: space.color + '40', color: space.color } : {}}
              >
                <Database className="w-6 h-6 mb-2" />
                <p className="text-sm font-medium">{space.name}</p>
                <p className="text-xs opacity-70">{count} artículos</p>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-24 text-slate-500">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No se encontraron artículos</p>
          {articles.length === 0 && <p className="text-sm mt-1">La base de conocimiento está vacía</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredArticles.map(article => (
            <button
              key={article.id}
              onClick={() => handleArticleClick(article)}
              className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl p-5 text-left transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {article.confluence_page_url ? (
                    <ExternalLink className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  )}
                  {article.space && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: (article.space as KbSpace).color + 'cc' }}>
                      {(article.space as KbSpace).name}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <Eye className="w-3 h-3" />{article.views || 0}
                </span>
              </div>

              <h3 className="font-semibold text-white text-sm mb-2 group-hover:text-green-300 transition-colors line-clamp-2">
                {article.title}
              </h3>

              {article.content && (
                <p className="text-xs text-slate-400 line-clamp-3 mb-3 leading-relaxed">
                  {article.content}
                </p>
              )}

              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                      <Tag className="w-2.5 h-2.5" />{tag}
                    </span>
                  ))}
                </div>
              )}

              {article.confluence_page_url && (
                <p className="text-xs text-green-400 mt-3 flex items-center gap-1">
                  Abrir en Confluence <ExternalLink className="w-3 h-3" />
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
