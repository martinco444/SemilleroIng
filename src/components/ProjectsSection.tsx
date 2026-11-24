import React, { useState, useMemo } from 'react';
import { Project, ResearchLine, AuthUser } from '../types';
import { Search, Plus, Github, FileText, Terminal, ExternalLink, X, CheckCircle2, Cpu, Lock } from 'lucide-react';

interface ProjectsSectionProps {
  projects: Project[];
  currentUser: AuthUser | null;
  activePresidentName?: string;
  onOpenNewProjectModal: () => void;
  onOpenLogin: () => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  currentUser,
  activePresidentName,
  onOpenNewProjectModal,
  onOpenLogin
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLine, setSelectedLine] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeProjectModal, setActiveProjectModal] = useState<Project | null>(null);

  const linesList: { key: string; label: string }[] = [
    { key: 'all', label: 'Todas las Líneas' },
    { key: 'Software', label: 'Software' },
    { key: 'IoT', label: 'IoT' },
    { key: 'Cloud', label: 'Cloud' },
    { key: 'Bioinformática & Salud Digital', label: 'Bioinformática' },
    { key: 'Ciberseguridad & Infraestructura Crítica', label: 'Ciberseguridad' },
    { key: 'Diseño UX/UI', label: 'Diseño UX/UI' },
    { key: 'Electrónica', label: 'Electrónica' }
  ];

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.leadResearcher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.studentTeam.some(m => m.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.technologies.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLine =
        selectedLine === 'all' || project.lineOfResearch === selectedLine;

      const matchesStatus =
        selectedStatus === 'all' || project.status === selectedStatus;

      return matchesSearch && matchesLine && matchesStatus;
    });
  }, [projects, searchQuery, selectedLine, selectedStatus]);

  return (
    <section id="proyectos" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F2D59]">
            <span>Catálogo Científico</span>
            <span aria-hidden="true">·</span>
            <span>Semillero USB Cali</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Repositorio de Proyectos de Investigación
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Soluciones aplicadas desarrolladas por estudiantes y docentes investigadores. Todos los proyectos cumplen el protocolo de empaquetado Docker de LIDIS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <button
              onClick={onOpenNewProjectModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Proyecto</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Acceso Miembros para Registrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-6 space-y-4">
        {/* Search input and status filter */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, tecnología (PyTorch, Docker...), investigador o palabras clave..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0F2D59] focus:border-transparent transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 whitespace-nowrap">Estado:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0F2D59] cursor-pointer"
            >
              <option value="all">Todos los estados</option>
              <option value="En curso">En curso</option>
              <option value="Finalizado">Finalizado</option>
              <option value="En validación">En validación</option>
            </select>
          </div>
        </div>

        {/* Lines of Research segmented buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {linesList.map((line) => (
            <button
              key={line.key}
              onClick={() => setSelectedLine(line.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                selectedLine === line.key
                  ? 'bg-[#0F2D59] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {line.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid or Blank State */}
      <div className="mt-8">
        {projects.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-xs max-w-3xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-[#0F2D59] mb-4 shadow-xs">
              <Cpu className="w-7 h-7 text-[#0F2D59]" />
            </div>

            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#EA580C] block mb-1">
              Repositorio Habilitado
            </span>

            <h3 className="text-xl font-bold text-slate-900">
              Espacio en Blanco para Nuevos Proyectos
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
              El catálogo del semillero se encuentra actualmente en blanco, disponible para que los miembros e investigadores registren y documenten sus propuestas, fichas técnicas y repositorios de código.
            </p>

            <div className="mt-6">
              {currentUser ? (
                <button
                  onClick={onOpenNewProjectModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Primer Proyecto (Miembro Activo)</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500">
                    Solo los miembros activos con sesión iniciada pueden registrar proyectos en el repositorio.
                  </p>
                  <button
                    onClick={onOpenLogin}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Iniciar Sesión como Miembro</span>
                  </button>
                </div>
              )}
            </div>

            {/* Quick guideline reminder */}
            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-left text-xs text-slate-500 max-w-lg mx-auto">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="block font-semibold text-slate-800">Líneas Temáticas</span>
                <span className="text-[11px] text-slate-500">Software, IoT, Cloud, Ciberseguridad, UX/UI y Electrónica.</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="block font-semibold text-slate-800">Dirección y Presidencia</span>
                <span className="text-[11px] text-slate-500">
                  {activePresidentName
                    ? `Dr. Iván Mauricio Cabezas & ${activePresidentName}.`
                    : 'Dr. Iván Mauricio Cabezas · Dirección del Semillero.'}
                </span>
              </div>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 p-8">
            <Cpu className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No se encontraron proyectos con los filtros seleccionados</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Intenta cambiar los términos de búsqueda o selecciona otra línea de investigación.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLine('all');
                setSelectedStatus('all');
              }}
              className="mt-4 px-3 py-1.5 text-xs text-[#0F2D59] font-semibold bg-blue-50 rounded-md hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  {/* Clean unboxed metadata with bullet separators */}
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span className="font-medium text-[#0F2D59] truncate max-w-[190px]">
                      {project.lineOfResearch}
                    </span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {project.year}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0F2D59] transition-colors line-clamp-2 leading-snug">
                    {project.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-slate-600 mt-2.5 line-clamp-3 leading-relaxed">
                    {project.summary}
                  </p>

                  {/* Metrics preview if any */}
                  {project.metrics && project.metrics.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                      {project.metrics.slice(0, 2).map((m, idx) => (
                        <div key={idx} className="bg-slate-50 p-1.5 rounded text-left">
                          <span className="block text-[10px] text-slate-500 truncate">{m.label}</span>
                          <span className="font-mono font-semibold text-xs text-slate-800">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tech stack */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {project.technologies.slice(0, 4).map((tech, i) => (
                      <span
                        key={i}
                        className="text-[11px] font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 4 && (
                      <span className="text-[11px] font-mono px-1.5 py-0.5 text-slate-500">
                        +{project.technologies.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Team details */}
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1">
                    <div className="text-slate-700">
                      <span className="text-slate-400 font-normal">Director: </span>
                      <span className="font-medium">{project.leadResearcher}</span>
                    </div>
                    <div className="text-slate-700 truncate">
                      <span className="text-slate-400 font-normal">Equipo: </span>
                      <span>{project.studentTeam.join(', ')}</span>
                    </div>
                  </div>
                </div>

                {/* Footer action bar */}
                <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    {project.dockerized && (
                      <span
                        title="Cumple lineamientos Docker LIDIS"
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 font-medium"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Docker
                      </span>
                    )}
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {project.status}
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveProjectModal(project)}
                    className="text-xs font-semibold text-[#0F2D59] hover:text-[#1E3A8A] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Ficha Técnica</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Detail Modal */}
      {activeProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 bg-[#0F2D59] text-white flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs text-orange-200 truncate">
                  <span>{activeProjectModal.lineOfResearch}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{activeProjectModal.year}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeProjectModal.status}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold mt-0.5 text-white leading-snug truncate">
                  {activeProjectModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveProjectModal(null)}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-3"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto min-h-0">
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Descripción del Proyecto
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {activeProjectModal.fullDescription}
                </p>
              </div>

              {/* Objectives */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Objetivos Específicos
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {activeProjectModal.objectives.map((obj, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-[#EA580C] font-bold mt-0.5">•</span>
                      <span>{obj}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Team and Mentors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Director de Investigación
                  </span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                    {activeProjectModal.leadResearcher}
                  </span>
                  <span className="text-[11px] text-slate-500">Docente LIDIS / USB Cali</span>
                </div>

                <div>
                  <span className="block text-[11px] font-semibold text-slate-500 uppercase">
                    Equipo de Semilleristas
                  </span>
                  <span className="text-xs font-semibold text-slate-800 mt-0.5 block">
                    {activeProjectModal.studentTeam.join(', ')}
                  </span>
                  <span className="text-[11px] text-slate-500">Estudiantes Investigadores</span>
                </div>
              </div>

              {/* Technologies */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Stack Tecnológico Empleado
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {activeProjectModal.technologies.map((t, i) => (
                    <span key={i} className="px-2.5 py-1 text-xs font-mono bg-slate-100 text-slate-800 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Docker compose snippet if available */}
              {activeProjectModal.dockerComposeSnippet && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-[#EA580C]" />
                      <span>Configuración docker-compose.yml</span>
                    </h4>
                  </div>
                  <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 leading-normal">
                    {activeProjectModal.dockerComposeSnippet}
                  </pre>
                </div>
              )}

              {/* Links */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {activeProjectModal.githubUrl && (
                  <a
                    href={activeProjectModal.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    <span>Ver Código en GitHub</span>
                  </a>
                )}
                {activeProjectModal.paperUrl && (
                  <a
                    href={activeProjectModal.paperUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F2D59] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Descargar Paper / Ficha PDF</span>
                  </a>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setActiveProjectModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
