import React, { useState } from 'react';
import { Member } from '../types';
import { 
  Mail, 
  Linkedin, 
  Github,
  Users, 
  GraduationCap, 
  History, 
  UserCheck, 
  ShieldCheck
} from 'lucide-react';

interface MembersSectionProps {
  members: Member[];
}

export const MembersSection: React.FC<MembersSectionProps> = ({ members }) => {
  // State to toggle between 'actuales' and 'pasados'
  const [viewFilter, setViewFilter] = useState<'actuales' | 'pasados'>('actuales');

  // Active members: those without status or with status 'activo'
  const currentMembers = members.filter(
    (m) => !m.status || m.status === 'activo'
  );

  // Past members: those marked as 'graduado', 'retirado', or 'inactivo'
  const pastMembers = members.filter(
    (m) => m.status === 'graduado' || m.status === 'retirado' || m.status === 'inactivo'
  );

  return (
    <section id="integrantes" className="py-12 sm:py-16 bg-slate-100/70 border-t border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Navigation Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
              <span>Comunidad Académica</span>
              <span aria-hidden="true">·</span>
              <span>USB Cali</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Integrantes del Semillero
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Dirección, presidencia, investigadores activos y registro histórico de egresados y ex-miembros.
            </p>
          </div>

          {/* Buttons to view Current vs Past Members */}
          <div className="flex items-center p-1.5 bg-white border border-slate-300 rounded-xl shadow-2xs self-start md:self-auto shrink-0">
            <button
              onClick={() => setViewFilter('actuales')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewFilter === 'actuales'
                  ? 'bg-[#0F2D59] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Miembros Actuales</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                viewFilter === 'actuales'
                  ? 'bg-[#EA580C] text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {currentMembers.length}
              </span>
            </button>

            <button
              onClick={() => setViewFilter('pasados')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewFilter === 'pasados'
                  ? 'bg-[#0F2D59] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Miembros Pasados y Egresados</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                viewFilter === 'pasados'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {pastMembers.length}
              </span>
            </button>
          </div>
        </div>

        {/* VIEW 1: MIEMBROS ACTUALES */}
        {viewFilter === 'actuales' && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                Equipo Activo ({currentMembers.length})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between shadow-xs hover:shadow-sm transition-all relative overflow-hidden"
                >
                  {/* Subtle top indicator bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-linear-to-r ${member.avatarColor}`} />

                  {/* Compact Header with avatar initials, role, name and program */}
                  <div className="flex items-start gap-3 pt-1">
                    <div className={`w-11 h-11 rounded-xl bg-linear-to-br ${member.avatarColor} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}>
                      {member.initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold text-[#EA580C] uppercase tracking-wider truncate">
                          {member.role}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Activo
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 truncate mt-0.5">
                        {member.name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {member.program}
                      </p>
                    </div>
                  </div>

                  {/* Compact Contact Footer */}
                  <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[#0F2D59] font-medium truncate min-w-0"
                      title={member.email}
                    >
                      <Mail className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </a>

                    <div className="flex items-center gap-1 shrink-0">
                      {member.github && (
                        <a
                          href={member.github.startsWith('http') ? member.github : `https://${member.github}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title={`GitHub de ${member.name}`}
                          aria-label={`GitHub de ${member.name}`}
                        >
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {member.linkedin && (
                        <a
                          href={member.linkedin.startsWith('http') ? member.linkedin : `https://${member.linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-[#0A66C2] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title={`LinkedIn de ${member.name}`}
                          aria-label={`LinkedIn de ${member.name}`}
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VIEW 2: MIEMBROS PASADOS Y EGRESADOS */}
        {viewFilter === 'pasados' && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-[#0F2D59]" />
                Directorio Histórico de Egresados y Miembros Retirados ({pastMembers.length})
              </span>
            </div>

            {pastMembers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-2xl mx-auto shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Sin registros históricos en este momento
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-lg mx-auto">
                  Todos los miembros formalmente inscritos se encuentran en estado activo. Cuando un estudiante semillerista se gradúe de la Universidad de San Buenaventura Cali o formalice su retiro, el <strong>Docente Director (Dr. Iván Mauricio Cabezas)</strong> actualizará su estado desde el panel de dirección y su trayectoria quedará preservada en este registro histórico.
                </p>
                <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 font-medium">
                  <ShieldCheck className="w-4 h-4 text-[#0F2D59]" />
                  <span>Gestión administrada exclusivamente por la Dirección del Semillero</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastMembers.map((member) => (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1 bg-slate-300" />

                    <div>
                      {/* Status Tag */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          member.status === 'graduado'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {member.status === 'graduado' ? (
                            <>
                              <GraduationCap className="w-3 h-3 text-emerald-600" />
                              Egresado / Graduado
                            </>
                          ) : (
                            <>
                              <History className="w-3 h-3 text-slate-500" />
                              Retirado del Semillero
                            </>
                          )}
                        </span>

                        {member.period && (
                          <span className="text-[11px] font-mono text-slate-400">
                            {member.period}
                          </span>
                        )}
                      </div>

                      {/* Name & Role */}
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center shrink-0">
                          {member.initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-base font-bold text-slate-900 truncate">
                            {member.name}
                          </h4>
                          <p className="text-xs text-slate-500 truncate">
                            {member.role}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">
                            {member.program}
                          </p>
                        </div>
                      </div>

                      {/* Exit Reason / Trajectory */}
                      {member.exitReason && (
                        <div className="mt-4 p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                            Motivo / Trayectoria
                          </span>
                          <span className="text-slate-700 font-medium">
                            {member.exitReason}
                          </span>
                          {member.exitDate && (
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Fecha: {member.exitDate}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bio */}
                      <p className="mt-3 text-xs text-slate-600 line-clamp-3">
                        {member.bio}
                      </p>
                    </div>

                    {/* Footer Contact */}
                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <a
                        href={`mailto:${member.email}`}
                        className="text-slate-500 hover:text-[#0F2D59] truncate max-w-[180px] flex items-center gap-1 font-mono text-[11px]"
                      >
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </a>

                      {member.linkedin && (
                        <a
                          href={member.linkedin.startsWith('http') ? member.linkedin : `https://${member.linkedin}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0A66C2] hover:underline flex items-center gap-1 text-[11px] font-medium shrink-0"
                        >
                          <Linkedin className="w-3 h-3" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
