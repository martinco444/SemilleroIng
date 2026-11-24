import React, { useState } from 'react';
import { AuthUser, Project, ResearchLog, ResearchLine, ProjectStatus, CalendarEvent, NewsArticle, EventType } from '../types';
import { X, Clock, Plus, BookOpen, CheckCircle2, Shield, FileText, Send, User, Calendar, Newspaper, UserPlus, Sparkles, KeyRound, AlertCircle } from 'lucide-react';

interface MemberPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  activePresidentName?: string;
  projects: Project[];
  researchLogs: ResearchLog[];
  onAddResearchLog: (log: ResearchLog) => void;
  onAddNewProject: (project: Project) => void;
  onAddNewEvent?: (event: CalendarEvent) => void;
  onAddNewArticle?: (article: NewsArticle) => void;
  onOpenDirectorPanel?: () => void;
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<string>;
  pendingRequestsCount?: number;
  onAddActiveTestMember?: () => void;
  onQuickApprovePending?: () => void;
}

export const MemberPortalModal: React.FC<MemberPortalModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activePresidentName,
  projects,
  researchLogs,
  onAddResearchLog,
  onAddNewProject,
  onAddNewEvent,
  onAddNewArticle,
  onOpenDirectorPanel,
  onChangePassword,
  pendingRequestsCount = 0,
  onAddActiveTestMember,
  onQuickApprovePending
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'new-project' | 'new-event' | 'new-news' | 'security'>('logs');

  // Form states for adding research log
  const [logProjectId, setLogProjectId] = useState<string>(projects[0]?.id || '');
  const [logHours, setLogHours] = useState<number>(4);
  const [logSummary, setLogSummary] = useState('');
  const [logDeliverable, setLogDeliverable] = useState('');
  const [logSuccess, setLogSuccess] = useState(false);

  // Form states for event
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('Reunión Semanal');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('10:00 - 12:00');
  const [eventLocation, setEventLocation] = useState('Campus La Umbría (USB Cali) / Teams');
  const [eventDesc, setEventDesc] = useState('');
  const [eventSuccess, setEventSuccess] = useState(false);

  // Form states for news
  const [newsTitle, setNewsTitle] = useState('');
  const [newsCategory, setNewsCategory] = useState<'Convocatoria' | 'Logro Académico' | 'Evento' | 'Publicación Científica'>('Convocatoria');
  const [newsSummary, setNewsSummary] = useState('');
  const [newsSuccess, setNewsSuccess] = useState(false);

  // Form states for new project
  const [newTitle, setNewTitle] = useState('');
  const [newLine, setNewLine] = useState<ResearchLine>('Software');
  const [newStatus, setNewStatus] = useState<ProjectStatus>('En curso');
  const [newSummary, setNewSummary] = useState('');
  const [newFullDesc, setNewFullDesc] = useState('');
  const [newLead, setNewLead] = useState('Dr. Iván Mauricio Cabezas');
  const [newStudents, setNewStudents] = useState(
    currentUser.role === 'Docente Director' && activePresidentName
      ? activePresidentName
      : currentUser.name
  );
  const [newTechs, setNewTechs] = useState('Docker, React, Node.js');
  const [newGithub, setNewGithub] = useState('');
  const [newDockerized, setNewDockerized] = useState(true);
  const [projectSuccess, setProjectSuccess] = useState(false);

  // Form states for password change
  const [currentPwd, setCurrentPwd] = useState('');
  const [nextPwd, setNextPwd] = useState('');
  const [confirmNextPwd, setConfirmNextPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);

  if (!isOpen) return null;

  const userLogs = researchLogs.filter(
    l => l.memberId === currentUser.id || currentUser.role.includes('Director')
  );

  const totalHours = userLogs.reduce((acc, curr) => acc + curr.hoursSpent, 0);

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logSummary) return;

    const selectedProj = projects.find(p => p.id === logProjectId);
    const newLog: ResearchLog = {
      id: `log-${Date.now()}`,
      memberId: currentUser.id,
      memberName: currentUser.name,
      projectId: logProjectId,
      projectTitle: selectedProj ? selectedProj.title : 'Investigación General',
      date: new Date().toISOString().split('T')[0],
      hoursSpent: Number(logHours),
      summary: logSummary,
      deliverableUrl: logDeliverable || undefined,
      approved: currentUser.role.includes('Director')
    };

    onAddResearchLog(newLog);
    setLogSuccess(true);
    setTimeout(() => {
      setLogSuccess(false);
      setLogSummary('');
      setLogDeliverable('');
    }, 2000);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSummary) return;

    const studentArray = newStudents
      ? newStudents.split(',').map(s => s.trim()).filter(Boolean)
      : [currentUser.name];

    const techArray = newTechs
      ? newTechs.split(',').map(t => t.trim()).filter(Boolean)
      : ['Docker', 'Node.js', 'React'];

    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title: newTitle,
      lineOfResearch: newLine,
      status: newStatus,
      summary: newSummary,
      fullDescription: newFullDesc || newSummary,
      objectives: [
        'Desarrollar prototipo funcional aplicando metodología científica.',
        'Implementar arquitectura contenedorizada mediante Docker Compose.',
        'Documentar manual de despliegue según requerimientos LIDIS USB Cali.'
      ],
      leadResearcher: newLead,
      studentTeam: studentArray,
      technologies: techArray,
      year: new Date().getFullYear(),
      githubUrl: newGithub || 'https://github.com/lidis-usbcali',
      dockerized: newDockerized,
      dockerComposeSnippet: `services:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    restart: unless-stopped`,
      metrics: [{ label: 'Fase', value: 'Prototipo Inicial' }]
    };

    onAddNewProject(newProj);
    setProjectSuccess(true);
    setTimeout(() => {
      setProjectSuccess(false);
      // Reset
      setNewTitle('');
      setNewSummary('');
      setNewFullDesc('');
      setNewStudents('');
      setNewTechs('');
      setNewGithub('');
      setActiveTab('logs');
    }, 2000);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate || !onAddNewEvent) return;

    const event: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: eventTitle,
      type: eventType,
      date: eventDate,
      time: eventTime,
      location: eventLocation,
      mode: 'Híbrido',
      speaker: currentUser.role === 'Presidente del Semillero'
        ? `${currentUser.name} & Dr. Iván Mauricio Cabezas`
        : activePresidentName
          ? `Dr. Iván Mauricio Cabezas & ${activePresidentName}`
          : 'Dr. Iván Mauricio Cabezas',
      description: eventDesc || 'Encuentro del Semillero de Ingeniería USB Cali.',
      registrationOpen: true
    };

    onAddNewEvent(event);
    setEventSuccess(true);
    setTimeout(() => {
      setEventSuccess(false);
      setEventTitle('');
      setEventDate('');
      setEventDesc('');
      setActiveTab('logs');
    }, 2000);
  };

  const handleCreateNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle || !newsSummary || !onAddNewArticle) return;

    const article: NewsArticle = {
      id: `news-${Date.now()}`,
      title: newsTitle,
      date: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }),
      category: newsCategory,
      summary: newsSummary,
      content: [newsSummary],
      author: currentUser.name,
      readTime: '2 min de lectura',
      tags: ['Semillero', 'USB Cali']
    };

    onAddNewArticle(article);
    setNewsSuccess(true);
    setTimeout(() => {
      setNewsSuccess(false);
      setNewsTitle('');
      setNewsSummary('');
      setActiveTab('logs');
    }, 2000);
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onChangePassword) return;
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
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header with User Info */}
        <div className="px-5 sm:px-6 py-4 bg-[#0F2D59] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${currentUser.color} text-white font-bold text-sm sm:text-base flex items-center justify-center shrink-0 shadow-xs`}>
              {currentUser.avatarInitials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-orange-200 truncate">
                <span>{currentUser.role}</span>
                <span aria-hidden="true">·</span>
                <span className="truncate">{currentUser.program}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 truncate">
                Portal de Miembro Activo · {currentUser.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-3"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Director Notice & Quick Link to Approval Panel */}
        {(currentUser.role === 'Docente Director' || currentUser.email === 'imcabezas@usbcali.edu.co') && onOpenDirectorPanel && (
          <div className="bg-amber-50/90 px-5 sm:px-6 py-2.5 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 text-xs text-amber-950">
              <Shield className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>Atención Director: </strong>
                {pendingRequestsCount > 0 
                  ? `Tienes ${pendingRequestsCount} ${pendingRequestsCount === 1 ? 'solicitud de cuenta pendiente' : 'solicitudes de cuentas pendientes'} por aprobar.`
                  : 'No hay solicitudes de ingreso pendientes.'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {pendingRequestsCount > 0 && onQuickApprovePending && (
                <button
                  type="button"
                  onClick={onQuickApprovePending}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Aprueba la primera solicitud pendiente de inmediato"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aprobar Solicitud Ahora</span>
                </button>
              )}
              {onAddActiveTestMember && (
                <button
                  type="button"
                  onClick={() => {
                    onAddActiveTestMember();
                  }}
                  className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded-md shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                  title="Crea y vincula un nuevo miembro de prueba al semillero"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-700" />
                  <span>+ Activar Miembro de Prueba</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDirectorPanel();
                }}
                className="px-3 py-1 bg-[#0F2D59] hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-md shadow-2xs cursor-pointer whitespace-nowrap transition-colors"
              >
                Gestión de Cuentas y Miembros {pendingRequestsCount > 0 ? `(${pendingRequestsCount})` : ''}
              </button>
            </div>
          </div>
        )}

        {/* Tab Bar for Active Members */}
        <div className="flex flex-wrap border-b border-slate-200 bg-slate-50 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 py-3 px-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'logs'
                ? 'bg-white text-[#0F2D59] border-b-2 border-[#0F2D59]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Bitácoras ({totalHours}h)</span>
          </button>

          <button
            onClick={() => setActiveTab('new-project')}
            className={`flex-1 py-3 px-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'new-project'
                ? 'bg-white text-[#0F2D59] border-b-2 border-[#0F2D59]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Proyecto</span>
          </button>

          <button
            onClick={() => setActiveTab('new-event')}
            className={`flex-1 py-3 px-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'new-event'
                ? 'bg-white text-[#0F2D59] border-b-2 border-[#0F2D59]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Programar Evento</span>
          </button>

          <button
            onClick={() => setActiveTab('new-news')}
            className={`flex-1 py-3 px-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'new-news'
                ? 'bg-white text-[#0F2D59] border-b-2 border-[#0F2D59]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Newspaper className="w-4 h-4" />
            <span>Publicar Noticia</span>
          </button>

          {onChangePassword && (
            <button
              onClick={() => {
                setActiveTab('security');
                setPwdError('');
                setPwdSuccess('');
              }}
              className={`flex-1 py-3 px-2 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'security'
                  ? 'bg-white text-[#0F2D59] border-b-2 border-[#0F2D59]'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Seguridad</span>
            </button>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto min-h-0">
          
          {/* TAB 1: RESEARCH LOGS */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              
              {/* Summary strip */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Horas Reportadas</span>
                  <span className="font-mono font-bold text-lg text-[#0F2D59] tabular-nums">{totalHours} horas</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Bitácoras Activas</span>
                  <span className="font-mono font-bold text-lg text-slate-800 tabular-nums">{userLogs.length}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Estado Semillero</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">Al Día</span>
                </div>
              </div>

              {/* Add Log Form */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Registrar Avance / Horas de Investigación
                  </h4>
                  {logSuccess && (
                    <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ¡Bitácora guardada!
                    </span>
                  )}
                </div>

                <form onSubmit={handleCreateLog} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Proyecto Asociado
                      </label>
                      <select
                        value={logProjectId}
                        onChange={e => setLogProjectId(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                      >
                        {projects.length > 0 ? (
                          projects.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))
                        ) : (
                          <option value="general">Investigación Formativa Inicial (Semillero)</option>
                        )}
                      </select>
                      {projects.length === 0 && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Tip: Puedes dar de alta el primer proyecto en la pestaña "Registrar Nuevo Proyecto".
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Horas dedicadas
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        required
                        value={logHours}
                        onChange={e => setLogHours(Number(e.target.value))}
                        className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Actividades desarrolladas y avances concretos *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={logSummary}
                      onChange={e => setLogSummary(e.target.value)}
                      placeholder="Ej. Implementación de servicio de inferencia con Docker, pruebas con dataset del MIO en Calle 5ta..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Enlace de Entregable / Commit de GitHub (Opcional)
                    </label>
                    <input
                      type="url"
                      value={logDeliverable}
                      onChange={e => setLogDeliverable(e.target.value)}
                      placeholder="https://github.com/lidis-usbcali/commit/..."
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer"
                    >
                      Guardar en Bitácora
                    </button>
                  </div>
                </form>
              </div>

              {/* Historical logs table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Historial de Entradas Registradas
                </h4>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                  {userLogs.map(log => (
                    <div key={log.id} className="p-3.5 space-y-1 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">{log.projectTitle}</span>
                        <span className="font-mono tabular-nums text-slate-500">{log.date} · {log.hoursSpent}h</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {log.summary}
                      </p>
                      {log.deliverableUrl && (
                        <a
                          href={log.deliverableUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-mono text-[#0F2D59] hover:underline inline-block pt-1"
                        >
                          Ver entregable vinculado →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: REGISTER NEW PROJECT */}
          {activeTab === 'new-project' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-[#0F2D59]">
                Los proyectos propuestos se integrarán al repositorio oficial del semillero una vez registrados y contarán con ficha técnica descargable.
              </div>

              {projectSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ¡Proyecto agregado exitosamente al repositorio del semillero!
                </div>
              )}

              <form onSubmit={handleCreateProject} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título del Proyecto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ej. USB-Vision: Sistema de Detección de Anomalías..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Línea de Investigación *
                    </label>
                    <select
                      value={newLine}
                      onChange={e => setNewLine(e.target.value as ResearchLine)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    >
                      <option value="Software">Software</option>
                      <option value="IoT">IoT</option>
                      <option value="Cloud">Cloud</option>
                      <option value="Bioinformática & Salud Digital">Bioinformática & Salud Digital</option>
                      <option value="Ciberseguridad & Infraestructura Crítica">Ciberseguridad & Infraestructura Crítica</option>
                      <option value="Diseño UX/UI">Diseño UX/UI</option>
                      <option value="Electrónica">Electrónica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Estado del Proyecto
                    </label>
                    <select
                      value={newStatus}
                      onChange={e => setNewStatus(e.target.value as ProjectStatus)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    >
                      <option value="En curso">En curso</option>
                      <option value="En validación">En validación</option>
                      <option value="Finalizado">Finalizado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Resumen Ejecutivo (Summary) *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={newSummary}
                    onChange={e => setNewSummary(e.target.value)}
                    placeholder="Breve descripción del problema y propuesta de solución técnica..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Docente Director / Investigador Principal
                    </label>
                    <input
                      type="text"
                      value={newLead}
                      onChange={e => setNewLead(e.target.value)}
                      placeholder="Dr. Giovanny Hidalgo / Docente a cargo"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Equipo Estudiantil (separados por coma)
                    </label>
                    <input
                      type="text"
                      value={newStudents}
                      onChange={e => setNewStudents(e.target.value)}
                      placeholder="Ej. Juan Pérez, Valentina Soto"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tecnologías (separadas por coma)
                    </label>
                    <input
                      type="text"
                      value={newTechs}
                      onChange={e => setNewTechs(e.target.value)}
                      placeholder="React, Docker, Python, PyTorch..."
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL del Repositorio Público (GitHub / GitLab)
                    </label>
                    <input
                      type="url"
                      value={newGithub}
                      onChange={e => setNewGithub(e.target.value)}
                      placeholder="https://github.com/lidis-usbcali/..."
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newDockerized}
                      onChange={e => setNewDockerized(e.target.checked)}
                      className="rounded text-[#0F2D59] focus:ring-[#0F2D59]"
                    />
                    <span>Arquitectura modular para contenedor Docker</span>
                  </label>

                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer"
                  >
                    Publicar Proyecto
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PROGRAMAR EVENTO */}
          {activeTab === 'new-event' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-[#0F2D59]">
                Como miembro activo puedes programar sesiones académicas, talleres o reuniones en el calendario institucional del semillero.
              </div>

              {eventSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ¡Evento programado exitosamente en el calendario!
                </div>
              )}

              <form onSubmit={handleCreateEvent} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título del Evento *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    placeholder="Ej. Taller Práctico: Introducción a Modelos de Lenguaje"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tipo de Evento
                    </label>
                    <select
                      value={eventType}
                      onChange={e => setEventType(e.target.value as EventType)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    >
                      <option value="Reunión Semanal">Reunión Semanal</option>
                      <option value="Taller Técnico">Taller Técnico</option>
                      <option value="Sustentación">Sustentación</option>
                      <option value="Seminario LIDIS">Seminario Académico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Fecha del Evento *
                    </label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Horario
                    </label>
                    <input
                      type="text"
                      value={eventTime}
                      onChange={e => setEventTime(e.target.value)}
                      placeholder="10:00 - 12:00"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Lugar o Enlace
                    </label>
                    <input
                      type="text"
                      value={eventLocation}
                      onChange={e => setEventLocation(e.target.value)}
                      placeholder="Campus La Umbría / Teams"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Descripción del Evento
                  </label>
                  <textarea
                    rows={2}
                    value={eventDesc}
                    onChange={e => setEventDesc(e.target.value)}
                    placeholder="Temas de la sesión, objetivos y requerimientos para los asistentes..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer"
                  >
                    Guardar Evento en Calendario
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: PUBLICAR NOTICIA */}
          {activeTab === 'new-news' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs text-[#0F2D59]">
                Publica acuerdos, convocatorias o comunicados oficiales en la sección de noticias del semillero.
              </div>

              {newsSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ¡Noticia publicada exitosamente en el portal!
                </div>
              )}

              <form onSubmit={handleCreateNews} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título de la Noticia *
                  </label>
                  <input
                    type="text"
                    required
                    value={newsTitle}
                    onChange={e => setNewsTitle(e.target.value)}
                    placeholder="Ej. Convocatoria Semestral de Vinculación 2026"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newsCategory}
                    onChange={e => setNewsCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  >
                    <option value="Convocatoria">Convocatoria</option>
                    <option value="Logro Académico">Logro Académico</option>
                    <option value="Evento">Evento</option>
                    <option value="Publicación Científica">Publicación Científica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contenido / Comunicado *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newsSummary}
                    onChange={e => setNewsSummary(e.target.value)}
                    placeholder="Escribe el texto del comunicado oficial..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer"
                  >
                    Publicar Comunicado
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: SEGURIDAD / CAMBIO DE CONTRASEÑA */}
          {activeTab === 'security' && onChangePassword && (
            <div className="space-y-4 max-w-lg mx-auto">
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

              <form onSubmit={handlePasswordChangeSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña Actual *
                  </label>
                  <input
                    type="password"
                    required
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
                    value={confirmNextPwd}
                    onChange={(e) => setConfirmNextPwd(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>

                <div className="pt-2 flex justify-end">
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
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
          >
            Cerrar Portal
          </button>
        </div>

      </div>
    </div>
  );
};
