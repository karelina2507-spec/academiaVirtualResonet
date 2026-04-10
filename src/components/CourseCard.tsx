import React from 'react';
import { Clock, Users, Star, ChevronRight, BookOpen, Lock } from 'lucide-react';
import { Course } from '../types';
import { useNavigation } from '../contexts/NavigationContext';

interface CourseCardProps {
  course: Course;
  progress?: number;
  enrolled?: boolean;
}

const difficultyLabel = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado' };
const difficultyColor = {
  beginner: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  intermediate: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  advanced: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export default function CourseCard({ course, progress, enrolled }: CourseCardProps) {
  const { navigate } = useNavigation();

  return (
    <div
      onClick={() => navigate({ name: 'course-detail', id: course.id })}
      className="group bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5"
    >
      <div className="relative h-40 bg-slate-700 overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${course.category?.color || '#16a34a'}30, ${course.category?.color || '#16a34a'}10)` }}>
            <BookOpen className="w-12 h-12 text-slate-600" />
          </div>
        )}
        {course.is_required && (
          <div className="absolute top-2 left-2 bg-red-500/90 text-white text-xs font-semibold px-2 py-1 rounded-md">
            Obligatorio
          </div>
        )}
        {course.category && (
          <div
            className="absolute top-2 right-2 text-white text-xs font-semibold px-2.5 py-1 rounded-md"
            style={{ backgroundColor: course.category.color + 'dd' }}
          >
            {course.category.name}
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-white text-sm line-clamp-2 group-hover:text-green-300 transition-colors mb-1">
          {course.title}
        </h3>
        {course.instructor_name && (
          <p className="text-xs text-slate-500 mb-2">por {course.instructor_name}</p>
        )}
        <p className="text-xs text-slate-400 line-clamp-2 mb-3">{course.description}</p>

        <div className="flex items-center gap-3 mb-3">
          <span className={`text-xs border px-2 py-0.5 rounded-full ${difficultyColor[course.difficulty]}`}>
            {difficultyLabel[course.difficulty]}
          </span>
          {course.duration_minutes > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock className="w-3 h-3" /> {course.duration_minutes}m
            </span>
          )}
        </div>

        {progress !== undefined && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progreso</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className={`text-xs font-medium ${enrolled ? 'text-emerald-400' : 'text-slate-500'}`}>
            {enrolled ? 'Inscrito' : 'Ver curso'}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-green-400 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </div>
  );
}
