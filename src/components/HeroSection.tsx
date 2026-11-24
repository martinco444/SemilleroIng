import React from 'react';
import { ArrowRight, BookOpen, Layers, Globe } from 'lucide-react';

interface HeroSectionProps {
  onExploreProjects: () => void;
  onOpenJoinModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreProjects,
  onOpenJoinModal
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-100/70 via-white to-slate-50 border-b border-slate-200">
      <div 
        aria-hidden="true" 
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#0F2D59_1px,transparent_1px)] [background-size:16px_16px]" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-16 lg:pb-20 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[#C2410C]">
              <span>Universidad de San Buenaventura Cali</span>
              <span aria-hidden="true">·</span>
              <span>Facultad de Ingeniería</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-950 tracking-tight leading-[1.15]" style={{ textWrap: 'balance' }}>
              Semillero de Investigación en Ingeniería
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Espacio académico e institucional de la Universidad de San Buenaventura Cali dedicado a la investigación formativa, desarrollo tecnológico y formación científica de estudiantes de ingeniería.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onExploreProjects}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] active:scale-95 rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap"
              >
                <span>Ver Repositorio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenJoinModal}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 active:scale-95 rounded-lg transition-all shadow-xs cursor-pointer whitespace-nowrap"
              >
                <span>Postularme al Semillero</span>
              </button>
            </div>

            {/* Quick credentials */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500">
              <span className="font-medium text-slate-700">Facultad de Ingeniería USB Cali</span>
              <span aria-hidden="true">·</span>
              <span>Campus La Umbría, Cali</span>
              <span aria-hidden="true">·</span>
              <span>Convocatoria Abierta</span>
            </div>
          </div>

          {/* Right Column: Institutional Purpose & Thematic Lines Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 relative overflow-hidden space-y-5">
              
              {/* Header inside card */}
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Identidad Formativa
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5">
                  Enfoque del Semillero
                </h3>
                <p className="text-xs text-slate-500">
                  Investigación Aplicada & Desarrollo Tecnológico · USB Cali
                </p>
              </div>

              {/* Semillero Focus & Methodology */}
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#0F2D59] text-white flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#EA580C] uppercase block">
                      Metodología de Trabajo
                    </span>
                    <span className="text-xs font-bold text-slate-900 block">
                      Ciclo de Investigación Aplicada
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed">
                      Formulación de retos reales, prototipado técnico y documentación científica en ingeniería.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EA580C] text-white flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#0F2D59] uppercase block">
                      Participación Estudiantil
                    </span>
                    <span className="text-xs font-bold text-slate-900 block">
                      Aprendizaje Colaborativo por Proyectos
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed">
                      Integración interdisciplinaria con acompañamiento docente y bitácoras de avance.
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#00629B] text-white flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-[#00629B] uppercase block">
                      Proyección IEEE
                    </span>
                    <span className="text-xs font-bold text-slate-900 block">
                      Estándares y Comunidad IEEE
                    </span>
                    <span className="text-[11px] text-slate-500 block leading-relaxed">
                      Articulación con buenas prácticas de ingeniería, documentación técnica y espacios académicos de la red IEEE.
                    </span>
                  </div>
                </div>
              </div>

              {/* Research lines in formation */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-700">Líneas de Trabajo Temáticas</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                    <span className="block font-semibold text-slate-900">Software</span>
                    <span className="text-[11px] text-slate-500">Desarrollo & Arquitectura</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                    <span className="block font-semibold text-slate-900">IoT</span>
                    <span className="text-[11px] text-slate-500">Sensores & Telemetría</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                    <span className="block font-semibold text-slate-900">Cloud</span>
                    <span className="text-[11px] text-slate-500">Infraestructura & Servicios</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                    <span className="block font-semibold text-slate-900">Ciberseguridad</span>
                    <span className="text-[11px] text-slate-500">Redes & Sistemas</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                    <span className="block font-semibold text-slate-900">Diseño UX/UI</span>
                    <span className="text-[11px] text-slate-500">Experiencias & Animaciones</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                    <span className="block font-semibold text-slate-900">Electrónica</span>
                    <span className="text-[11px] text-slate-500">Conexiones & Circuitos</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Factual foundational strip below hero */}
        <div className="mt-14 pt-8 border-t border-slate-200/90 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Líneas de Trabajo</div>
            <div className="text-base font-bold text-[#0F2D59]">+06 Áreas Temáticas</div>
            <div className="text-[11px] text-slate-500">Software, IoT, Cloud, UX/UI, Electrónica & Más</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dirección</div>
            <div className="text-base font-bold text-slate-800">Dr. Iván M. Cabezas</div>
            <div className="text-[11px] text-slate-500">Docente Investigador</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sede</div>
            <div className="text-base font-bold text-slate-800">Campus La Umbría</div>
            <div className="text-[11px] text-slate-500">Cali, Valle del Cauca</div>
          </div>
        </div>

      </div>
    </section>
  );
};
