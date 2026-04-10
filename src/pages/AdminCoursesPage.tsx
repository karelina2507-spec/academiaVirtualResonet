import React, { useEffect, useState, useMemo } from 'react';
import { Plus, BookOpen, CreditCard as Edit2, Eye, EyeOff, Loader2, GraduationCap, FolderInput, Check, X, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigation } from '../contexts/NavigationContext';
import { Course, Category } from '../types';

const difficultyLabel: Record<string, string> = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };
const difficultyColor: Record<string, string> = {
  beginner: 'text-emerald-400 bg-emerald-400/10',
  intermediate: 'text-amber-400 bg-amber-400/10',
  advanced: 'text-red-400 bg-red-400/10',
};

interface CourseRowProps {
  course: Course;
  categories: Category[];
  movingCourseId: string | null;
  selectedCategoryId: string;
  saving: boolean;
  onTogglePublish: (id: string, current: boolean) => void;
  onStartMove: (course: Course) => void;
  onCancelMove: () => void;
  onConfirmMove: (courseId: string) => void;
  onSelectCategory: (id: string) => void;
  onEdit: (id: string) => void;
}

function CourseRow({
  course, categories, movingCourseId, selectedCategoryId, saving,
  onTogglePublish, onStartMove, onCancelMove, onConfirmMove, onSelectCategory, onEdit,
}: CourseRowProps) {
  const isMoving = movingCourseId === course.id;
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-slate-700 overflow-hidden">
        {course.thumbnail_url ? (
          <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <BookOpen className="w-5 h-5 text-slate-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-white text-sm">{course.title}</h3>
          {course.is_required && (
            <span className="text-xs bg-red-500/15 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">Obligatorio</span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColor[course.difficulty]}`}>
            {difficultyLabel[course.difficulty]}
          </span>
        </div>

        {isMoving ? (
          <div className="flex items-center gap-2 mt-2">
            <select
              value={selectedCategoryId}
              onChange={e => onSelectCategory(e.target.value)}
              className="flex-1 bg-slate-700 border border-slate-600 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button
              onClick={() => onConfirmMove(course.id)}
              disabled={!selectedCategoryId || saving}
              className="p-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-lg transition"
              title="Confirmar"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onCancelMove}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition"
              title="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-1">
            {course.category && (
              <span className="text-xs text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: course.category.color + 'cc' }}>
                {course.category.name}
              </span>
            )}
            <p className="text-xs text-slate-500 truncate">{course.description}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${course.is_published ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
          {course.is_published ? 'Publicado' : 'Borrador'}
        </span>
        <button
          onClick={() => onTogglePublish(course.id, course.is_published)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          title={course.is_published ? 'Despublicar' : 'Publicar'}
        >
          {course.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          onClick={() => isMoving ? onCancelMove() : onStartMove(course)}
          className={`p-2 rounded-lg transition ${isMoving ? 'text-green-400 bg-green-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          title="Cambiar categoría"
        >
          <FolderInput className="w-4 h-4" />
        </button>
        <button
          onClick={() => onEdit(course.id)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          title="Editar curso"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AdminCoursesPage() {
  const { navigate } = useNavigation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [movingCourseId, setMovingCourseId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [coursesRes, catsRes] = await Promise.all([
      supabase.from('courses').select('*, category:categories(*)').order('title'),
      supabase.from('categories').select('*').order('sort_order'),
    ]);
    setCourses(coursesRes.data || []);
    setCategories(catsRes.data || []);
    setLoading(false);
  };

  const togglePublish = async (id: string, current: boolean) => {
    await supabase.from('courses').update({ is_published: !current }).eq('id', id);
    setCourses(prev => prev.map(c => c.id === id ? { ...c, is_published: !current } : c));
  };

  const startMove = (course: Course) => {
    setMovingCourseId(course.id);
    setSelectedCategoryId(course.category_id || '');
  };

  const cancelMove = () => {
    setMovingCourseId(null);
    setSelectedCategoryId('');
  };

  const confirmMove = async (courseId: string) => {
    if (!selectedCategoryId) return;
    setSaving(true);
    await supabase.from('courses').update({ category_id: selectedCategoryId }).eq('id', courseId);
    const newCat = categories.find(c => c.id === selectedCategoryId);
    setCourses(prev => prev.map(c => c.id === courseId ? { ...c, category_id: selectedCategoryId, category: newCat } : c));
    setMovingCourseId(null);
    setSelectedCategoryId('');
    setSaving(false);
  };

  const toggleCollapse = (catId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(catId)) next.delete(catId);
      else next.add(catId);
      return next;
    });
  };

  const filteredCourses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(c =>
      c.title.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.category?.name?.toLowerCase().includes(q)
    );
  }, [courses, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, { cat: Category | null; courses: Course[] }>();
    const uncategorized: Course[] = [];

    for (const cat of categories) {
      map.set(cat.id, { cat, courses: [] });
    }

    for (const course of filteredCourses) {
      if (course.category_id && map.has(course.category_id)) {
        map.get(course.category_id)!.courses.push(course);
      } else {
        uncategorized.push(course);
      }
    }

    const result = Array.from(map.values()).filter(g => g.courses.length > 0);
    if (uncategorized.length > 0) {
      result.push({ cat: null, courses: uncategorized });
    }
    return result;
  }, [filteredCourses, categories]);

  const rowProps = {
    categories,
    movingCourseId,
    selectedCategoryId,
    saving,
    onTogglePublish: togglePublish,
    onStartMove: startMove,
    onCancelMove: cancelMove,
    onConfirmMove: confirmMove,
    onSelectCategory: setSelectedCategoryId,
    onEdit: (id: string) => navigate({ name: 'admin-course-form', id }),
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestionar Cursos</h1>
          <p className="text-slate-400 mt-1">Administra el catálogo de cursos y capacitaciones</p>
        </div>
        <button
          onClick={() => navigate({ name: 'admin-course-form' })}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-lg shadow-green-600/20"
        >
          <Plus className="w-4 h-4" /> Nuevo Curso
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar curso por nombre, descripción o categoría..."
          className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-slate-500"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-24 text-slate-500">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search ? 'No se encontraron cursos' : 'No hay cursos creados'}</p>
          {!search && (
            <button onClick={() => navigate({ name: 'admin-course-form' })} className="mt-4 text-sm text-green-400 hover:text-green-300 transition">
              Crear el primer curso
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ cat, courses: groupCourses }) => {
            const groupId = cat?.id ?? '__uncategorized__';
            const isCollapsed = collapsedCategories.has(groupId);
            return (
              <div key={groupId}>
                <button
                  onClick={() => toggleCollapse(groupId)}
                  className="flex items-center gap-3 mb-3 group w-full text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat?.color ?? '#64748B' }}
                  />
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition">
                    {cat?.name ?? 'Sin categoría'}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                    {groupCourses.length}
                  </span>
                  <div className="flex-1 h-px bg-slate-700/60 ml-1" />
                  {isCollapsed
                    ? <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
                    : <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition" />
                  }
                </button>
                {!isCollapsed && (
                  <div className="space-y-2">
                    {groupCourses.map(course => (
                      <CourseRow key={course.id} course={course} {...rowProps} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
