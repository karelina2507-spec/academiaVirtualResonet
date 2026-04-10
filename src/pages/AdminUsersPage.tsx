import React, { useEffect, useState } from 'react';
import { Users, Shield, Star, User, Loader2, Search, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';

const roles: { value: UserRole; label: string; description: string; color: string; icon: React.ElementType }[] = [
  {
    value: 'collaborator',
    label: 'Colaborador',
    description: 'Puede ver cursos y responder quizzes',
    color: 'text-slate-300 bg-slate-700/50 border-slate-600',
    icon: User,
  },
  {
    value: 'expert',
    label: 'Experto',
    description: 'Puede crear cursos y agregar lecciones',
    color: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
    icon: Star,
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Acceso total a todas las funciones',
    color: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    icon: Shield,
  },
];

const roleBadge: Record<UserRole, string> = {
  collaborator: 'bg-slate-700/60 text-slate-300 border border-slate-600',
  expert: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  admin: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
};

const roleIcon: Record<UserRole, React.ElementType> = {
  collaborator: User,
  expert: Star,
  admin: Shield,
};

const roleLabel: Record<UserRole, string> = {
  collaborator: 'Colaborador',
  expert: 'Experto',
  admin: 'Administrador',
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    const handleClick = () => setOpenDropdown(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const loadProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setProfiles((data || []) as Profile[]);
    setLoading(false);
  };

  const updateRole = async (profileId: string, newRole: UserRole) => {
    if (profileId === currentUser?.id) return;
    setUpdating(profileId);
    setOpenDropdown(null);
    await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
    setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
    setUpdating(null);
  };

  const filtered = profiles.filter(p =>
    p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.department?.toLowerCase().includes(search.toLowerCase())
  );

  const counts = profiles.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Gestionar Usuarios</h1>
        <p className="text-slate-400 mt-1">Administra los perfiles y roles de los usuarios</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {roles.map(r => {
          const Icon = r.icon;
          return (
            <div key={r.value} className={`rounded-xl border p-4 ${r.color}`}>
              <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5" />
                <span className="font-semibold text-sm">{r.label}</span>
              </div>
              <p className="text-xs opacity-70 mb-3">{r.description}</p>
              <p className="text-2xl font-bold">{counts[r.value] || 0}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre o departamento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500 transition"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filtered.map(p => {
              const RoleIcon = roleIcon[p.role];
              const isSelf = p.id === currentUser?.id;
              const isOpen = openDropdown === p.id;

              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/40 transition">
                  <div className="w-9 h-9 bg-gradient-to-br from-green-600 to-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {p.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {p.full_name || 'Sin nombre'}
                      {isSelf && <span className="ml-2 text-xs text-slate-500">(tú)</span>}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{p.department || 'Sin departamento'}</p>
                  </div>

                  <div className="relative flex-shrink-0">
                    {isSelf ? (
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border ${roleBadge[p.role]}`}>
                        <RoleIcon className="w-3 h-3" />
                        {roleLabel[p.role]}
                      </span>
                    ) : (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setOpenDropdown(isOpen ? null : p.id);
                        }}
                        disabled={updating === p.id}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition hover:opacity-80 ${roleBadge[p.role]}`}
                      >
                        {updating === p.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <RoleIcon className="w-3 h-3" />
                        )}
                        {roleLabel[p.role]}
                        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {isOpen && !isSelf && (
                      <div
                        className="absolute right-0 top-full mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden"
                        onClick={e => e.stopPropagation()}
                      >
                        {roles.map(r => {
                          const Icon = r.icon;
                          const isActive = p.role === r.value;
                          return (
                            <button
                              key={r.value}
                              onClick={() => updateRole(p.id, r.value)}
                              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-700/50 ${isActive ? 'opacity-50 cursor-default' : ''}`}
                              disabled={isActive}
                            >
                              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-300" />
                              <div>
                                <p className="text-sm font-medium text-white">{r.label}</p>
                                <p className="text-xs text-slate-400">{r.description}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
