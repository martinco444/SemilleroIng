import React, { useState } from 'react';
import { MemberRole, AccountRequest } from '../types';
import { api, ApiError } from '../services/api';
import type { AuthResponse, LeadershipAccount } from '../services/api';
import {
  X,
  Lock,
  ArrowRight,
  Shield,
  Clock,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  leadershipAccounts: LeadershipAccount[];
  onAuthSuccess: (auth: AuthResponse) => void;
  onRegisterSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  leadershipAccounts,
  onAuthSuccess,
  onRegisterSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'claim'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Registration form fields
  const [name, setName] = useState('');
  const [role, setRole] = useState<MemberRole>('Estudiante Semillerista');
  const [program, setProgram] = useState('Ingeniería de Sistemas');
  const [studentCode, setStudentCode] = useState('');
  const [motivation, setMotivation] = useState('');

  // Status states
  const [submittedRequest, setSubmittedRequest] = useState<AccountRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setSubmittedRequest(null);
    setErrorMessage('');
    setPassword('');
    setConfirmPassword('');
    setMode('login');
    onClose();
  };

  const handleSelectLeadershipEmail = (profile: LeadershipAccount) => {
    setErrorMessage('');
    setEmail(profile.email);
    setPassword('');
    setConfirmPassword('');
    setMode(profile.needsPasswordSetup ? 'claim' : 'login');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setErrorMessage('Por favor ingresa tu correo institucional.');
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = await api.login(trimmedEmail, password);
      onAuthSuccess(auth);
      resetAndClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'NEEDS_PASSWORD_SETUP') {
        setPassword('');
        setConfirmPassword('');
        setMode('claim');
        setErrorMessage(err.message);
      } else {
        setErrorMessage(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setIsSubmitting(true);
    try {
      const auth = await api.claimPassword(email.trim().toLowerCase(), password);
      onAuthSuccess(auth);
      resetAndClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'No se pudo configurar la contraseña inicial.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Por favor ingresa tu nombre completo.');
      return;
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@(?:correo\.)?usbcali\.edu\.co$/i.test(normalizedEmail)) {
      setErrorMessage(
        'Solo se permiten correos institucionales de la USB Cali (@usbcali.edu.co o @correo.usbcali.edu.co).'
      );
      return;
    }
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { request } = await api.registerAccount({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        program,
        studentCode: studentCode.trim() || undefined,
        motivation: motivation.trim() || undefined,
      });
      setSubmittedRequest(request);
      onRegisterSuccess?.();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#0F2D59] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#EA580C] text-white flex items-center justify-center shadow-xs shrink-0">
              {mode === 'claim' ? <KeyRound className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-orange-200 uppercase tracking-wider truncate">
                Portal de Investigadores USB Cali
              </div>
              <h3 className="text-base font-bold text-white truncate">
                {mode === 'register'
                  ? 'Solicitud de Cuenta de Miembro'
                  : mode === 'claim'
                    ? 'Configurar Contraseña Inicial'
                    : 'Acceso para Miembros'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-3"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0">
          {submittedRequest ? (
            <div className="py-4 space-y-4 text-center">
              <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Pendiente de Aprobación Institucional
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  ¡Solicitud Guardada y Enviada al Director!
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed text-left bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-2">
                  Hola <strong className="text-slate-900">{submittedRequest.name}</strong>, tu solicitud como{' '}
                  <strong className="text-slate-900">{submittedRequest.role}</strong> fue registrada en la base de datos.
                  <br />
                  <br />
                  El <strong>Docente Director, Dr. Iván Mauricio Cabezas</strong>, revisará tu registro desde su panel de dirección. Una vez aprobado, podrás iniciar sesión con tu correo{' '}
                  <code className="text-[#0F2D59] font-mono text-[11px]">{submittedRequest.email}</code> y aparecerás en la sección de <strong>Miembros Activos</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={resetAndClose}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer"
              >
                Entendido, cerrar
              </button>
            </div>
          ) : (
            <>
              {/* Quick-fill institutional emails loaded dynamically from active SQLite leadership */}
              {mode !== 'register' && leadershipAccounts.length > 0 && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Cuentas de Dirección</span>
                    <span className="text-[10px] text-slate-500">Seleccionar correo</span>
                  </div>
                  <div className="space-y-1.5">
                    {leadershipAccounts.map((profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => handleSelectLeadershipEmail(profile)}
                        className="w-full px-3 py-2 text-left bg-white hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-lg flex items-center justify-between transition-colors group cursor-pointer text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-md bg-linear-to-br ${profile.color} text-white font-bold text-xs flex items-center justify-center shrink-0`}
                          >
                            {profile.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 group-hover:text-[#0F2D59] truncate">
                              {profile.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {profile.role}
                              {profile.needsPasswordSetup ? ' · Pendiente configurar clave' : ''}
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0F2D59] shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* FIRST-RUN PASSWORD SETUP FORM */}
              {mode === 'claim' && (
                <form onSubmit={handleClaimPasswordSubmit} className="space-y-3.5">
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-[11px] text-blue-950 flex items-start gap-2">
                    <KeyRound className="w-4 h-4 text-[#0F2D59] shrink-0 mt-0.5" />
                    <div>
                      <strong>Configuración única de contraseña:</strong> Esta cuenta aprobada aún no tiene una clave registrada en SQLite. Define tu contraseña para activar el acceso seguro.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correo Institucional
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nueva Contraseña (mínimo 6 caracteres)
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Confirmar Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] disabled:opacity-60 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>{isSubmitting ? 'Guardando...' : 'Guardar Contraseña e Ingresar'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    Volver al inicio de sesión
                  </button>
                </form>
              )}

              {/* REGISTRATION FORM */}
              {mode === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3">
                  <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
                    <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Nota de Aprobación: </strong>
                      Tu cuenta será enviada al <strong>Docente Director, Dr. Iván Mauricio Cabezas</strong>, quien validará tu solicitud antes de otorgar acceso.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ej. Andrés Felipe Morales Castro"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correo Institucional USB Cali *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.usbcali.edu.co"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Programa Académico
                      </label>
                      <input
                        type="text"
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                        placeholder="Ingeniería de Sistemas"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Código Estudiantil
                      </label>
                      <input
                        type="text"
                        value={studentCode}
                        onChange={(e) => setStudentCode(e.target.value)}
                        placeholder="300000xxxxx"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Rol Solicitado
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as MemberRole)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    >
                      <option value="Estudiante Semillerista">Estudiante Semillerista</option>
                      <option value="Estudiante Investigador Líder">Estudiante Investigador Líder</option>
                      <option value="Docente Investigador">Docente Investigador</option>
                      <option value="Egresado Mentor">Egresado Mentor</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contraseña (mínimo 6 caracteres) *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Motivación / Área de Interés (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={motivation}
                      onChange={(e) => setMotivation(e.target.value)}
                      placeholder="Breve mención del área de ingeniería en la que deseas formular proyectos..."
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#EA580C] hover:bg-[#C2410C] disabled:opacity-60 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>{isSubmitting ? 'Enviando...' : 'Enviar Solicitud a Dr. Cabezas'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* LOGIN FORM */}
              {mode === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Correo Institucional USB Cali
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@usbcali.edu.co o @correo.usbcali.edu.co"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] disabled:opacity-60 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>{isSubmitting ? 'Verificando...' : 'Iniciar Sesión de Miembro'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* Toggle Register / Login */}
              {mode !== 'claim' && (
                <div className="text-center pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setMode(mode === 'register' ? 'login' : 'register');
                      setErrorMessage('');
                      setPassword('');
                    }}
                    className="text-xs text-[#0F2D59] hover:underline font-semibold cursor-pointer"
                  >
                    {mode === 'register'
                      ? '¿Ya tienes cuenta aprobada? Iniciar Sesión'
                      : '¿Nuevo en el semillero? Solicitar cuenta con aprobación del Director'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
