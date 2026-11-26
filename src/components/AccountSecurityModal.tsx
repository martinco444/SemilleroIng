import React, { useState, useEffect } from 'react';
import { AuthUser } from '../types';
import { X, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AccountSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<string>;
}

export const AccountSecurityModal: React.FC<AccountSecurityModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onChangePassword,
}) => {
  const [currentPwd, setCurrentPwd] = useState('');
  const [nextPwd, setNextPwd] = useState('');
  const [confirmNextPwd, setConfirmNextPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCurrentPwd('');
      setNextPwd('');
      setConfirmNextPwd('');
      setPwdError('');
      setPwdSuccess('');
      setIsUpdatingPwd(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (nextPwd.length < 6) {
      setPwdError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nextPwd !== confirmNextPwd) {
      setPwdError('La confirmación de la nueva contraseña no coincide.');
      return;
    }

    setIsUpdatingPwd(true);
    try {
      const msg = await onChangePassword(currentPwd, nextPwd);
      setPwdSuccess(msg || 'Contraseña actualizada correctamente.');
      setCurrentPwd('');
      setNextPwd('');
      setConfirmNextPwd('');
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#0F2D59] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl bg-linear-to-br ${currentUser.color} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
            >
              {currentUser.avatarInitials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-orange-200 truncate">
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>Seguridad de la Cuenta</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 truncate">
                {currentUser.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-3"
            aria-label="Cerrar ventana de seguridad"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <div className="px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-2">
            <span className="truncate font-medium text-slate-800">{currentUser.email}</span>
            <span className="shrink-0 text-[10px] font-semibold text-[#0F2D59] bg-blue-50 px-2 py-0.5 rounded">
              {currentUser.role}
            </span>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-[#0F2D59] flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-[#0F2D59] shrink-0 mt-0.5" />
            <div>
              <strong>Rotación segura de contraseña:</strong> Al actualizar tu contraseña, cualquier sesión abierta previamente en otro navegador quedará cerrada automáticamente.
            </div>
          </div>

          {pwdError && (
            <div className="p-3 bg-rose-50 text-rose-700 rounded-lg border border-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{pwdError}</span>
            </div>
          )}

          {pwdSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{pwdSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contraseña Actual *
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nueva Contraseña (mínimo 6 caracteres) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={nextPwd}
                onChange={(e) => setNextPwd(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirmar Nueva Contraseña *
              </label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmNextPwd}
                onChange={(e) => setConfirmNextPwd(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUpdatingPwd}
                className="px-5 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
              >
                {isUpdatingPwd ? 'Actualizando...' : 'Actualizar Contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
