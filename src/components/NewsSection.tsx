import React, { useState } from 'react';
import { NewsArticle } from '../types';
import { Newspaper, ArrowRight, X, Plus, Lock } from 'lucide-react';

interface NewsSectionProps {
  news: NewsArticle[];
  onAddNewArticle?: (article: NewsArticle) => void;
  currentUser?: { name: string; role: string } | null;
  onOpenLogin: () => void;
}

export const NewsSection: React.FC<NewsSectionProps> = ({
  news,
  onAddNewArticle,
  currentUser,
  onOpenLogin
}) => {
  const [activeArticleModal, setActiveArticleModal] = useState<NewsArticle | null>(null);
  const [isAddingNews, setIsAddingNews] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'Convocatoria' | 'Logro Académico' | 'Evento' | 'Publicación Científica'>('Convocatoria');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');

  const handleCreateNewsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    if (!newTitle || !newSummary || !onAddNewArticle) return;

    const article: NewsArticle = {
      id: `news-${Date.now()}`,
      title: newTitle,
      date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }),
      category: newCategory,
      summary: newSummary,
      content: newContent ? [newContent] : [newSummary],
      author: currentUser?.name || 'Dirección y Presidencia',
      readTime: '2 min de lectura',
      tags: ['Semillero', 'USB Cali']
    };

    onAddNewArticle(article);
    setIsAddingNews(false);
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
  };

  return (
    <section id="noticias" className="py-16 sm:py-20 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
              <span>Comunicación Institucional</span>
              <span aria-hidden="true">·</span>
              <span>Semillero USB Cali</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Noticias y Novedades
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Canal oficial para convocatorias, acuerdos y comunicados emitidos por la Dirección y Presidencia del Semillero.
            </p>
          </div>

          {currentUser ? (
            <button
              onClick={() => setIsAddingNews(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer self-start md:self-auto shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Publicar Noticia</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer self-start md:self-auto shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Acceso Miembros para Publicar</span>
            </button>
          )}
        </div>

        {/* Content Grid or Blank State */}
        <div className="mt-8">
          {news.length === 0 ? (
            <div className="text-center py-16 px-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 shadow-xs max-w-3xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto text-[#0F2D59] mb-4 shadow-xs">
                <Newspaper className="w-7 h-7 text-[#0F2D59]" />
              </div>

              <span className="text-[11px] font-semibold tracking-wider uppercase text-[#EA580C] block mb-1">
                Boletín Informativo
              </span>

              <h3 className="text-xl font-bold text-slate-900">
                No Hay Noticias Publicadas Aún
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
                Este espacio está reservado para los comunicados oficiales, apertura de convocatorias y novedades del semillero.
              </p>

              <div className="mt-6">
                {currentUser ? (
                  <button
                    onClick={() => setIsAddingNews(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publicar Primer Comunicado (Miembro Activo)</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[11px] text-slate-500">
                      Solo los miembros activos con sesión iniciada pueden publicar noticias y comunicados.
                    </p>
                    <button
                      onClick={onOpenLogin}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-all shadow-sm cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Iniciar Sesión como Miembro</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map(article => (
                <div
                  key={article.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="font-semibold text-[#EA580C]">{article.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{article.date}</span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {article.title}
                    </h4>

                    <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                      {article.summary}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Por {article.author}</span>
                    <button
                      onClick={() => setActiveArticleModal(article)}
                      className="text-xs font-semibold text-[#0F2D59] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Leer</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Add News Modal */}
      {isAddingNews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-5 sm:px-6 py-4 bg-[#0F2D59] text-white flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase text-orange-200 block">
                  Comunicación Oficial
                </span>
                <h3 className="text-base font-bold text-white truncate mt-0.5">
                  Publicar Noticia o Comunicado
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingNews(false)}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-3"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewsSubmit} className="p-5 sm:p-6 space-y-3.5 flex-1 overflow-y-auto min-h-0">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título de la Noticia *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej. Convocatoria Abierta para Nuevos Semilleristas"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Categoría
                </label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                >
                  <option value="Convocatoria">Convocatoria</option>
                  <option value="Logro Académico">Logro Académico</option>
                  <option value="Evento">Evento</option>
                  <option value="Publicación Científica">Publicación Científica</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resumen Breve *
                </label>
                <textarea
                  required
                  rows={2}
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  placeholder="Resumen del anuncio..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contenido Detallado
                </label>
                <textarea
                  rows={3}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Detalles adicionales..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingNews(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Article Reader Modal */}
      {activeArticleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-5 sm:px-6 py-4 bg-[#0F2D59] text-white flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <div className="text-xs text-orange-200 font-semibold uppercase">
                  {activeArticleModal.category} · {activeArticleModal.date}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white truncate mt-0.5">
                  {activeArticleModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveArticleModal(null)}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-3"
                aria-label="Cerrar lectura"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
              <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed font-medium">
                {activeArticleModal.summary}
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                {activeArticleModal.content.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </div>

            <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <span>Publicado por: <strong className="text-slate-700">{activeArticleModal.author}</strong></span>
              <button
                type="button"
                onClick={() => setActiveArticleModal(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
