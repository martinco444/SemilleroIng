import React, { useState } from 'react';
import { AuthUser, Project, ResearchLog, ResearchLine, ProjectStatus } from '../types';
import { X, Clock, Plus, CheckCircle2, Shield, UserPlus } from 'lucide-react';

interface MemberPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  activePresidentName?: string;
  projects: Project[];
  researchLogs: ResearchLog[];
  onAddResearchLog: (log: ResearchLog) => void;
  onAddNewProject: (project: Project) => void;
  onOpenDirectorPanel?: () => void;
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
  onOpenDirectorPanel,
  pendingRequestsCount = 0,
  onAddActiveTestMember,
  onQuickApprovePending
}) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'new-project'>('logs');

  // Form states for adding research log
  const [logProjectId, setLogProjectId] = useState<string>(projects[0]?.id || '');
  const [logHours, setLogHours] = useState<number>(4);
  const [logSummary, setLogSummary] = useState('');
  const [logDeliverable, setLogDeliverable] = useState('');
  const [logSuccess, setLogSuccess] = useState(false);

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
