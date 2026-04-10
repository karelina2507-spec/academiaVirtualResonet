import React, { useEffect, useState } from 'react';
import { GraduationCap, BookOpen, Trophy, TrendingUp, Clock, ChevronRight, PlayCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { Course, Enrollment, UserProgress } from '../types';
import CourseCard from '../components/CourseCard';

interface CourseWithProgress extends Course {
  progress?: number;
  enrolled?: boolean;
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { navigate } = useNavigation();
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithProgress[]>([]);
  const [allCourses, setAllCourses] = useState<CourseWithProgress[]>([]);
  const [stats, setStats] = useState({ enrolled: 0, completed: 0, inProgress: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [enrollRes, coursesRes, progressRes] = await Promise.all([
        supabase.from('enrollments').select('*, course:courses(*, category:categories(*))').eq('user_id', user!.id),
        supabase.from('courses').select('*, category:categories(*)').eq('is_published', true).limit(8),
        supabase.from('user_progress').select('*').eq('user_id', user!.id),
      ]);

      const enrollments: Enrollment[] = enrollRes.data || [];
      const progress: UserProgress[] = progressRes.data || [];
      const enrolledIds = new Set(enrollments.map(e => e.course_id));

      const enrolledWithProgress: CourseWithProgress[] = (enrollments as any[]).map(e => {
        const courseProgress = progress.filter(p => p.course_id === e.course_id);
        const avgProgress = courseProgress.length > 0
          ? Math.round(courseProgress.reduce((a, p) => a + p.progress_percent, 0) / courseProgress.length)
          : 0;
        return { ...e.course, progress: avgProgress, enrolled: true };
      });

      const featured: CourseWithProgress[] = (coursesRes.data || []).map(c => ({
        ...c,
        enrolled: enrolledIds.has(c.id),
        progress: undefined,
      }));

      const completed = enrollments.filter(e => e.completed_at).length;
      const inProg = enrolledWithProgress.filter(c => (c.progress || 0) > 0 && (c.progress || 0) < 100).length;

      setEnrolledCourses(enrolledWithProgress);
      setAllCourses(featured);
      setStats({ enrolled: enrollments.length, completed, inProgress: inProg });
    } finally {
      setLoading(false);
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          {greeting}, {profile?.full_name?.split(' ')[0] || 'colaborador'}
        </h1>
        <p className="text-slate-400 mt-1">Continúa tu aprendizaje donde lo dejaste</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Cursos Inscritos', value: stats.enrolled, icon: BookOpen, color: 'green' },
          { label: 'Completados', value: stats.completed, icon: Trophy, color: 'emerald' },
          { label: 'En Progreso', value: stats.inProgress, icon: TrendingUp, color: 'amber' },
          { label: 'Disponibles', value: allCourses.length, icon: GraduationCap, color: 'slate' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-${stat.color}-500/15`}>
              <stat.icon className={`w-4 h-4 text-${stat.color}-400`} />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {enrolledCourses.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Continuar aprendiendo</h2>
            <button onClick={() => navigate('courses')} className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 transition">
              Ver todos <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {enrolledCourses.slice(0, 4).map(course => (
              <CourseCard key={course.id} course={course} progress={course.progress} enrolled />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Cursos disponibles</h2>
          <button onClick={() => navigate('courses')} className="text-sm text-green-400 hover:text-green-300 flex items-center gap-1 transition">
            Explorar todos <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : allCourses.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No hay cursos disponibles aún</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {allCourses.map(course => (
              <CourseCard key={course.id} course={course} enrolled={course.enrolled} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
