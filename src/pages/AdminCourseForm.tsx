import React, { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Save, Upload, BookOpen, Video, HelpCircle, ChevronDown, ChevronUp, Loader2, Check, X, Image as ImageIcon } from 'lucide-react';

const SUGGESTED_IMAGES = [
  'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1148820/pexels-photo-1148820.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/5380642/pexels-photo-5380642.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1181673/pexels-photo-1181673.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/270360/pexels-photo-270360.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=800',
];

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { Category, Module, Lesson, Quiz, QuizQuestion, QuizOption } from '../types';

interface Props { courseId?: string }

interface ModuleForm extends Partial<Module> {
  tempId: string;
  lessons: LessonForm[];
  quiz?: QuizForm;
  isNew?: boolean;
}

interface LessonForm extends Partial<Lesson> {
  tempId: string;
  isNew?: boolean;
  uploadingVideo?: boolean;
}

interface QuizForm extends Partial<Quiz> {
  tempId: string;
  questions: QuestionForm[];
  isNew?: boolean;
}

interface QuestionForm extends Partial<QuizQuestion> {
  tempId: string;
  options: OptionForm[];
  isNew?: boolean;
}

interface OptionForm extends Partial<QuizOption> {
  tempId: string;
  isNew?: boolean;
}

function uid() { return Math.random().toString(36).slice(2); }

export default function AdminCourseForm({ courseId }: Props) {
  const { user } = useAuth();
  const { navigate, goBack } = useNavigation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!!courseId);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [instructorName, setInstructorName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [isPublished, setIsPublished] = useState(false);
  const [isRequired, setIsRequired] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tags, setTags] = useState('');
  const [modules, setModules] = useState<ModuleForm[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories(data || []));
    if (courseId) loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    const [courseRes, modulesRes] = await Promise.all([
      supabase.from('courses').select('*').eq('id', courseId).maybeSingle(),
      supabase.from('modules').select('*, lessons(*), quizzes(*, questions:quiz_questions(*, options:quiz_options(*)))').eq('course_id', courseId).order('sort_order'),
    ]);
    const c = courseRes.data;
    if (c) {
      setTitle(c.title || '');
      setDescription(c.description || '');
      setCategoryId(c.category_id || '');
      setDifficulty(c.difficulty || 'beginner');
      setInstructorName(c.instructor_name || '');
      setDurationMinutes(c.duration_minutes || 0);
      setIsPublished(c.is_published || false);
      setIsRequired(c.is_required || false);
      setThumbnailUrl(c.thumbnail_url || '');
      setTags((c.tags || []).join(', '));
    }

    const mods: ModuleForm[] = (modulesRes.data || []).map((m: any) => ({
      ...m,
      tempId: m.id,
      lessons: ((m.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order)).map((l: any) => ({
        ...l, tempId: l.id,
      })),
      quiz: m.quizzes && m.quizzes.length > 0 ? {
        ...m.quizzes[0],
        tempId: m.quizzes[0].id,
        questions: (m.quizzes[0].questions || []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((q: any) => ({
          ...q, tempId: q.id,
          options: (q.options || []).sort((a: any, b: any) => a.sort_order - b.sort_order).map((o: any) => ({ ...o, tempId: o.id })),
        })),
      } : undefined,
    }));
    setModules(mods);
    setExpandedModules(new Set(mods.map(m => m.tempId)));
    setLoading(false);
  };

  const addModule = () => {
    const tempId = uid();
    const newMod: ModuleForm = { tempId, title: 'Nuevo módulo', description: '', sort_order: modules.length, lessons: [], isNew: true };
    setModules(prev => [...prev, newMod]);
    setExpandedModules(prev => new Set([...prev, tempId]));
  };

  const updateModule = (tempId: string, field: string, value: any) => {
    setModules(prev => prev.map(m => m.tempId === tempId ? { ...m, [field]: value } : m));
  };

  const removeModule = (tempId: string) => {
    setModules(prev => prev.filter(m => m.tempId !== tempId));
  };

  const addLesson = (moduleTempId: string) => {
    const lesson: LessonForm = { tempId: uid(), title: 'Nueva lección', sort_order: 0, lesson_type: 'video', isNew: true };
    setModules(prev => prev.map(m => m.tempId === moduleTempId ? { ...m, lessons: [...m.lessons, lesson] } : m));
  };

  const updateLesson = (moduleTempId: string, lessonTempId: string, field: string, value: any) => {
    setModules(prev => prev.map(m => m.tempId === moduleTempId ? {
      ...m,
      lessons: m.lessons.map(l => l.tempId === lessonTempId ? { ...l, [field]: value } : l),
    } : m));
  };

  const removeLesson = (moduleTempId: string, lessonTempId: string) => {
    setModules(prev => prev.map(m => m.tempId === moduleTempId ? {
      ...m, lessons: m.lessons.filter(l => l.tempId !== lessonTempId),
    } : m));
  };

  const uploadVideo = async (moduleTempId: string, lessonTempId: string, file: File) => {
    updateLesson(moduleTempId, lessonTempId, 'uploadingVideo', true);
    const path = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('course-videos').upload(path, file);
    if (!error && data) {
      const url = supabase.storage.from('course-videos').getPublicUrl(path).data.publicUrl;
      updateLesson(moduleTempId, lessonTempId, 'video_url', url);
      updateLesson(moduleTempId, lessonTempId, 'video_storage_path', path);
    }
    updateLesson(moduleTempId, lessonTempId, 'uploadingVideo', false);
  };

  const addQuiz = (moduleTempId: string) => {
    setModules(prev => prev.map(m => m.tempId === moduleTempId ? {
      ...m,
      quiz: { tempId: uid(), title: 'Quiz del módulo', passing_score: 70, questions: [], isNew: true },
    } : m));
  };

  const addQuestion = (moduleTempId: string) => {
    const q: QuestionForm = {
      tempId: uid(), question_text: '', question_type: 'single', points: 1,
      sort_order: 0, isNew: true,
      options: [
        { tempId: uid(), option_text: '', is_correct: false, sort_order: 0, isNew: true },
        { tempId: uid(), option_text: '', is_correct: false, sort_order: 1, isNew: true },
      ],
    };
    setModules(prev => prev.map(m => m.tempId === moduleTempId && m.quiz ? {
      ...m, quiz: { ...m.quiz, questions: [...m.quiz.questions, q] },
    } : m));
  };

  const updateQuestion = (moduleTempId: string, qTempId: string, field: string, value: any) => {
    setModules(prev => prev.map(m => m.tempId === moduleTempId && m.quiz ? {
      ...m, quiz: {
        ...m.quiz,
        questions: m.quiz.questions.map(q => q.tempId === qTempId ? { ...q, [field]: value } : q),
      },
    } : m));
  };

  const updateOption = (moduleTempId: string, qTempId: string, optTempId: string, field: string, value: any) => {
    setModules(prev => prev.map(m => m.tempId === moduleTempId && m.quiz ? {
      ...m, quiz: {
        ...m.quiz,
        questions: m.quiz.questions.map(q => q.tempId === qTempId ? {
          ...q,
          options: q.options.map(o => o.tempId === optTempId ? { ...o, [field]: value } : o),
        } : q),
      },
    } : m));
  };

  const addOption = (moduleTempId: string, qTempId: string) => {
    setModules(prev => prev.map(m => m.tempId === moduleTempId && m.quiz ? {
      ...m, quiz: {
        ...m.quiz,
        questions: m.quiz.questions.map(q => q.tempId === qTempId ? {
          ...q,
          options: [...q.options, { tempId: uid(), option_text: '', is_correct: false, sort_order: q.options.length, isNew: true }],
        } : q),
      },
    } : m));
  };

  const removeOption = (moduleTempId: string, qTempId: string, optTempId: string) => {
    setModules(prev => prev.map(m => m.tempId === moduleTempId && m.quiz ? {
      ...m, quiz: {
        ...m.quiz,
        questions: m.quiz.questions.map(q => q.tempId === qTempId ? {
          ...q, options: q.options.filter(o => o.tempId !== optTempId),
        } : q),
      },
    } : m));
  };

  const removeQuestion = (moduleTempId: string, qTempId: string) => {
    setModules(prev => prev.map(m => m.tempId === moduleTempId && m.quiz ? {
      ...m, quiz: { ...m.quiz, questions: m.quiz.questions.filter(q => q.tempId !== qTempId) },
    } : m));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const courseData = {
      title: title.trim(),
      description: description.trim(),
      category_id: categoryId || null,
      difficulty,
      instructor_name: instructorName,
      duration_minutes: durationMinutes,
      is_published: isPublished,
      is_required: isRequired,
      thumbnail_url: thumbnailUrl,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      created_by: user?.id,
      updated_at: new Date().toISOString(),
    };

    let currentCourseId = courseId;
    if (!courseId) {
      const { data } = await supabase.from('courses').insert(courseData).select('id').single();
      currentCourseId = data?.id;
    } else {
      await supabase.from('courses').update(courseData).eq('id', courseId);
    }

    if (!currentCourseId) { setSaving(false); return; }

    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      let moduleId = mod.id;

      const moduleData = { course_id: currentCourseId, title: mod.title || '', description: mod.description || '', sort_order: i };
      if (mod.isNew || !moduleId) {
        const { data } = await supabase.from('modules').insert(moduleData).select('id').single();
        moduleId = data?.id;
      } else {
        await supabase.from('modules').update(moduleData).eq('id', moduleId);
      }
      if (!moduleId) continue;

      for (let j = 0; j < mod.lessons.length; j++) {
        const lesson = mod.lessons[j];
        const lessonData = {
          module_id: moduleId,
          course_id: currentCourseId,
          title: lesson.title || '',
          content: lesson.content || '',
          video_url: lesson.video_url || '',
          video_storage_path: lesson.video_storage_path || '',
          duration_seconds: lesson.duration_seconds || 0,
          lesson_type: lesson.lesson_type || 'video',
          sort_order: j,
          confluence_url: lesson.confluence_url || '',
          confluence_page_title: lesson.confluence_page_title || '',
        };
        if (lesson.isNew || !lesson.id) {
          await supabase.from('lessons').insert(lessonData);
        } else {
          await supabase.from('lessons').update(lessonData).eq('id', lesson.id);
        }
      }

      if (mod.quiz) {
        const quiz = mod.quiz;
        const quizData = {
          course_id: currentCourseId,
          title: quiz.title || 'Quiz',
          description: quiz.description || '',
          passing_score: quiz.passing_score || 70,
        };
        let quizId = quiz.id;
        if (quiz.isNew || !quizId) {
          const { data } = await supabase.from('quizzes').insert(quizData).select('id').single();
          quizId = data?.id;
        } else {
          await supabase.from('quizzes').update(quizData).eq('id', quizId);
        }
        if (!quizId) continue;

        for (let k = 0; k < quiz.questions.length; k++) {
          const q = quiz.questions[k];
          const qData = {
            quiz_id: quizId,
            question_text: q.question_text || '',
            question_type: q.question_type || 'single',
            explanation: q.explanation || '',
            points: q.points || 1,
            sort_order: k,
          };
          let qId = q.id;
          if (q.isNew || !qId) {
            const { data } = await supabase.from('quiz_questions').insert(qData).select('id').single();
            qId = data?.id;
          } else {
            await supabase.from('quiz_questions').update(qData).eq('id', qId);
          }
          if (!qId) continue;

          for (let l = 0; l < q.options.length; l++) {
            const opt = q.options[l];
            const optData = { question_id: qId, option_text: opt.option_text || '', is_correct: opt.is_correct || false, sort_order: l };
            if (opt.isNew || !opt.id) {
              await supabase.from('quiz_options').insert(optData);
            } else {
              await supabase.from('quiz_options').update(optData).eq('id', opt.id);
            }
          }
        }
      }
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (!courseId) navigate('admin-courses');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <button onClick={goBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{courseId ? 'Editar Curso' : 'Nuevo Curso'}</h1>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Información General</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Título del curso *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ej: Introducción a los productos de la empresa" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" placeholder="Describe el contenido del curso..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Categoría</label>
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 text-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Sin categoría</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nivel</label>
              <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)}
                className="w-full bg-slate-700/50 border border-slate-600 text-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Instructor</label>
              <input type="text" value={instructorName} onChange={e => setInstructorName(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Nombre del instructor" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Duración (minutos)</label>
              <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} min={0}
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Imagen del curso</label>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-32 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700 border border-slate-600 flex items-center justify-center">
                    {thumbnailUrl ? (
                      <img src={thumbnailUrl} alt="Miniatura" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input type="url" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="https://..." />
                    {thumbnailUrl && (
                      <button onClick={() => setThumbnailUrl('')} className="mt-1.5 text-xs text-slate-500 hover:text-red-400 transition flex items-center gap-1">
                        <X className="w-3 h-3" /> Quitar imagen
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-2">O selecciona una imagen sugerida:</p>
                  <div className="grid grid-cols-6 gap-2">
                    {SUGGESTED_IMAGES.map(url => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setThumbnailUrl(url)}
                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${thumbnailUrl === url ? 'border-green-500 ring-2 ring-green-500/30' : 'border-transparent hover:border-slate-500'}`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        {thumbnailUrl === url && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Etiquetas (separadas por coma)</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)}
                className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="react, typescript, frontend" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setIsPublished(!isPublished)} className={`w-10 h-6 rounded-full transition-all flex items-center ${isPublished ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${isPublished ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm text-slate-300">Publicado</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setIsRequired(!isRequired)} className={`w-10 h-6 rounded-full transition-all flex items-center ${isRequired ? 'bg-red-500' : 'bg-slate-600'}`}>
                <div className={`w-4 h-4 bg-white rounded-full mx-1 transition-transform ${isRequired ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm text-slate-300">Obligatorio</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Módulos y Contenido</h2>
            <button onClick={addModule} className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition">
              <Plus className="w-4 h-4" /> Agregar módulo
            </button>
          </div>

          {modules.map((mod, modIdx) => (
            <div key={mod.tempId} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/80">
                <button onClick={() => {
                  setExpandedModules(prev => {
                    const n = new Set(prev);
                    if (n.has(mod.tempId)) n.delete(mod.tempId); else n.add(mod.tempId);
                    return n;
                  });
                }} className="text-slate-400 hover:text-white transition">
                  {expandedModules.has(mod.tempId) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <input
                  type="text"
                  value={mod.title || ''}
                  onChange={e => updateModule(mod.tempId, 'title', e.target.value)}
                  className="flex-1 bg-transparent text-white text-sm font-medium outline-none placeholder-slate-500"
                  placeholder="Título del módulo"
                />
                <button onClick={() => removeModule(mod.tempId)} className="text-slate-500 hover:text-red-400 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {expandedModules.has(mod.tempId) && (
                <div className="px-4 pb-4 pt-2 space-y-3 border-t border-slate-700/50">
                  {mod.lessons.map((lesson, lessonIdx) => (
                    <div key={lesson.tempId} className="bg-slate-700/30 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Video className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={lesson.title || ''}
                          onChange={e => updateLesson(mod.tempId, lesson.tempId, 'title', e.target.value)}
                          className="flex-1 bg-transparent text-white text-sm font-medium outline-none placeholder-slate-500"
                          placeholder="Título de la lección"
                        />
                        <button onClick={() => removeLesson(mod.tempId, lesson.tempId)} className="text-slate-500 hover:text-red-400 transition">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">URL del video</label>
                          <input type="url" value={lesson.video_url || ''} onChange={e => updateLesson(mod.tempId, lesson.tempId, 'video_url', e.target.value)}
                            className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="https://..." />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">URL Confluence</label>
                          <input type="url" value={lesson.confluence_url || ''} onChange={e => updateLesson(mod.tempId, lesson.tempId, 'confluence_url', e.target.value)}
                            className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="https://wiki.empresa.com/..." />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-slate-400 mb-1 block">Título página Confluence</label>
                          <input type="text" value={lesson.confluence_page_title || ''} onChange={e => updateLesson(mod.tempId, lesson.tempId, 'confluence_page_title', e.target.value)}
                            className="w-full bg-slate-700/50 border border-slate-600 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" placeholder="Ej: Guía de instalación" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 mb-1 block">O subir video</label>
                        <input type="file" accept="video/*" className="hidden" id={`video-${lesson.tempId}`}
                          onChange={e => e.target.files?.[0] && uploadVideo(mod.tempId, lesson.tempId, e.target.files[0])} />
                        <label htmlFor={`video-${lesson.tempId}`}
                          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white cursor-pointer border border-dashed border-slate-600 hover:border-slate-500 rounded-lg px-3 py-2 transition w-fit">
                          {lesson.uploadingVideo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                          {lesson.uploadingVideo ? 'Subiendo...' : 'Subir archivo de video'}
                        </label>
                        {lesson.video_storage_path && <p className="text-xs text-emerald-400 mt-1">Video subido correctamente</p>}
                      </div>
                    </div>
                  ))}

                  {mod.quiz && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        <input
                          type="text"
                          value={mod.quiz.title || ''}
                          onChange={e => setModules(prev => prev.map(m => m.tempId === mod.tempId && m.quiz ? { ...m, quiz: { ...m.quiz, title: e.target.value } } : m))}
                          className="flex-1 bg-transparent text-amber-300 text-sm font-medium outline-none placeholder-amber-700"
                          placeholder="Título del quiz"
                        />
                        <div className="flex items-center gap-1 text-xs text-amber-400">
                          <span>Mínimo:</span>
                          <input type="number" value={mod.quiz.passing_score || 70} min={0} max={100}
                            onChange={e => setModules(prev => prev.map(m => m.tempId === mod.tempId && m.quiz ? { ...m, quiz: { ...m.quiz, passing_score: Number(e.target.value) } } : m))}
                            className="w-12 bg-transparent text-amber-300 text-xs text-right outline-none" />
                          <span>%</span>
                        </div>
                      </div>

                      {mod.quiz.questions.map((q, qIdx) => (
                        <div key={q.tempId} className="bg-slate-800/50 rounded-xl p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-5 flex-shrink-0">{qIdx + 1}.</span>
                            <input
                              type="text"
                              value={q.question_text || ''}
                              onChange={e => updateQuestion(mod.tempId, q.tempId, 'question_text', e.target.value)}
                              className="flex-1 bg-transparent text-white text-sm outline-none placeholder-slate-500"
                              placeholder="Pregunta..."
                            />
                            <select value={q.question_type} onChange={e => updateQuestion(mod.tempId, q.tempId, 'question_type', e.target.value)}
                              className="bg-slate-700 border border-slate-600 text-slate-300 text-xs rounded px-2 py-1 outline-none">
                              <option value="single">Única</option>
                              <option value="multiple">Múltiple</option>
                            </select>
                            <button onClick={() => removeQuestion(mod.tempId, q.tempId)} className="text-slate-500 hover:text-red-400 transition">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {q.options.map((opt, optIdx) => (
                            <div key={opt.tempId} className="flex items-center gap-2 ml-7">
                              <button onClick={() => {
                                if (q.question_type === 'single') {
                                  q.options.forEach(o => updateOption(mod.tempId, q.tempId, o.tempId, 'is_correct', false));
                                }
                                updateOption(mod.tempId, q.tempId, opt.tempId, 'is_correct', !opt.is_correct);
                              }}
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition ${opt.is_correct ? 'border-emerald-400 bg-emerald-400' : 'border-slate-500'}`}>
                                {opt.is_correct && <div className="w-2 h-2 bg-white rounded-full" />}
                              </button>
                              <input
                                type="text"
                                value={opt.option_text || ''}
                                onChange={e => updateOption(mod.tempId, q.tempId, opt.tempId, 'option_text', e.target.value)}
                                className="flex-1 bg-transparent text-slate-300 text-xs outline-none placeholder-slate-600"
                                placeholder={`Opción ${optIdx + 1}`}
                              />
                              <button onClick={() => removeOption(mod.tempId, q.tempId, opt.tempId)} className="text-slate-600 hover:text-red-400 transition">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <div className="flex gap-2 ml-7">
                            <button onClick={() => addOption(mod.tempId, q.tempId)} className="text-xs text-slate-500 hover:text-slate-300 transition flex items-center gap-1">
                              <Plus className="w-3 h-3" /> Agregar opción
                            </button>
                          </div>
                          <div className="ml-7">
                            <input type="text" value={q.explanation || ''} onChange={e => updateQuestion(mod.tempId, q.tempId, 'explanation', e.target.value)}
                              className="w-full bg-transparent border-b border-slate-700 text-slate-500 text-xs outline-none placeholder-slate-600 py-0.5"
                              placeholder="Explicación (opcional, se muestra si la respuesta es incorrecta)" />
                          </div>
                        </div>
                      ))}
                      <button onClick={() => addQuestion(mod.tempId)} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition ml-2">
                        <Plus className="w-3.5 h-3.5" /> Agregar pregunta
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button onClick={() => addLesson(mod.tempId)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition border border-dashed border-slate-600 hover:border-slate-500 rounded-lg px-3 py-2">
                      <Plus className="w-3.5 h-3.5" /> Agregar lección
                    </button>
                    {!mod.quiz && (
                      <button onClick={() => addQuiz(mod.tempId)} className="flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 transition border border-dashed border-amber-500/30 hover:border-amber-500/50 rounded-lg px-3 py-2">
                        <HelpCircle className="w-3.5 h-3.5" /> Agregar quiz
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {modules.length === 0 && (
            <div className="text-center py-12 border border-dashed border-slate-700 rounded-xl text-slate-500">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Agrega módulos para organizar el contenido del curso</p>
              <button onClick={addModule} className="mt-3 text-sm text-green-400 hover:text-green-300 transition">
                Agregar primer módulo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
