import React from 'react';
import { User } from 'firebase/auth';
import {
  Home,
  Scale,
  BookOpen,
  Layers,
  Calendar,
  Plus,
  Cloud,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  X,
  Dumbbell,
  CheckCircle2,
  Activity
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export type NavTab = 'progresso' | 'evolucao' | 'exercicios' | 'rotinas' | 'historico';

interface AppSidebarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  sessionsCount: number;
  onStartWorkout: () => void;
  onOpenSyncModal: () => void;
  onOpenInstallModal: () => void;
  onOpenSquatAnimation?: () => void;
  user: User | null;
  isAuthLoading: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  sessionsCount,
  onStartWorkout,
  onOpenSyncModal,
  onOpenInstallModal,
  onOpenSquatAnimation,
  user,
  isAuthLoading
}) => {
  const { t, language } = useLanguage();

  const navItems: Array<{
    id: NavTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
  }> = [
    {
      id: 'progresso',
      label: t.nav.progress.split('&')[0].trim() || 'Progresso',
      sublabel: language === 'en' ? 'Weekly stats & streaks' : language === 'es' ? 'Semana y rachas' : 'Consistência & metas',
      icon: Home
    },
    {
      id: 'evolucao',
      label: t.nav.evolution.split('&')[0].trim() || 'Evolução',
      sublabel: language === 'en' ? 'Weight, metrics & photos' : language === 'es' ? 'Peso, medidas y fotos' : 'Peso, medidas & fotos',
      icon: Scale
    },
    {
      id: 'exercicios',
      label: t.nav.exercises.split('&')[0].trim() || 'Exercícios',
      sublabel: language === 'en' ? 'Library & muscle map' : language === 'es' ? 'Biblioteca y anatomía' : 'Biblioteca & anatomia',
      icon: BookOpen
    },
    {
      id: 'rotinas',
      label: t.nav.routines || 'Rotinas',
      sublabel: language === 'en' ? 'Home workout plans' : language === 'es' ? 'Rutinas caseras' : 'Treinos prontos e fichas',
      icon: Layers
    },
    {
      id: 'historico',
      label: t.nav.history || 'Histórico',
      sublabel: language === 'en' ? 'Logged sessions' : language === 'es' ? 'Sesiones registradas' : 'Treinos anteriores',
      icon: Calendar,
      badge: sessionsCount > 0 ? sessionsCount : undefined
    }
  ];

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 select-none ${
          /* Desktop collapsed or expanded */
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          /* Mobile slide-in drawer */
          isMobileOpen
            ? 'translate-x-0 w-72 max-w-[85vw] shadow-2xl'
            : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Section: Brand + Header */}
        <div className="flex flex-col">
          {/* Header Brand */}
          <div
            className={`h-16 flex items-center border-b border-slate-800/80 px-4 ${
              isCollapsed ? 'md:justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-sm shadow-emerald-500/20">
                <Dumbbell className="w-5 h-5 stroke-[2.2]" />
              </div>
              {(!isCollapsed || isMobileOpen) && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-base font-extrabold tracking-tight text-slate-100 font-display leading-tight truncate">
                    FitHome
                  </span>
                  <span className="text-[10px] text-slate-400 leading-none truncate">
                    {language === 'en'
                      ? 'Home Fitness'
                      : language === 'es'
                      ? 'Fitness en Casa'
                      : 'Treino & Evolução'}
                  </span>
                </div>
              )}
            </div>

            {/* Desktop Collapse Toggle Button */}
            <button
              type="button"
              onClick={() => setIsCollapsed(prev => !prev)}
              title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              className="hidden md:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-all cursor-pointer"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Workout CTA Button */}
          <div className="p-3">
            {(!isCollapsed || isMobileOpen) ? (
              <button
                type="button"
                onClick={() => {
                  onStartWorkout();
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className="w-full py-2.5 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span className="truncate">{t.common.startWorkout}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onStartWorkout}
                title={t.common.startWorkout}
                className="w-12 h-12 mx-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-2 py-1 space-y-1">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              const isCompact = isCollapsed && !isMobileOpen;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  title={isCompact ? item.label : undefined}
                  className={`w-full flex items-center transition-all duration-150 rounded-xl cursor-pointer ${
                    isCompact
                      ? 'justify-center p-3 h-12'
                      : 'gap-3 px-3 py-2.5 text-left'
                  } ${
                    isActive
                      ? 'bg-emerald-500/12 text-emerald-400 font-semibold border border-emerald-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
                  }`}
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <Icon
                      className={`w-5 h-5 transition-transform ${
                        isActive ? 'text-emerald-400 scale-105' : 'text-slate-400'
                      }`}
                    />
                    {isCompact && item.badge !== undefined && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-extrabold flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {(!isCollapsed || isMobileOpen) && (
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-sm font-medium leading-tight truncate">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-500 leading-tight truncate">
                          {item.sublabel}
                        </span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-500/25 text-emerald-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 2D Biomechanics Squat Animation Trigger */}
          <div className="px-2 pt-2">
            {(!isCollapsed || isMobileOpen) ? (
              <button
                type="button"
                onClick={() => {
                  onOpenSquatAnimation?.();
                  if (isMobileOpen) setIsMobileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all group cursor-pointer"
              >
                <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
                <div className="flex flex-col text-left min-w-0">
                  <span className="truncate">Biomecânica 2D</span>
                  <span className="text-[10px] text-emerald-400/70 font-normal truncate">Agachamento (Canvas)</span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenSquatAnimation}
                title="Biomecânica 2D: Agachamento em Canvas"
                className="w-12 h-10 mx-auto rounded-xl flex items-center justify-center bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-500/30 text-emerald-400 transition-all cursor-pointer"
              >
                <Activity className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Section: Cloud Sync + PWA + Language + Collapse Hint */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          {/* Cloud Sync Status */}
          {(!isCollapsed || isMobileOpen) ? (
            <button
              type="button"
              onClick={() => {
                onOpenSyncModal();
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                user
                  ? 'bg-slate-900 hover:bg-slate-800/90 border-emerald-500/30 text-slate-300'
                  : 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}
            >
              {user ? (
                <>
                  <div className="relative shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Avatar'}
                        className="w-7 h-7 rounded-full object-cover border border-emerald-500/60"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950 animate-pulse" />
                  </div>
                  <div className="flex flex-col text-left min-w-0 flex-1">
                    <span className="text-xs font-semibold text-slate-200 truncate leading-tight">
                      {user.displayName || 'Atleta Conectado'}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t.common.cloudActive}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-left min-w-0 flex-1">
                    <span className="text-xs font-bold text-amber-200 truncate leading-tight">
                      Sincronizar Nuvem
                    </span>
                    <span className="text-[10px] text-amber-400/80 truncate leading-tight">
                      Web & Celular
                    </span>
                  </div>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenSyncModal}
              title={user ? `Conectado como ${user.displayName || 'Atleta'}` : 'Sincronizar Nuvem'}
              className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center border border-slate-800 hover:bg-slate-900 transition-all cursor-pointer relative"
            >
              {user ? (
                <div className="relative">
                  <Cloud className="w-5 h-5 text-emerald-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              ) : (
                <div className="relative">
                  <Cloud className="w-5 h-5 text-amber-400" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                </div>
              )}
            </button>
          )}

          {/* PWA Mobile Install Guide */}
          {(!isCollapsed || isMobileOpen) ? (
            <button
              type="button"
              onClick={() => {
                onOpenInstallModal();
                if (isMobileOpen) setIsMobileOpen(false);
              }}
              className="w-full px-2.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">
                {language === 'en'
                  ? 'Install on Mobile'
                  : language === 'es'
                  ? 'Instalar en Móvil'
                  : 'Instalar no Celular'}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenInstallModal}
              title={
                language === 'en'
                  ? 'Install on Mobile'
                  : language === 'es'
                  ? 'Instalar en Móvil'
                  : 'Instalar no Celular'
              }
              className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
            >
              <Smartphone className="w-5 h-5" />
            </button>
          )}

          {/* Language Selector + Expand/Collapse button for compact mode */}
          <div
            className={`flex items-center pt-1 ${
              isCollapsed && !isMobileOpen ? 'justify-center' : 'justify-between'
            }`}
          >
            <LanguageSelector />

            {/* Desktop expand/collapse trigger label */}
            {(!isCollapsed && !isMobileOpen) && (
              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors px-1 py-0.5 rounded cursor-pointer"
                title="Recolher menu lateral"
              >
                <span>Recolher</span>
                <ChevronLeft className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
