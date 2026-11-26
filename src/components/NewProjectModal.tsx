import React, { useState, useEffect } from 'react';
import { AuthUser, Project, ResearchLine, ProjectStatus } from '../types';
import { X, Plus, CheckCircle2 } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser;
  activePresidentName?: string;
  onAddNewProject: (project: Project) => void | Promise<void>;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  activePresidentName,
  onAddNewProject,
}) => {
  const defaultStudents =
    currentUser.role === 'Docente Director' && activePresidentName
      ? activePresidentName
      : currentUser.name;

  const [newTitle, setNewTitle] = useState('');
  const [newLine, setNewLine] = useState<ResearchLine>('Software');
  const [newStatus, setNewStatus] = useState<ProjectStatus>('En curso');
  const [newSummary, setNewSummary] = useState('');
  const [newFullDesc, setNewFullDesc] = useState('');
  const [newLead, setNewLead] = useState('Dr. Iván Mauricio Cabezas');
  const [newStudents, setNewStudents] = useState(defaultStudents);
  const [newTechs, setNewTechs] = useState('Docker, React, Node.js');
  const [newGithub, setNewGithub] = useState('');
  const [newDockerized, setNewDockerized] = useState(true);
  const [projectSuccess, setProjectSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNewTitle('');
      setNewLine('Software');
      setNewStatus('En curso');
      setNewSummary('');
      setNewFullDesc('');
      setNewLead('Dr. Iván Mauricio Cabezas');
      setNewStudents(defaultStudents);
      setNewTechs('Docker, React, Node.js');
      setNewGithub('');
      setNewDockerized(true);
      setProjectSuccess(false);
    }
  }, [isOpen, defaultStudents]);

  if (!isOpen) return null;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSummary) return;

    const studentArray = newStudents
      ? newStudents.split(',').map((s) => s.trim()).filter(Boolean)
      : [currentUser.name];

    const techArray = newTechs
      ? newTechs.split(',').map((t) => t.trim()).filter(Boolean)
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
        'Documentar manual de despliegue según requerimientos LIDIS USB Cali.',
      ],
      leadResearcher: newLead,
      studentTeam: studentArray,
      technologies: techArray,
      year: new Date().getFullYear(),
      githubUrl: newGithub || 'https://github.com/lidis-usbcali',
      dockerized: newDockerized,
      dockerComposeSnippet: `services:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n    restart: unless-stopped`,
      metrics: [{ label: 'Fase', value: 'Prototipo Inicial' }],
    };

    await onAddNewProject(newProj);
    setProjectSuccess(true);
    setTimeout(() => {
      setProjectSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#0F2D59] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-orange-200 truncate">
                Repositorio de Proyectos · {currentUser.name}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 truncate">
                Registrar Nuevo Proyecto de Investigación
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-3"
            aria-label="Cerrar formulario de proyecto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
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
                onChange={(e) => setNewTitle(e.target.value)}
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
                  onChange={(e) => setNewLine(e.target.value as ResearchLine)}
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
                  onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
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
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Breve descripción del problema y propuesta de solución técnica..."
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción Detallada (Opcional)
              </label>
              <textarea
                rows={2}
                value={newFullDesc}
                onChange={(e) => setNewFullDesc(e.target.value)}
                placeholder="Alcance técnico, arquitectura y resultados esperados..."
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
                  onChange={(e) => setNewLead(e.target.value)}
                  placeholder="Dr. Iván Mauricio Cabezas / Docente a cargo"
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
                  onChange={(e) => setNewStudents(e.target.value)}
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
                  onChange={(e) => setNewTechs(e.target.value)}
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
                  onChange={(e) => setNewGithub(e.target.value)}
                  placeholder="https://github.com/lidis-usbcali/..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newDockerized}
                  onChange={(e) => setNewDockerized(e.target.checked)}
                  className="rounded text-[#0F2D59] focus:ring-[#0F2D59]"
                />
                <span>Arquitectura modular para contenedor Docker</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer"
                >
                  Publicar Proyecto
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
