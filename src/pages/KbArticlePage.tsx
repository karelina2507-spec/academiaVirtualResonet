import React, { useEffect, useState } from 'react';
import { ArrowLeft, Tag, ExternalLink, Calendar, Eye, Loader2, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../contexts/NavigationContext';
import { KbArticle } from '../types';

interface Props { articleId: string }

export default function KbArticlePage({ articleId }: Props) {
  const { goBack } = useNavigation();
  const [article, setArticle] = useState<KbArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadArticle(); }, [articleId]);

  const loadArticle = async () => {
    const { data } = await supabase
      .from('kb_articles')
      .select('*, space:kb_spaces(*)')
      .eq('id', articleId)
      .maybeSingle();
    setArticle(data);
    if (data) {
      supabase.from('kb_articles').update({ views: (data.views || 0) + 1 }).eq('id', articleId);
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
    </div>
  );

  if (!article) return (
    <div className="p-6 text-center text-slate-400">
      <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p>Artículo no encontrado</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Base de Conocimiento
      </button>

      <article>
        <div className="mb-6">
          {article.space && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white inline-block mb-3"
              style={{ backgroundColor: (article.space as any).color }}>
              {(article.space as any).name}
            </span>
          )}
          <h1 className="text-2xl font-bold text-white mb-4">{article.title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(article.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" /> {article.views || 0} vistas
            </span>
          </div>
        </div>

        {article.confluence_page_url && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-300">Documentación completa en Confluence</p>
              <p className="text-xs text-slate-400 mt-0.5">Este artículo está vinculado a una página de Confluence</p>
            </div>
            <a
              href={article.confluence_page_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex-shrink-0"
            >
              Abrir <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {article.content ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
            {article.content}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <p>El contenido está disponible en Confluence</p>
          </div>
        )}

        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-2">
            <Tag className="w-4 h-4 text-slate-500" />
            {article.tags.map(tag => (
              <span key={tag} className="text-sm bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
