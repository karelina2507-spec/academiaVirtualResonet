import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, CheckCircle, ExternalLink, ChevronLeft, ChevronRight,
  BookOpen, PlayCircle, Loader2, FileText, Monitor
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { Lesson, Module } from '../types';

interface Props { lessonId: string; courseId: string }

function isPresFile(url: string) {
  const l = url.toLowerCase();
  return l.endsWith('.pptx') || l.endsWith('.ppt') || l.endsWith('.odp');
}

export default function LessonPage({ lessonId, courseId }: Props) {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [presUrl, setPresUrl] = useState<string | null>(null);
  const [presLoading, setPresLoading] = useState(false);
  const [presError, setPresError] = useState(false);
  const [videoStorageUrl, setVideoStorageUrl] = useState<string | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => { loadLesson(); }, [lessonId]);

  useEffect(() => {
    if (!lesson) return;
    const rawUrl = lesson.video_url;
    if (!rawUrl) return;
    const isPresentation = lesson.lesson_type === 'presentation' || isPresFile(rawUrl);

    if (isPresentation) {
      if (rawUrl.startsWith('http')) {
        setPresUrl(rawUrl);
      } else {
        autoUpload(rawUrl);
      }
    } else if (lesson.lesson_type === 'video' && !rawUrl.startsWith('http')) {
      autoUploadVideo(rawUrl);
    }
  }, [lesson?.id]);

  const autoUpload = async (localPath: string) => {
    setPresLoading(true);
    setPresError(false);
    try {
      const filename = localPath.split('/').pop() || 'presentation.pptx';
      const storagePath = `shared/${filename}`;

      const resp = await fetch(localPath);
      if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
      const blob = await resp.blob();

      const { error: upErr } = await supabase.storage
        .from('course-presentations')
        .upload(storagePath, blob, {
          upsert: true,
          contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        });

      if (upErr && !upErr.message.includes('already exists') && !upErr.message.includes('The resource already exists')) {
        throw new Error(`upload error: ${upErr.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('course-presentations')
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;
      await supabase.from('lessons').update({ video_url: publicUrl }).eq('id', lesson!.id);
      setPresUrl(publicUrl);
    } catch (err) {
      console.error('autoUpload error:', err);
      setPresError(true);
    } finally {
      setPresLoading(false);
    }
  };

  const autoUploadVideo = async (localPath: string) => {
    setVideoUploading(true);
    try {
      const filename = localPath.split('/').pop() || 'video.mp4';
      const storagePath = `shared/${filename}`;

      const { data: existing } = await supabase.storage
        .from('course-videos')
        .getPublicUrl(storagePath);

      const testResp = await fetch(existing.publicUrl, { method: 'HEAD' });
      if (testResp.ok) {
        await supabase.from('lessons').update({ video_url: existing.publicUrl }).eq('id', lesson!.id);
        setVideoStorageUrl(existing.publicUrl);
        setVideoUploading(false);
        return;
      }

      const resp = await fetch(localPath);
      if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
      const blob = await resp.blob();

      const { error: upErr } = await supabase.storage
        .from('course-videos')
        .upload(storagePath, blob, {
          upsert: true,
          contentType: 'video/mp4',
        });

      if (upErr && !upErr.message.includes('already exists') && !upErr.message.includes('The resource already exists')) {
        throw new Error(`upload error: ${upErr.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('course-videos')
        .getPublicUrl(storagePath);

      await supabase.from('lessons').update({ video_url: urlData.publicUrl }).eq('id', lesson!.id);
      setVideoStorageUrl(urlData.publicUrl);
    } catch (err) {
      console.error('autoUploadVideo error:', err);
      setVideoStorageUrl(localPath);
    } finally {
      setVideoUploading(false);
    }
  };

  const loadLesson = async () => {
    setLoading(true);
    setPresUrl(null);
    setPresError(false);
    setVideoStorageUrl(null);
    setVideoUploading(false);
    const [lessonRes, modulesRes, progressRes] = await Promise.all([
      supabase.from('lessons').select('*').eq('id', lessonId).maybeSingle(),
      supabase.from('modules').select('*, lessons(*)').eq('course_id', courseId).order('sort_order'),
      user
        ? supabase.from('user_progress').select('completed').eq('user_id', user.id).eq('lesson_id', lessonId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    setLesson(lessonRes.data);
    const mods: Module[] = (modulesRes.data || []).map((m: any) => ({
      ...m,
      lessons: (m.lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));
    setModules(mods);
    setAllLessons(mods.flatMap(m => m.lessons || []));
    setCompleted(progressRes.data?.completed || false);
    setLoading(false);
  };

  const markComplete = async () => {
    if (!user || !lesson) return;
    setMarking(true);
    await supabase.from('user_progress').upsert({
      user_id: user.id,
      lesson_id: lessonId,
      course_id: courseId,
      completed: true,
      progress_percent: 100,
      last_accessed: new Date().toISOString(),
    }, { onConflict: 'user_id,lesson_id' });
    setCompleted(true);
    setMarking(false);
  };

  const currentIndex = allLessons.findIndex(l => l.id === lessonId);
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  if (loading) return (
    <div className="flex items-center justify-center h-full bg-slate-950">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
    </div>
  );

  if (!lesson) return <div className="p-6 text-slate-400">Leccion no encontrada</div>;

  const videoSrc = videoStorageUrl ||
    (lesson.video_url?.startsWith('http') ? lesson.video_url : null) ||
    (lesson.video_storage_path
      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/course-videos/${lesson.video_storage_path}`
      : null);

  const isPresentation = lesson.lesson_type === 'presentation' ||
    (lesson.video_url && isPresFile(lesson.video_url));

  const officeViewerUrl = presUrl
    ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(presUrl)}`
    : null;

  const renderContent = () => {
    if (isPresentation) {
      if (presLoading) {
        return (
          <div className="bg-slate-900 flex flex-col items-center justify-center gap-4"
            style={{ height: '56.25vw', maxHeight: 'calc(100vh - 260px)', minHeight: '320px' }}>
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-400">Preparando presentacion...</p>
          </div>
        );
      }
      if (presError) {
        return (
          <div className="bg-slate-900 flex flex-col items-center justify-center gap-4"
            style={{ height: '56.25vw', maxHeight: 'calc(100vh - 260px)', minHeight: '320px' }}>
            <Monitor className="w-12 h-12 text-slate-600" />
            <p className="text-sm text-slate-400">No se pudo cargar la presentacion</p>
            <button
              onClick={() => lesson?.video_url && autoUpload(lesson.video_url)}
              className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded-lg px-3 py-1.5 transition"
            >
              Reintentar
            </button>
          </div>
        );
      }
      if (officeViewerUrl) {
        return (
          <div className="bg-slate-900 relative"
            style={{ height: '56.25vw', maxHeight: 'calc(100vh - 260px)', minHeight: '320px' }}>
            <iframe
              key={officeViewerUrl}
              src={officeViewerUrl}
              className="w-full h-full border-0"
              title={lesson.title}
              allow="fullscreen"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        );
      }
      return (
        <div className="bg-slate-900 flex items-center justify-center"
          style={{ height: '56.25vw', maxHeight: 'calc(100vh - 260px)', minHeight: '320px' }}>
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      );
    }

    if (videoUploading) {
      return (
        <div className="bg-slate-900 aspect-video w-full flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-slate-400">Preparando video...</p>
        </div>
      );
    }

    if (videoSrc) {
      return (
        <div className="bg-black aspect-video w-full">
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            controlsList="nodownload"
            className="w-full h-full"
            onEnded={markComplete}
          />
        </div>
      );
    }

    return (
      <div className="bg-slate-900 aspect-video w-full flex items-center justify-center">
        <div className="text-center text-slate-500">
          <PlayCircle className="w-16 h-16 mx-auto mb-3 opacity-30" />
          <p>Contenido no disponible</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-800 flex-shrink-0">
          <button onClick={() => navigate({ name: 'course-detail', id: courseId })} className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isPresentation
              ? <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
              : <PlayCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />}
            <h1 className="text-sm font-medium text-white truncate">{lesson.title}</h1>
          </div>
          {completed && (
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium flex-shrink-0">
              <CheckCircle className="w-4 h-4" /> Completada
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {renderContent()}

          <div className="p-6 max-w-3xl mx-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                    isPresentation
                      ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
                      : 'bg-slate-700/50 text-slate-400 border-slate-700'
                  }`}>
                    {isPresentation ? 'Presentacion' : 'Video'}
                  </span>
                  {lesson.duration_seconds > 0 && (
                    <span className="text-sm text-slate-400">{Math.round(lesson.duration_seconds / 60)} minutos</span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-white">{lesson.title}</h2>
              </div>
              {!completed && (
                <button
                  onClick={markComplete}
                  disabled={marking}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition flex-shrink-0"
                >
                  <CheckCircle className="w-4 h-4" />
                  {marking ? 'Guardando...' : 'Marcar completada'}
                </button>
              )}
            </div>

            {lesson.content && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-6">
                {lesson.content}
              </div>
            )}

            {lesson.confluence_url && !lesson.confluence_url.toLowerCase().endsWith('.pptx') && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-300">Documentacion de referencia</p>
                    <p className="text-xs text-slate-400 mt-0.5">{lesson.confluence_page_title || 'Pagina de referencia'}</p>
                  </div>
                  <a
                    href={lesson.confluence_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition font-medium border border-blue-500/30 rounded-lg px-3 py-1.5"
                  >
                    Abrir <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                onClick={() => prevLesson && navigate({ name: 'lesson', lessonId: prevLesson.id, courseId })}
                disabled={!prevLesson}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <span className="text-xs text-slate-500">{currentIndex + 1} / {allLessons.length}</span>
              {nextLesson ? (
                <button
                  onClick={() => navigate({ name: 'lesson', lessonId: nextLesson.id, courseId })}
                  className="flex items-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => navigate({ name: 'course-detail', id: courseId })}
                  className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition"
                >
                  Finalizar <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden xl:flex w-72 flex-col bg-slate-900 border-l border-slate-800 overflow-y-auto flex-shrink-0">
        <div className="px-4 py-3 border-b border-slate-800">
          <p className="text-sm font-semibold text-white">Contenido del curso</p>
        </div>
        {modules.map(mod => (
          <div key={mod.id} className="border-b border-slate-800/50">
            <p className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider bg-slate-800/30">
              {mod.title}
            </p>
            {(mod.lessons || []).map((l: any, idx: number) => {
              const isCurrent = l.id === lessonId;
              const isPres = l.lesson_type === 'presentation' || (l.video_url && isPresFile(l.video_url));
              return (
                <button
                  key={l.id}
                  onClick={() => navigate({ name: 'lesson', lessonId: l.id, courseId })}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition text-xs ${
                    isCurrent
                      ? 'bg-blue-600/20 text-blue-300 border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isCurrent ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="flex-1 line-clamp-2">{l.title}</span>
                  {isPres
                    ? <FileText className="w-3 h-3 flex-shrink-0 opacity-50" />
                    : <PlayCircle className="w-3 h-3 flex-shrink-0 opacity-50" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
