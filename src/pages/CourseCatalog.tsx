import React, { useEffect, useState } from 'react';
import { Search, Filter, GraduationCap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Course, Category } from '../types';
import CourseCard from '../components/CourseCard';

const LEVEL_LABELS: Record<string, string> = {
  onboarding: 'Onboarding',
  introductory: 'Introductorio',
  technical_l1: 'Técnico N1',
  technical_l2: 'Técnico N2',
  technical_l3: 'Técnico N3',
};

export default function CourseCatalog() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const [catRes, courseRes, enrollRes] = await Promise.all([
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('courses').select('*, category:categories(*)').eq('is_published', true).order('created_at', { ascending: false }),
      user ? supabase.from('enrollments').select('course_id').eq('user_id', user.id) : Promise.resolve({ data: [], error: null }),
    ]);
    if (courseRes.error) {
      setError(courseRes.error.message);
      setLoading(false);
      return;
    }
    setCategories(catRes.data || []);
    setCourses(courseRes.data || []);
    setEnrolledIds(new Set((enrollRes.data || []).map((e: any) => e.course_id)));
    setLoading(false);
  };

  const filtered = courses.filter(c => {
    const matchCat = selectedCat === 'all' || c.category_id === selectedCat;
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    const matchDiff = difficulty === 'all' || c.difficulty === difficulty;
    return matchCat && matchSearch && matchDiff;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Catálogo de Cursos</h1>
        <p className="text-slate-400 mt-1">Explora todos los cursos y capacitaciones disponibles</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select
          value={difficulty}
          onChange={e => setDifficulty(e.target.value)}
          className="bg-slate-800/50 border border-slate-700 text-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="all">Todos los niveles</option>
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCat === 'all' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
              selectedCat === cat.id
                ? 'text-white border-transparent'
                : 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
            }`}
            style={selectedCat === cat.id ? { backgroundColor: cat.color, borderColor: cat.color } : {}}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {error ? (
        <div className="text-center py-24">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 text-red-500 opacity-50" />
          <p className="font-medium text-red-400">Error al cargar los cursos</p>
          <p className="text-sm mt-1 text-slate-500">{error}</p>
          <button onClick={loadData} className="mt-4 px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-700 transition-colors">
            Reintentar
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl h-64 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-slate-500">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No se encontraron cursos</p>
          <p className="text-sm mt-1">Intenta con otros filtros</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-4">{filtered.length} curso{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(course => (
              <CourseCard key={course.id} course={course} enrolled={enrolledIds.has(course.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
