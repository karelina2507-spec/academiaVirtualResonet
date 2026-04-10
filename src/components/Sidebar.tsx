import React from 'react';
import {
  LayoutDashboard, BookOpen, GraduationCap, Database,
  ChevronRight, LogOut, Shield, Star, Users, Tag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '../contexts/NavigationContext';
import { PageRoute } from '../types';

interface NavItem {
  label: string;
  icon: React.ElementType;
  page: PageRoute;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { label: 'Cursos', icon: GraduationCap, page: 'courses' },
  { label: 'Base de Conocimiento', icon: Database, page: 'knowledge-base' },
];

const expertItems: NavItem[] = [
  { label: 'Gestionar Cursos', icon: BookOpen, page: 'admin-courses' },
];

const adminItems: NavItem[] = [
  { label: 'Gestionar Cursos', icon: BookOpen, page: 'admin-courses' },
  { label: 'Categorías', icon: Tag, page: 'admin-categories' },
  { label: 'Gestionar KB', icon: Database, page: 'admin-kb' },
  { label: 'Usuarios', icon: Users, page: 'admin-users' },
];

function isPageActive(current: PageRoute, target: PageRoute): boolean {
  if (typeof current === 'string' && typeof target === 'string') return current === target;
  if (typeof current === 'object' && typeof target === 'string') {
    if (target === 'courses' && current.name === 'course-detail') return true;
    if (target === 'courses' && current.name === 'lesson') return true;
    if (target === 'courses' && current.name === 'quiz') return true;
    if (target === 'knowledge-base' && current.name === 'kb-article') return true;
    if (target === 'admin-courses' && current.name === 'admin-course-form') return true;
    if (target === 'admin-kb' && current.name === 'admin-kb-form') return true;
  }
  return false;
}

const roleLabel: Record<string, string> = {
  admin: 'Administrador',
  expert: 'Experto',
  collaborator: 'Colaborador',
};

const roleColor: Record<string, string> = {
  admin: 'text-amber-400',
  expert: 'text-blue-400',
  collaborator: 'text-slate-400',
};

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { profile, signOut, isAdmin, isExpert } = useAuth();
  const { currentPage, navigate } = useNavigation();

  const handleNav = (page: PageRoute) => {
    navigate(page);
    onClose?.();
  };

  const managementItems = isAdmin ? adminItems : isExpert ? expertItems : [];
  const managementAccentActive = isAdmin
    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/20'
    : 'bg-blue-600/20 text-blue-400 border border-blue-500/20';

  const role = profile?.role || 'collaborator';

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-800">
        <img src="/resonet_logo.jpg" alt="Resonet" className="w-9 h-9 rounded-lg flex-shrink-0" />
        <div className="leading-tight">
          <p className="font-bold text-white text-sm">Academia Corporativa</p>
          <p className="font-semibold text-green-400 text-xs">Resonet</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">Principal</p>
        {navItems.map(item => {
          const active = isPageActive(currentPage, item.page);
          return (
            <button
              key={String(item.page)}
              onClick={() => handleNav(item.page)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? 'bg-green-600/20 text-green-400 border border-green-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3" />}
            </button>
          );
        })}

        {managementItems.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2 mt-5">
              {isAdmin ? 'Administración' : 'Gestión'}
            </p>
            {managementItems.map(item => {
              const active = isPageActive(currentPage, item.page);
              return (
                <button
                  key={String(item.page)}
                  onClick={() => handleNav(item.page)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active ? managementAccentActive : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {active && <ChevronRight className="w-3 h-3" />}
                </button>
              );
            })}
          </>
        )}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {profile?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.full_name || 'Usuario'}</p>
            <p className={`text-xs truncate flex items-center gap-1 ${roleColor[role]}`}>
              {isAdmin && <Shield className="w-3 h-3" />}
              {isExpert && <Star className="w-3 h-3" />}
              {roleLabel[role] || 'Colaborador'}
            </p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}
