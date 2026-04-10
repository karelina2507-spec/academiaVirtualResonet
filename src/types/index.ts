export type UserRole = 'admin' | 'expert' | 'collaborator';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  role: UserRole;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  audience: 'all' | 'technical';
  level: string | null;
  sort_order: number;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  category_id: string | null;
  instructor_name: string;
  duration_minutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  is_published: boolean;
  is_required: boolean;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  modules?: Module[];
  enrollments?: Enrollment[];
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
  sort_order: number;
  created_at: string;
  lessons?: Lesson[];
  quizzes?: Quiz[];
}

export interface Lesson {
  id: string;
  module_id: string;
  course_id: string;
  title: string;
  content: string;
  video_url: string;
  video_storage_path: string;
  duration_seconds: number;
  lesson_type: 'video' | 'article' | 'mixed' | 'presentation';
  sort_order: number;
  created_at: string;
  confluence_url: string;
  confluence_page_title: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description: string;
  passing_score: number;
  time_limit_minutes: number | null;
  attempts_allowed: number;
  created_at: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  question_type: 'single' | 'multiple';
  explanation: string;
  points: number;
  sort_order: number;
  created_at: string;
  options?: QuizOption[];
}

export interface QuizOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  max_score: number;
  passed: boolean;
  answers: Record<string, string[]>;
  completed_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  completed_at: string | null;
}

export interface UserProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  course_id: string;
  completed: boolean;
  progress_percent: number;
  last_accessed: string;
}

export interface KbSpace {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  confluence_space_key: string;
  confluence_base_url: string;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  articles?: KbArticle[];
}

export interface KbArticle {
  id: string;
  space_id: string;
  title: string;
  content: string;
  confluence_page_url: string;
  tags: string[];
  author_id: string;
  is_published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  space?: KbSpace;
  author?: Profile;
}

export type PageRoute =
  | 'auth'
  | 'dashboard'
  | 'courses'
  | 'knowledge-base'
  | 'admin'
  | 'admin-courses'
  | 'admin-kb'
  | 'admin-users'
  | 'admin-categories'
  | { name: 'course-detail'; id: string }
  | { name: 'lesson'; lessonId: string; courseId: string }
  | { name: 'quiz'; quizId: string; courseId: string }
  | { name: 'kb-article'; id: string }
  | { name: 'admin-course-form'; id?: string }
  | { name: 'admin-kb-form'; id?: string };
