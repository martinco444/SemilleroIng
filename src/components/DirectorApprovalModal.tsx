import React, { useState } from 'react';
import { AccountRequest, AuthUser, ContactMessage, Member, MemberRole } from '../types';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  Shield, 
  Mail, 
  GraduationCap, 
  Hash, 
  AlertCircle,
  FileText,
  UserPlus,
  Info,
  UserMinus,
  RotateCcw,
  History,
  Calendar,
  Award,
  ArrowLeftRight,
  KeyRound
} from 'lucide-react';

const ASSIGNABLE_ROLES: MemberRole[] = [
  'Presidente del Semillero',
  'Estudiante Investigador Líder',
  'Estudiante Investigadora Líder',
  'Estudiante Semillerista',
  'Docente Investigador',
  'Docente Investigadora',
  'Egresado Mentor',
];

interface DirectorApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  accountRequests: AccountRequest[];
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string, reason?: string) => void;
  onAddTestRequest?: () => void;
  members: Member[];
  approvedUsers: AuthUser[];
  onDeactivateAccount: (
    email: string,
    reasonType: 'graduado' | 'retirado' | 'desactivada',
    reasonDetails: string,
    period?: string
  ) => void;
  onReactivateAccount: (email: string) => void;
  onUpdateMemberRole?: (
    email: string,
    newRole: MemberRole,
    previousPresidentAction?: 'keep_active' | 'graduado' | 'retirado',
    previousPresidentReason?: string
  ) => Promise<void> | void;
  onResetMemberPassword?: (email: string) => Promise<string | void> | void;
  contactMessages?: ContactMessage[];
  onUpdateContactStatus?: (id: string, status: 'nuevo' | 'atendido') => Promise<void> | void;
  onAddActiveTestMember?: () => void;
  onApproveAllPending?: () => void;
}

export const DirectorApprovalModal: React.FC<DirectorApprovalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  accountRequests,
  onApproveRequest,
  onRejectRequest,
  onAddTestRequest,
  members,
  approvedUsers,
  onDeactivateAccount,
  onReactivateAccount,
  onUpdateMemberRole,
  onResetMemberPassword,
  contactMessages = [],
  onUpdateContactStatus,
  onAddActiveTestMember,
  onApproveAllPending
}) => {
  const [activeTab, setActiveTab] = useState<'pendientes' | 'miembros_activos' | 'desactivadas' | 'solicitudes' | 'mensajes'>('pendientes');
  
  // Rejection modal state
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Deactivation modal state
  const [deactivatingUserEmail, setDeactivatingUserEmail] = useState<string | null>(null);
  const [deactivationTargetName, setDeactivationTargetName] = useState('');
  const [deactivationType, setDeactivationType] = useState<'graduado' | 'retirado'>('graduado');
  const [deactivationReasonDetails, setDeactivationReasonDetails] = useState('');
  const [deactivationPeriod, setDeactivationPeriod] = useState('');

  // Role change / Presidency transfer modal state
  const [roleTargetMember, setRoleTargetMember] = useState<Member | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<MemberRole>('Estudiante Semillerista');
  const [prevPresidentAction, setPrevPresidentAction] = useState<'keep_active' | 'graduado' | 'retirado'>('keep_active');
  const [prevPresidentReason, setPrevPresidentReason] = useState('');
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [roleError, setRoleError] = useState('');

  // Password reset confirmation state
  const [resetPwdTarget, setResetPwdTarget] = useState<Member | null>(null);
  const [isResettingPwd, setIsResettingPwd] = useState(false);
  const [resetPwdError, setResetPwdError] = useState('');
  
  // Action notifications
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Verify that the user is the Docente Director
  const isDirector = currentUser?.email === 'imcabezas@usbcali.edu.co' || currentUser?.role === 'Docente Director';

  const pendingRequests = accountRequests.filter(r => r.status === 'pendiente');
  const processedRequests = accountRequests.filter(r => r.status === 'aprobada' || r.status === 'rechazada');
  const unreadContactsCount = contactMessages.filter(m => m.status === 'nuevo').length;

  // Active members in the semillero
  const activeMembers = members.filter(m => !m.status || m.status === 'activo');
  
  // Deactivated / Past members
  const deactivatedMembers = members.filter(m => m.status === 'graduado' || m.status === 'retirado' || m.status === 'inactivo');

  const handleApprove = (id: string, name: string) => {
    onApproveRequest(id);
    setActionSuccessMsg(`Cuenta de ${name} aprobada con éxito. Ahora es miembro activo del semillero.`);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  const handleConfirmReject = (id: string, name: string) => {
    onRejectRequest(id, rejectionReason || 'Requisitos académicos no cumplidos en este ciclo');
    setRejectionModalId(null);
    setRejectionReason('');
    setActionSuccessMsg(`Solicitud de ${name} ha sido rechazada.`);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  const handleOpenDeactivationModal = (member: Member) => {
    setDeactivatingUserEmail(member.email);
    setDeactivationTargetName(member.name);
    setDeactivationType('graduado');
    setDeactivationReasonDetails('Graduación satisfactoria del programa académico · USB Cali');
    setDeactivationPeriod(member.period || '2024 - 2026');
  };

  const handleConfirmDeactivation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deactivatingUserEmail) return;

    onDeactivateAccount(
      deactivatingUserEmail,
      deactivationType,
      deactivationReasonDetails || (deactivationType === 'graduado' ? 'Graduado del programa' : 'Retiro del semillero'),
      deactivationPeriod
    );

    setActionSuccessMsg(
      `Cuenta de ${deactivationTargetName} desactivada correctamente por motivo: ${
        deactivationType === 'graduado' ? 'Graduación' : 'Retiro'
      }. Su perfil ha sido trasladado al directorio de Miembros Pasados y Egresados.`
    );
    setDeactivatingUserEmail(null);
    setTimeout(() => setActionSuccessMsg(''), 5000);
  };

  const handleConfirmReactivation = (member: Member) => {
    onReactivateAccount(member.email);
    setActionSuccessMsg(`Cuenta de ${member.name} reactivada como miembro activo del semillero.`);
    setTimeout(() => setActionSuccessMsg(''), 4500);
  };

  const currentPresident = activeMembers.find(
    (m) =>
      m.role === 'Presidente del Semillero' &&
      (!roleTargetMember || m.email.toLowerCase() !== roleTargetMember.email.toLowerCase())
  );

  const handleOpenRoleModal = (member: Member) => {
    setRoleTargetMember(member);
    setSelectedNewRole(member.role);
    setPrevPresidentAction('keep_active');
    setPrevPresidentReason('');
    setRoleError('');
  };

  const handleConfirmRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleTargetMember || !onUpdateMemberRole) return;
    if (selectedNewRole === roleTargetMember.role) {
      setRoleTargetMember(null);
      return;
    }

    setIsSavingRole(true);
    setRoleError('');
    try {
      const isTransferringPresidency =
        selectedNewRole === 'Presidente del Semillero' && Boolean(currentPresident);

      await onUpdateMemberRole(
        roleTargetMember.email,
        selectedNewRole,
        isTransferringPresidency ? prevPresidentAction : undefined,
        isTransferringPresidency && prevPresidentAction !== 'keep_active'
          ? prevPresidentReason.trim() || undefined
          : undefined
      );

      if (selectedNewRole === 'Presidente del Semillero') {
        const prevNote = currentPresident
          ? prevPresidentAction === 'keep_active'
            ? ` ${currentPresident.name} continúa activo como Estudiante Investigador Líder.`
            : ` ${currentPresident.name} pasó a Miembros Pasados (${prevPresidentAction === 'graduado' ? 'Graduado' : 'Retirado'}).`
          : '';
        setActionSuccessMsg(
          `Relevo de Presidencia aplicado: ${roleTargetMember.name} es ahora el Presidente del Semillero.${prevNote}`
        );
      } else {
        setActionSuccessMsg(
          `Rol actualizado: ${roleTargetMember.name} ahora figura como ${selectedNewRole}.`
        );
      }
      setRoleTargetMember(null);
      setTimeout(() => setActionSuccessMsg(''), 5500);
    } catch (err) {
      setRoleError(
        err instanceof Error ? err.message : 'No se pudo actualizar el rol en la base de datos.'
      );
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!resetPwdTarget || !onResetMemberPassword) return;
    setIsResettingPwd(true);
    setResetPwdError('');
    try {
      const msg = await onResetMemberPassword(resetPwdTarget.email);
      setActionSuccessMsg(
        msg ||
          `Contraseña de ${resetPwdTarget.name} restablecida. Podrá configurar una clave nueva al ingresar.`
      );
      setResetPwdTarget(null);
      setTimeout(() => setActionSuccessMsg(''), 5500);
    } catch (err) {
      setResetPwdError(
        err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.'
      );
    } finally {
      setIsResettingPwd(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header - Exclusivo Docente Director */}
        <div className="px-5 sm:px-6 py-4 bg-[#0F2D59] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#EA580C] to-[#C2410C] text-white flex items-center justify-center shadow-xs shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold tracking-wider text-orange-300 uppercase bg-white/10 px-2 py-0.5 rounded">
                  Control de Dirección Académica
                </span>
                <span className="text-xs text-blue-200">Exclusivo Director</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-snug truncate mt-0.5">
                Panel de Aprobación y Gestión de Miembros
              </h2>
              <p className="text-xs text-blue-100 truncate">
                Dr. Iván Mauricio Cabezas · Docente Director Semillero de Ingeniería USB Cali
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-3"
            aria-label="Cerrar panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Guard Notice if non-director somehow opened */}
        {!isDirector ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900">Acceso Restringido</h3>
              <p className="text-xs text-slate-600 mt-1">
                Este panel de gobernanza y control de cuentas está reservado exclusivamente para el Docente Director, Dr. Iván Mauricio Cabezas.
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
            >
              Cerrar panel
            </button>
          </div>
        ) : (
          <>
            {/* Action Feedback Banner */}
            {actionSuccessMsg && (
              <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">{actionSuccessMsg}</span>
                </div>
                <button
                  onClick={() => setActionSuccessMsg('')}
                  className="text-emerald-700 hover:text-emerald-900 font-bold ml-2 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Notification Explanatory Banner */}
            <div className="bg-amber-50/80 border-b border-amber-200/60 px-6 py-3 flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-semibold">Control de Cuentas y Estado de Miembros: </span>
                Como Director puedes aprobar el ingreso de nuevos semilleristas y también <strong>desactivar cuentas</strong> cuando un estudiante culmine sus estudios por graduación o tramite su retiro. Al desactivar, el perfil se moverá automáticamente a la lista histórica de egresados/retirados.
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0 overflow-x-auto gap-2">
              <div className="flex gap-2 min-w-max">
                {/* TAB 1: PENDIENTES */}
                <button
                  onClick={() => setActiveTab('pendientes')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'pendientes'
                      ? 'bg-white border-[#0F2D59] text-[#0F2D59] shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Nuevas Solicitudes</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                    pendingRequests.length > 0
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {pendingRequests.length}
                  </span>
                </button>

                {/* TAB 2: MIEMBROS ACTIVOS / ROLES / DESACTIVACIÓN */}
                <button
                  onClick={() => setActiveTab('miembros_activos')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'miembros_activos'
                      ? 'bg-white border-[#0F2D59] text-[#0F2D59] shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Miembros Activos & Roles ({activeMembers.length})</span>
                </button>

                {/* TAB 3: EGRESADOS / DESACTIVADAS */}
                <button
                  onClick={() => setActiveTab('desactivadas')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'desactivadas'
                      ? 'bg-white border-[#0F2D59] text-[#0F2D59] shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Egresados y Retirados ({deactivatedMembers.length})</span>
                </button>

                {/* TAB 4: HISTORIAL DE SOLICITUDES */}
                <button
                  onClick={() => setActiveTab('solicitudes')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'solicitudes'
                      ? 'bg-white border-[#0F2D59] text-[#0F2D59] shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  <span>Historial ({processedRequests.length})</span>
                </button>

                {/* TAB 5: MENSAJES DE CONTACTO GENERAL */}
                <button
                  onClick={() => setActiveTab('mensajes')}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                    activeTab === 'mensajes'
                      ? 'bg-white border-[#0F2D59] text-[#0F2D59] shadow-2xs'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Contacto ({contactMessages.length})</span>
                  {unreadContactsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-[#EA580C] text-white">
                      {unreadContactsCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3 shrink-0 mb-2">
                {pendingRequests.length > 1 && onApproveAllPending && activeTab === 'pendientes' && (
                  <button
                    onClick={onApproveAllPending}
                    className="text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 cursor-pointer shadow-2xs transition-all active:scale-95"
                    title="Aprobar todas las solicitudes pendientes de una vez"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Aprobar Todas ({pendingRequests.length})</span>
                  </button>
                )}

                {onAddActiveTestMember && (
                  <button
                    onClick={onAddActiveTestMember}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 hover:underline font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    title="Crea y vincula un nuevo miembro activo directamente"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Activar miembro de prueba</span>
                  </button>
                )}

                {onAddTestRequest && (
                  <button
                    onClick={onAddTestRequest}
                    className="text-[11px] text-[#0F2D59] hover:underline font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                    title="Simula un nuevo estudiante solicitando cuenta"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Simular solicitud</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab Contents */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* TAB 1: SOLICITUDES PENDIENTES */}
              {activeTab === 'pendientes' && (
                <>
                  {pendingRequests.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        No hay solicitudes pendientes en este momento
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Todas las solicitudes de cuenta han sido procesadas. Los integrantes aprobados pasan automáticamente a la lista pública de <strong>Miembros Activos</strong>.
                      </p>
                      
                      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
                        {onAddActiveTestMember && (
                          <button
                            onClick={onAddActiveTestMember}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer shadow-2xs transition-all active:scale-95"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Crear y Activar Miembro de Prueba Ahora</span>
                          </button>
                        )}
                        {onAddTestRequest && (
                          <button
                            onClick={onAddTestRequest}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F2D59] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Generar solicitud pendiente</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingRequests.map((req) => (
                        <div
                          key={req.id}
                          className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#0F2D59] to-[#1E3A8A] text-white font-bold text-sm flex items-center justify-center shrink-0">
                                {req.name
                                  .split(' ')
                                  .map(n => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-bold text-slate-900">
                                    {req.name}
                                  </h4>
                                  {req.source === 'postulacion' ? (
                                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                      Postulación al Semillero
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold text-[#0F2D59] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                                      {req.role}
                                    </span>
                                  )}
                                  {req.researchLine && (
                                    <span className="text-[10px] font-semibold text-[#EA580C] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                                      Línea: {req.researchLine}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    Pendiente
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-500">
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="font-mono">{req.email}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{req.program}</span>
                                  </div>
                                  {req.studentCode && (
                                    <div className="flex items-center gap-1">
                                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Cód: {req.studentCode}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="text-[11px] text-slate-400 shrink-0">
                              {req.requestedAt}
                            </span>
                          </div>

                          {req.motivation && (
                            <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg text-xs text-slate-600 flex items-start gap-2">
                              <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                              <div className="space-y-1">
                                <span className="font-semibold text-slate-700 block text-[11px]">Motivación del Aspirante:</span>
                                <p className="italic">"{req.motivation}"</p>
                              </div>
                            </div>
                          )}

                          {req.skills && (
                            <div className="text-xs text-slate-700 bg-blue-50/50 border border-blue-100 rounded-lg p-2.5">
                              <span className="font-semibold text-[#0F2D59]">Tecnologías y competencias: </span>
                              <span className="font-mono text-[11px] text-slate-800">{req.skills}</span>
                            </div>
                          )}

                          {req.portfolioUrl && (
                            <div className="text-xs">
                              <a
                                href={req.portfolioUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#0F2D59] hover:underline font-mono inline-flex items-center gap-1 text-[11px] font-semibold"
                              >
                                <span>Ver Enlace GitHub / Portafolio</span>
                                <span>↗</span>
                              </a>
                            </div>
                          )}

                          {/* Action Buttons for Director */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setRejectionModalId(req.id);
                                setRejectionReason('');
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Rechazar</span>
                            </button>
                            <button
                              onClick={() => handleApprove(req.id, req.name)}
                              className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Aprobar Miembro Activo</span>
                            </button>
                          </div>

                          {/* Rejection reason inline popup */}
                          {rejectionModalId === req.id && (
                            <div className="mt-2 p-3 bg-rose-50/80 border border-rose-200 rounded-lg space-y-2">
                              <p className="text-xs font-semibold text-rose-900">
                                Motivo de rechazo de cuenta:
                              </p>
                              <input
                                type="text"
                                value={rejectionReason}
                                onChange={e => setRejectionReason(e.target.value)}
                                placeholder="Ej: No registra matrícula activa en ingeniería en el periodo actual"
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-300 rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setRejectionModalId(null)}
                                  className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleConfirmReject(req.id, req.name)}
                                  className="px-3 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded cursor-pointer"
                                >
                                  Confirmar Rechazo
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: MIEMBROS ACTIVOS, ROLES Y OPCIÓN DE DESACTIVACIÓN */}
              {activeTab === 'miembros_activos' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/70 border border-blue-200/70 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                    <UserCheck className="w-4 h-4 text-[#0F2D59] mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">Gestión de Roles, Relevo de Presidencia y Bajas Académicas: </span>
                      Desde aquí puedes cambiar el rol de cualquier miembro activo —incluyendo designar a un nuevo <strong>Presidente del Semillero</strong> con relevo automático del presidente anterior— o desactivar su cuenta por graduación o retiro.
                    </div>
                  </div>

                  <div className="space-y-3">
                    {activeMembers.map((member) => {
                      const isSelf = member.email === 'imcabezas@usbcali.edu.co';

                      return (
                        <div
                          key={member.id}
                          className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${member.avatarColor} text-white font-bold text-sm flex items-center justify-center shrink-0`}>
                              {member.initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900">
                                  {member.name}
                                </h4>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                  member.role === 'Presidente del Semillero'
                                    ? 'text-[#C2410C] bg-orange-50 border-orange-200'
                                    : 'text-[#0F2D59] bg-blue-50 border-blue-200'
                                }`}>
                                  {member.role}
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Activo
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {member.program} · <span className="font-mono text-slate-400">{member.email}</span>
                              </p>
                              {member.period && (
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  Periodo activo: {member.period}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
                            {isSelf ? (
                              <span className="px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-[#0F2D59]" />
                                Director Titular
                              </span>
                            ) : (
                              <>
                                {onUpdateMemberRole && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRoleModal(member)}
                                    className="px-3 py-1.5 text-xs font-semibold text-[#0F2D59] bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                                    title="Cambiar rol o transferir Presidencia del Semillero"
                                  >
                                    <ArrowLeftRight className="w-3.5 h-3.5 text-[#0F2D59]" />
                                    <span>Cambiar Rol</span>
                                  </button>
                                )}
                                {onResetMemberPassword && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResetPwdError('');
                                      setResetPwdTarget(member);
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                                    title="Restablecer contraseña olvidada y cerrar sesiones activas"
                                  >
                                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                                    <span>Restablecer Clave</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeactivationModal(member)}
                                  className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                                  title="Desactivar cuenta por graduación o retiro"
                                >
                                  <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Desactivar</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: EGRESADOS Y CUENTAS DESACTIVADAS */}
              {activeTab === 'desactivadas' && (
                <div className="space-y-4">
                  {deactivatedMembers.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <GraduationCap className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-700">
                        No hay cuentas desactivadas actualmente
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Cuando desactives la cuenta de un estudiante por graduación o retiro, su ficha y motivos aparecerán aquí y en el directorio público de miembros pasados.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {deactivatedMembers.map((member) => (
                        <div
                          key={member.id}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center shrink-0">
                              {member.initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm font-bold text-slate-900">
                                  {member.name}
                                </h4>
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                                  member.status === 'graduado'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}>
                                  {member.status === 'graduado' ? 'Egresado / Graduado' : 'Retirado'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {member.email} · {member.program}
                              </p>
                              {member.exitReason && (
                                <p className="text-xs text-slate-600 mt-1 font-medium">
                                  Motivo: {member.exitReason} {member.exitDate && `(${member.exitDate})`}
                                </p>
                              )}
                              {member.period && (
                                <p className="text-[11px] text-slate-400">
                                  Periodo activo: {member.period}
                                </p>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={() => handleConfirmReactivation(member)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#0F2D59] bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                            title="Reactivar cuenta en caso de reingreso o posgrado"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reactivar como Miembro Activo</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: HISTORIAL DE SOLICITUDES */}
              {activeTab === 'solicitudes' && (
                <div className="space-y-3">
                  {processedRequests.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">
                      No hay solicitudes procesadas previamente.
                    </div>
                  ) : (
                    processedRequests.map(req => (
                      <div
                        key={req.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                          req.status === 'aprobada'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center shrink-0 ${
                            req.status === 'aprobada'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {req.status === 'aprobada' ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{req.name}</div>
                            <div className="text-slate-500 flex items-center gap-2">
                              <span>{req.email}</span>
                              <span>·</span>
                              <span>{req.role}</span>
                            </div>
                            {req.rejectionReason && (
                              <div className="text-[11px] text-rose-700 mt-0.5">
                                Motivo rechazo: {req.rejectionReason}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            req.status === 'aprobada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {req.status === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                          </span>
                          {req.status === 'aprobada' && (
                            <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Miembro Activo</span>
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400">
                            {req.reviewedAt || 'Revisado por Dirección'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 5: MENSAJES DE CONTACTO GENERAL Y ALIANZAS */}
              {activeTab === 'mensajes' && (
                <div className="space-y-3">
                  {contactMessages.length === 0 ? (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <Mail className="w-9 h-9 text-slate-400 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-800">
                        No hay mensajes de contacto recibidos
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                        Las consultas enviadas desde la pestaña <strong>Contacto General & Empresas</strong> se guardarán automáticamente en SQLite y aparecerán aquí.
                      </p>
                    </div>
                  ) : (
                    contactMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-4 rounded-xl border space-y-2.5 ${
                          msg.status === 'nuevo'
                            ? 'bg-white border-orange-200 shadow-xs'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900">{msg.subject}</h4>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  msg.status === 'nuevo'
                                    ? 'bg-orange-100 text-[#C2410C]'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {msg.status === 'nuevo' ? 'Nuevo' : 'Atendido'}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-700">{msg.name}</span>
                              <span>·</span>
                              <a
                                href={`mailto:${msg.email}`}
                                className="font-mono text-[#0F2D59] hover:underline"
                              >
                                {msg.email}
                              </a>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-400 shrink-0">{msg.submittedAt}</span>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 border border-slate-200/70 rounded-lg p-3 whitespace-pre-wrap">
                          {msg.message}
                        </p>

                        {onUpdateContactStatus && (
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateContactStatus(
                                  msg.id,
                                  msg.status === 'nuevo' ? 'atendido' : 'nuevo'
                                )
                              }
                              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                                msg.status === 'nuevo'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>
                                {msg.status === 'nuevo' ? 'Marcar como Atendido' : 'Marcar como Nuevo'}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>

            {/* Modal for Deactivating Account */}
            {deactivatingUserEmail && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
                <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <UserMinus className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          Desactivar Cuenta de Miembro
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                          {deactivationTargetName} ({deactivatingUserEmail})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeactivatingUserEmail(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 ml-2"
                      aria-label="Cerrar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleConfirmDeactivation} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                    {/* Reason Selection */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Causa de la Baja / Desactivación:
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDeactivationType('graduado');
                            setDeactivationReasonDetails('Graduación satisfactoria del programa académico · USB Cali');
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            deactivationType === 'graduado'
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <GraduationCap className="w-4 h-4 text-emerald-600" />
                            <span>Graduación / Egresado</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            Culminó plan de estudios. Pasará a la red histórica de egresados.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setDeactivationType('retirado');
                            setDeactivationReasonDetails('Retiro voluntario del semillero por motivos laborales/personales');
                          }}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            deactivationType === 'retirado'
                              ? 'bg-slate-100 border-slate-500 text-slate-900 ring-2 ring-slate-400/20'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            <History className="w-4 h-4 text-slate-600" />
                            <span>Retiro Voluntario</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            No continuará en el semillero en el periodo actual.
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Period Active */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Periodo de Permanencia en el Semillero:
                      </label>
                      <input
                        type="text"
                        value={deactivationPeriod}
                        onChange={e => setDeactivationPeriod(e.target.value)}
                        placeholder="Ej: 2024 - 2026"
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59] focus:bg-white"
                      />
                    </div>

                    {/* Reason details */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nota Institucional / Logro o Causa:
                      </label>
                      <textarea
                        rows={2}
                        value={deactivationReasonDetails}
                        onChange={e => setDeactivationReasonDetails(e.target.value)}
                        placeholder="Ej: Culminación con tesis meritoria en Ingeniería de Sistemas y vinculación a la industria."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59] focus:bg-white resize-none"
                      />
                    </div>

                    <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200/70 text-[11px] text-amber-900">
                      <strong>Efecto en la plataforma:</strong> El usuario no podrá iniciar sesión activa como investigador, pero su historial y proyectos quedarán registrados en el directorio de <em>Miembros Pasados y Egresados</em>. Podrás reactivarlo en cualquier momento.
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setDeactivatingUserEmail(null)}
                        className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Confirmar Desactivación
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal for Changing Role / Presidency Transfer */}
            {roleTargetMember && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
                <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
                  <div className="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0F2D59] flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                          Cambiar Rol / Relevo de Presidencia
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                          {roleTargetMember.name} ({roleTargetMember.email})
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRoleTargetMember(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 ml-2"
                      aria-label="Cerrar"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleConfirmRoleChange} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                    {roleError && (
                      <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-200 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>{roleError}</span>
                      </div>
                    )}

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                      <span className="text-slate-500">Rol actual en SQLite:</span>
                      <span className="font-bold text-slate-900">{roleTargetMember.role}</span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Nuevo Rol Institucional
                      </label>
                      <select
                        value={selectedNewRole}
                        onChange={(e) => setSelectedNewRole(e.target.value as MemberRole)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                      >
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Presidency Transfer section if appointing a new President while another exists */}
                    {selectedNewRole === 'Presidente del Semillero' && currentPresident && (
                      <div className="p-4 bg-orange-50/80 border border-orange-200 rounded-xl space-y-3">
                        <div className="flex items-start gap-2 text-xs text-orange-950">
                          <Award className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                          <div>
                            <strong className="block">Relevo Automático de Presidencia</strong>
                            <span className="text-[11px] text-orange-900">
                              Actualmente <strong>{currentPresident.name}</strong> ocupa el cargo de Presidente del Semillero. Elige qué sucederá con su perfil al confirmar el relevo:
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                            prevPresidentAction === 'keep_active'
                              ? 'bg-white border-[#0F2D59] ring-1 ring-[#0F2D59]/30'
                              : 'bg-white/70 border-orange-200 hover:bg-white'
                          }`}>
                            <input
                              type="radio"
                              name="prevPresidentAction"
                              value="keep_active"
                              checked={prevPresidentAction === 'keep_active'}
                              onChange={() => setPrevPresidentAction('keep_active')}
                              className="mt-0.5"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                Mantener activo como Estudiante Investigador Líder
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Sigue con acceso al semillero, pero cede el cargo de Presidencia.
                              </span>
                            </div>
                          </label>

                          <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                            prevPresidentAction === 'graduado'
                              ? 'bg-white border-emerald-600 ring-1 ring-emerald-500/30'
                              : 'bg-white/70 border-orange-200 hover:bg-white'
                          }`}>
                            <input
                              type="radio"
                              name="prevPresidentAction"
                              value="graduado"
                              checked={prevPresidentAction === 'graduado'}
                              onChange={() => setPrevPresidentAction('graduado')}
                              className="mt-0.5"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                Marcar como Graduado / Egresado
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Desactiva su acceso activo y lo traslada a Miembros Pasados y Egresados.
                              </span>
                            </div>
                          </label>

                          <label className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                            prevPresidentAction === 'retirado'
                              ? 'bg-white border-slate-600 ring-1 ring-slate-500/30'
                              : 'bg-white/70 border-orange-200 hover:bg-white'
                          }`}>
                            <input
                              type="radio"
                              name="prevPresidentAction"
                              value="retirado"
                              checked={prevPresidentAction === 'retirado'}
                              onChange={() => setPrevPresidentAction('retirado')}
                              className="mt-0.5"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                Marcar como Retirado del Semillero
                              </span>
                              <span className="text-[11px] text-slate-500">
                                Finaliza su periodo activo y lo mueve al historial de Miembros Pasados.
                              </span>
                            </div>
                          </label>
                        </div>

                        {prevPresidentAction !== 'keep_active' && (
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Nota de entrega / motivo (opcional)
                            </label>
                            <input
                              type="text"
                              value={prevPresidentReason}
                              onChange={(e) => setPrevPresidentReason(e.target.value)}
                              placeholder="Ej: Culminación de periodo en la Presidencia y entrega de cargo"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setRoleTargetMember(null)}
                        className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingRole || selectedNewRole === roleTargetMember.role}
                        className="px-4 py-2 text-xs font-bold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                      >
                        {isSavingRole
                          ? 'Guardando...'
                          : selectedNewRole === 'Presidente del Semillero'
                            ? 'Confirmar Relevo de Presidencia'
                            : 'Guardar Nuevo Rol'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal for Confirming Password Reset */}
            {resetPwdTarget && (
              <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs">
                <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
                  <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          Restablecer Contraseña
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                          {resetPwdTarget.name}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetPwdTarget(null)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                      aria-label="Cerrar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-5 space-y-3.5 text-xs text-slate-600">
                    {resetPwdError && (
                      <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{resetPwdError}</span>
                      </div>
                    )}
                    <p className="leading-relaxed">
                      Al restablecer la contraseña de <strong className="text-slate-900">{resetPwdTarget.name}</strong> (<code className="font-mono text-[11px]">{resetPwdTarget.email}</code>), se cerrarán inmediatamente sus sesiones activas y deberá definir una contraseña nueva en su próximo ingreso.
                    </p>
                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setResetPwdTarget(null)}
                        className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={isResettingPwd}
                        onClick={handleConfirmResetPassword}
                        className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
                      >
                        {isResettingPwd ? 'Restableciendo...' : 'Confirmar Restablecimiento'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer with summary */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Miembros Totales:</span>
                <span>{members.length}</span>
                <span>·</span>
                <span className="text-emerald-700 font-semibold">{activeMembers.length} activos</span>
                <span>·</span>
                <span className="text-blue-700 font-semibold">{deactivatedMembers.length} egresados/retirados</span>
                <span>·</span>
                <span className="text-amber-700 font-semibold">{pendingRequests.length} solicitudes pendientes</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
