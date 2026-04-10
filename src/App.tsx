import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetail from './pages/CourseDetail';
import LessonPage from './pages/LessonPage';
import QuizPage from './pages/QuizPage';
import KnowledgeBase from './pages/KnowledgeBase';
import KbArticlePage from './pages/KbArticlePage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import AdminCourseForm from './pages/AdminCourseForm';
import AdminKbPage from './pages/AdminKbPage';
import AdminKbForm from './pages/AdminKbForm';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCategoriesPage from './pages/AdminCategoriesPage';

function AccessDenied() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <p className="text-slate-400 text-lg font-medium">Acceso denegado</p>
        <p className="text-slate-500 text-sm mt-1">No tienes permisos para ver esta sección</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading, isAdmin, canManageCourses } = useAuth();
  const { currentPage } = useNavigation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const renderPage = () => {
    if (typeof currentPage === 'string') {
      switch (currentPage) {
        case 'dashboard': return <Dashboard />;
        case 'courses': return <CourseCatalog />;
        case 'knowledge-base': return <KnowledgeBase />;
        case 'admin-courses': return canManageCourses ? <AdminCoursesPage /> : <AccessDenied />;
        case 'admin-kb': return isAdmin ? <AdminKbPage /> : <AccessDenied />;
        case 'admin-users': return isAdmin ? <AdminUsersPage /> : <AccessDenied />;
        case 'admin-categories': return isAdmin ? <AdminCategoriesPage /> : <AccessDenied />;
        default: return <Dashboard />;
      }
    }

    switch (currentPage.name) {
      case 'course-detail': return <CourseDetail courseId={currentPage.id} />;
      case 'lesson': return <LessonPage lessonId={currentPage.lessonId} courseId={currentPage.courseId} />;
      case 'quiz': return <QuizPage quizId={currentPage.quizId} courseId={currentPage.courseId} />;
      case 'kb-article': return <KbArticlePage articleId={currentPage.id} />;
      case 'admin-course-form': return canManageCourses ? <AdminCourseForm courseId={currentPage.id} /> : <AccessDenied />;
      case 'admin-kb-form': return isAdmin ? <AdminKbForm articleId={currentPage.id} /> : <AccessDenied />;
      default: return <Dashboard />;
    }
  };

  const isLessonPage = typeof currentPage === 'object' && currentPage.name === 'lesson';

  if (isLessonPage) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
        {renderPage()}
      </div>
    );
  }

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
}
