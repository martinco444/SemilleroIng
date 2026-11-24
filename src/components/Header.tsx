import React, { useState } from 'react';
import { AuthUser } from '../types';
import { Menu, X, User as UserIcon, LogOut, LayoutDashboard, Bell, Shield } from 'lucide-react';

interface HeaderProps {
  currentUser: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenPortal: () => void;
  onOpenJoinModal: () => void;
  pendingRequestsCount?: number;
  onOpenDirectorPanel?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onOpenLogin,
  onLogout,
  onOpenPortal,
  onOpenJoinModal,
  pendingRequestsCount = 0,
  onOpenDirectorPanel
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isDirector = currentUser?.email === 'imcabezas@usbcali.edu.co' || currentUser?.role === 'Docente Director';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Banner Notice for Institutional Affiliation */}
      <div className="bg-[#0F2D59] text-white text-[11px] sm:text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-[#EA580C]">USB CALI</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="truncate">Facultad de Ingeniería · Semillero Institucional de Investigación</span>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            {isDirector && pendingRequestsCount > 0 && onOpenDirectorPanel && (
              <button
                onClick={onOpenDirectorPanel}
                className="text-amber-300 hover:text-amber-200 font-medium text-[11px] flex items-center gap-1.5 cursor-pointer bg-white/10 px-2 py-0.5 rounded-full transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping inline-block"></span>
                <span>{pendingRequestsCount} {pendingRequestsCount === 1 ? 'cuenta pendiente' : 'cuentas pendientes'} de aprobación</span>
              </button>
            )}
            <span className="hidden md:inline text-slate-300 text-[11px]">
              Campus La Umbría, Cali
            </span>
          </div>
        </div>
      </div>

      {/* Main 3-Zone Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#"
          className="flex items-center gap-2.5 text-slate-900 font-bold tracking-tight text-base sm:text-lg whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-lg bg-[#0F2D59] flex items-center justify-center text-white font-bold text-sm shadow-xs group-hover:bg-[#1E3A8A] transition-colors">
            USB
          </div>
          <div className="flex flex-col">
            <span className="leading-tight text-slate-900 group-hover:text-[#0F2D59] transition-colors">Semillero de Ingeniería</span>
            <span className="text-[11px] font-normal text-slate-500 leading-none">Universidad San Buenaventura Cali</span>
          </div>
        </a>

        {/* Zone 2: Clean Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <a href="#proyectos" className="hover:text-[#0F2D59] transition-colors whitespace-nowrap shrink-0">
            Proyectos
          </a>
          <a href="#integrantes" className="hover:text-[#0F2D59] transition-colors whitespace-nowrap shrink-0">
            Integrantes
          </a>
          <a href="#calendario" className="hover:text-[#0F2D59] transition-colors whitespace-nowrap shrink-0">
            Calendario
          </a>
          <a href="#noticias" className="hover:text-[#0F2D59] transition-colors whitespace-nowrap shrink-0">
            Noticias
          </a>
          <button
            onClick={onOpenJoinModal}
            className="hover:text-[#EA580C] text-[#C2410C] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Postularme al Semillero
          </button>
        </nav>

        {/* Zone 3: Primary Action / User Account State */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Exclusivo Docente Director: Notification Bell & Quick Button */}
          {isDirector && onOpenDirectorPanel && (
            <button
              onClick={onOpenDirectorPanel}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-semibold transition-all cursor-pointer shadow-2xs group"
              title="Panel de Aprobación de Cuentas (Exclusivo Docente Director Dr. Iván Cabezas)"
            >
              <Bell className={`w-4 h-4 ${pendingRequestsCount > 0 ? 'text-amber-700 animate-bounce' : 'text-amber-600'}`} />
              <span className="hidden sm:inline">Aprobaciones</span>
              {pendingRequestsCount > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-extrabold text-white bg-rose-600 rounded-full animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          )}

          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 pl-2.5 pr-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-left"
                aria-expanded={userDropdownOpen}
              >
                <div className={`w-7 h-7 rounded-md bg-linear-to-br ${currentUser.color} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                  {currentUser.avatarInitials}
                </div>
                <div className="hidden sm:block text-xs">
                  <div className="font-semibold text-slate-800 leading-tight truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[130px]">
                    {currentUser.role}
                  </div>
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-800">{currentUser.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] text-[#0F2D59] font-medium bg-blue-50 px-2 py-0.5 rounded">
                      {currentUser.role}
                    </span>
                  </div>

                  {/* Director-only notification panel item in dropdown */}
                  {isDirector && onOpenDirectorPanel && (
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenDirectorPanel();
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-amber-900 bg-amber-50 hover:bg-amber-100/80 flex items-center justify-between cursor-pointer font-semibold border-b border-slate-100"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-amber-700" />
                        <span>Aprobación de Cuentas</span>
                      </div>
                      {pendingRequestsCount > 0 && (
                        <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                          {pendingRequestsCount}
                        </span>
                      )}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onOpenPortal();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#0F2D59]" />
                    Portal de Investigación
                  </button>
                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] active:scale-95 rounded-lg transition-all shadow-xs cursor-pointer whitespace-nowrap shrink-0"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Acceso Miembros</span>
            </button>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <a
              href="#proyectos"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Proyectos
            </a>
            <a
              href="#integrantes"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Integrantes (Actuales y Pasados)
            </a>
            <a
              href="#calendario"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Calendario
            </a>
            <a
              href="#noticias"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Noticias
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenJoinModal();
              }}
              className="text-left px-3 py-2 rounded-lg bg-orange-50 text-[#EA580C] font-semibold"
            >
              Postularme al Semillero
            </button>
          </nav>

          {currentUser && (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              {isDirector && onOpenDirectorPanel && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenDirectorPanel();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-semibold text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-700" />
                    <span>Panel de Aprobación (Director)</span>
                  </div>
                  {pendingRequestsCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                      {pendingRequestsCount} pendientes
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPortal();
                }}
                className="w-full text-center px-4 py-2 text-xs font-semibold text-white bg-[#0F2D59] rounded-lg"
              >
                Abrir Portal de Investigación
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="w-full text-center px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 rounded-lg"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
