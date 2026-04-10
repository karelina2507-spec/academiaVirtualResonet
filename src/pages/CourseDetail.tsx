import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Clock, BookOpen, PlayCircle, CheckCircle, Trophy,
  FileText, ChevronDown, ChevronUp, ExternalLink, Users, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { Course, Module, Quiz, UserProgress } from '../types';

interface Props { courseId: string }

export default function CourseDetail({ courseId }: Props) {
  const { user } = useAuth();
  const { navigate, goBack } = useNavigation();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCourse(); }, [courseId, user]);

  const loadCourse = async () => {
    setLoading(true);
    const [courseRes, modulesRes, quizzesRes, enrollRes, progressRes] = await Promise.all([
      supabase.from('courses').select('*, category:categories(*)').eq('id', courseId).maybeSingle(),
      supabase.from('modules').select('*, lessons(*)').eq('course_id', courseId).order('sort_order'),
      supabase.from('quizzes').select('*, questions:quiz_questions(count)').eq('course_id', courseId),
      user ? supabase.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseId).maybeSingle() : Promise.resolve({ data: null }),
      user ? supabase.from('user_progress').select('*').eq('user_id', user.id).eq('course_id', courseId) : Promise.resolve({ data: [] }),
    ]);

    setCourse(courseRes.data);
    const mods = (modulesRes.data || []).map((m: any) => ({
      ...m,
      lessons: (m.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));
    setModules(mods);
    setQuizzes(quizzesRes.data || []);
    setEnrolled(!!enrollRes.data);
    setProgress(progressRes.data || []);
    if (mods.length > 0) setExpandedModules(new Set([mods[0].id]));
    setLoading(false);
  };

  const handleEnroll = async () => {
    if (!user) return;
    setEnrolling(true);
    await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId });
    setEnrolled(true);
    setEnrolling(false);
  };

  const getLessonProgress = (lessonId: string) => {
    return progress.find(p => p.lesson_id === lessonId);
  };

  const totalLessons = modules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);
  const completedLessons = progress.filter(p => p.completed).length;
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
    </div>
  );

  if (!course) return (
    <div className="p-6 text-slate-400 text-center">Curso no encontrado</div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6">
      <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-4">
            {course.category && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full text-white inline-block mb-3"
                style={{ backgroundColor: course.category.color }}>
                {course.category.name}
              </span>
            )}
            <h1 className="text-2xl font-bold text-white mb-2">{course.title}</h1>
            <p className="text-slate-400 text-sm leading-relaxed">{course.description}</p>
          </div>

          {course.instructor_name && (
            <p className="text-sm text-slate-500 mb-4">Instructor: <span className="text-slate-300">{course.instructor_name}</span></p>
          )}

          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <BookOpen className="w-4 h-4" /> {totalLessons} lecciones
            </div>
            {course.duration_minutes > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" /> {course.duration_minutes} minutos
              </div>
            )}
            {quizzes.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Trophy className="w-4 h-4" /> {quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''}
              </div>
            )}
          </div>

          {enrolled && totalLessons > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between text-sm text-slate-400 mb-2">
                <span>Tu progreso</span>
                <span className="font-medium text-white">{completedLessons}/{totalLessons} lecciones</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
              </div>
              <p className="text-xs text-slate-500 mt-1">{overallProgress}% completado</p>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-white">Contenido del curso</h2>
            {modules.map(mod => (
              <div key={mod.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
                <button
                  onClick={() => {
                    setExpandedModules(prev => {
                      const next = new Set(prev);
                      if (next.has(mod.id)) next.delete(mod.id);
                      else next.add(mod.id);
                      return next;
                    });
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="font-medium text-white text-sm">{mod.title}</span>
                    <span className="text-xs text-slate-500">{mod.lessons?.length || 0} lecciones</span>
                  </div>
                  {expandedModules.has(mod.id) ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {expandedModules.has(mod.id) && (
                  <div className="border-t border-slate-700/50">
                    {(mod.lessons || []).map((lesson: any) => {
                      const lessonProgress = getLessonProgress(lesson.id);
                      const isCompleted = lessonProgress?.completed;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => enrolled && navigate({ name: 'lesson', lessonId: lesson.id, courseId })}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm border-b border-slate-700/30 last:border-0 transition ${enrolled ? 'hover:bg-slate-700/30 cursor-pointer' : 'cursor-default opacity-70'}`}
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {isCompleted ? <CheckCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                          </div>
                          <span className={`flex-1 text-left ${isCompleted ? 'text-emerald-300/70' : 'text-slate-300'}`}>{lesson.title}</span>
                          {lesson.confluence_url && <ExternalLink className="w-3 h-3 text-slate-500" />}
                          {lesson.duration_seconds > 0 && (
                            <span className="text-xs text-slate-500">{Math.round(lesson.duration_seconds / 60)}m</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {quizzes.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Evaluaciones</h3>
                {quizzes.map(quiz => (
                  <button
                    key={quiz.id}
                    onClick={() => enrolled && navigate({ name: 'quiz', quizId: quiz.id, courseId })}
                    className={`w-full flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 ${enrolled ? 'hover:bg-amber-500/15 cursor-pointer' : 'cursor-default opacity-60'} transition`}
                  >
                    <Trophy className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-amber-300">{quiz.title}</p>
                      <p className="text-xs text-slate-400">Puntuación mínima: {quiz.passing_score}%</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            {course.thumbnail_url ? (
              <img src={course.thumbnail_url} alt={course.title} className="w-full h-40 object-cover rounded-lg mb-4" />
            ) : (
              <div className="w-full h-40 rounded-lg mb-4 flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${course.category?.color || '#16a34a'}30, ${course.category?.color || '#16a34a'}10)` }}>
                <BookOpen className="w-12 h-12 text-slate-600" />
              </div>
            )}

            {enrolled ? (
              <div className="space-y-2">
                <p className="text-emerald-400 text-sm font-medium text-center mb-3">Ya estás inscrito en este curso</p>
                {modules.length > 0 && modules[0].lessons && modules[0].lessons.length > 0 && (
                  <button
                    onClick={() => navigate({ name: 'lesson', lessonId: (modules[0].lessons as any[])[0].id, courseId })}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {overallProgress > 0 ? 'Continuar' : 'Comenzar curso'}
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition"
              >
                {enrolling ? 'Inscribiendo...' : 'Inscribirse gratis'}
              </button>
            )}

            {course.tags && course.tags.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-slate-500 mb-2">Temas</p>
                <div className="flex flex-wrap gap-1">
                  {course.tags.map(tag => (
                    <span key={tag} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
