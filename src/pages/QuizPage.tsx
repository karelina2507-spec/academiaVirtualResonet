import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Trophy, CheckCircle, XCircle, ChevronRight, ChevronLeft,
  AlertCircle, RefreshCw, Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { Quiz, QuizQuestion, QuizOption } from '../types';

interface Props { quizId: string; courseId: string }

type QuizState = 'loading' | 'intro' | 'taking' | 'result';

export default function QuizPage({ quizId, courseId }: Props) {
  const { user } = useAuth();
  const { navigate } = useNavigation();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [state, setState] = useState<QuizState>('loading');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<{ score: number; maxScore: number; passed: boolean; details: any[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadQuiz(); }, [quizId]);

  const loadQuiz = async () => {
    const [quizRes, questionsRes] = await Promise.all([
      supabase.from('quizzes').select('*').eq('id', quizId).maybeSingle(),
      supabase.from('quiz_questions').select('*, options:quiz_options(*)').eq('quiz_id', quizId).order('sort_order'),
    ]);
    const q: Quiz | null = quizRes.data;
    const qs: QuizQuestion[] = (questionsRes.data || []).map((q: any) => ({
      ...q,
      options: (q.options || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    }));
    setQuiz(q);
    setQuestions(qs);
    setState('intro');
  };

  const selectOption = (questionId: string, optionId: string, isMultiple: boolean) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      if (isMultiple) {
        return { ...prev, [questionId]: current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId] };
      }
      return { ...prev, [questionId]: [optionId] };
    });
  };

  const submitQuiz = async () => {
    if (!user || !quiz) return;
    setSubmitting(true);

    let score = 0;
    let maxScore = 0;
    const details = questions.map(q => {
      const points = q.points || 1;
      maxScore += points;
      const selected = answers[q.id] || [];
      const correctIds = (q.options || []).filter((o: QuizOption) => o.is_correct).map((o: QuizOption) => o.id);
      const isCorrect = selected.length === correctIds.length && correctIds.every(id => selected.includes(id));
      if (isCorrect) score += points;
      return { question: q.question_text, isCorrect, correctIds, selectedIds: selected, explanation: q.explanation };
    });

    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentage >= (quiz.passing_score || 70);

    await supabase.from('quiz_attempts').insert({
      user_id: user.id,
      quiz_id: quizId,
      score: percentage,
      max_score: 100,
      passed,
      answers,
    });

    setResult({ score: percentage, maxScore: 100, passed, details });
    setState('result');
    setSubmitting(false);
  };

  const restart = () => {
    setAnswers({});
    setCurrentQ(0);
    setResult(null);
    setState('intro');
  };

  if (state === 'loading') return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
    </div>
  );

  if (!quiz) return <div className="p-6 text-slate-400">Quiz no encontrado</div>;

  if (state === 'intro') return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={() => navigate({ name: 'course-detail', id: courseId })} className="flex items-center gap-2 text-slate-400 hover:text-white transition mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Volver al curso
      </button>
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Trophy className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">{quiz.title}</h1>
        {quiz.description && <p className="text-slate-400 mb-6 text-sm">{quiz.description}</p>}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-700/50 rounded-xl p-3">
            <p className="text-xl font-bold text-white">{questions.length}</p>
            <p className="text-xs text-slate-400">Preguntas</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-3">
            <p className="text-xl font-bold text-white">{quiz.passing_score}%</p>
            <p className="text-xs text-slate-400">Para aprobar</p>
          </div>
          <div className="bg-slate-700/50 rounded-xl p-3">
            <p className="text-xl font-bold text-white">{quiz.attempts_allowed || '∞'}</p>
            <p className="text-xs text-slate-400">Intentos</p>
          </div>
        </div>
        <button
          onClick={() => setState('taking')}
          className="bg-amber-500 hover:bg-amber-400 text-white font-semibold px-8 py-3 rounded-xl transition shadow-lg shadow-amber-500/20"
        >
          Comenzar Quiz
        </button>
      </div>
    </div>
  );

  if (state === 'taking') {
    const q = questions[currentQ];
    const isMultiple = q.question_type === 'multiple';
    const selected = answers[q.id] || [];
    const progress = ((currentQ + 1) / questions.length) * 100;
    const isLast = currentQ === questions.length - 1;

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm text-slate-400">Pregunta {currentQ + 1} de {questions.length}</span>
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
          {isMultiple && (
            <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full mb-3 inline-block">
              Selección múltiple
            </span>
          )}
          <h2 className="text-lg font-semibold text-white mb-6">{q.question_text}</h2>
          <div className="space-y-3">
            {(q.options || []).map((opt: QuizOption) => {
              const isSelected = selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => selectOption(q.id, opt.id, isMultiple)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : 'bg-slate-700/30 border-slate-600/50 text-slate-300 hover:border-slate-500 hover:text-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-${isMultiple ? 'sm' : 'full'} border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-amber-400 bg-amber-400' : 'border-slate-500'}`}>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm">{opt.option_text}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQ(q => q - 1)}
            disabled={currentQ === 0}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white disabled:opacity-30 transition"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </button>
          {isLast ? (
            <button
              onClick={submitQuiz}
              disabled={submitting || Object.keys(answers).length < questions.length}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Enviar respuestas
            </button>
          ) : (
            <button
              onClick={() => setCurrentQ(q => q + 1)}
              disabled={!selected.length}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition"
            >
              Siguiente <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (state === 'result' && result) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className={`rounded-2xl p-8 text-center mb-6 ${result.passed ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
            {result.passed ? <Trophy className="w-10 h-10 text-emerald-400" /> : <XCircle className="w-10 h-10 text-red-400" />}
          </div>
          <h2 className={`text-2xl font-bold mb-1 ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
            {result.passed ? '¡Aprobado!' : 'No aprobado'}
          </h2>
          <p className="text-5xl font-bold text-white my-3">{result.score}%</p>
          <p className="text-slate-400 text-sm">Mínimo requerido: {quiz.passing_score}%</p>
        </div>

        <div className="space-y-3 mb-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Revisión de respuestas</h3>
          {result.details.map((detail, i) => (
            <div key={i} className={`bg-slate-800/50 border rounded-xl p-4 ${detail.isCorrect ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
              <div className="flex items-start gap-3">
                {detail.isCorrect
                  ? <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                }
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{detail.question}</p>
                  {!detail.isCorrect && detail.explanation && (
                    <div className="mt-2 flex items-start gap-2 text-xs text-slate-400 bg-slate-700/50 rounded-lg p-2.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{detail.explanation}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={restart} className="flex-1 flex items-center justify-center gap-2 border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 py-3 rounded-xl transition text-sm font-medium">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
          <button onClick={() => navigate({ name: 'course-detail', id: courseId })} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl transition text-sm font-semibold">
            Volver al curso
          </button>
        </div>
      </div>
    );
  }

  return null;
}
