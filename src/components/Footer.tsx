import React from 'react';
import { MapPin, Mail, ExternalLink, GraduationCap } from 'lucide-react';

interface FooterProps {
  onOpenJoinModal: () => void;
  onOpenLogin: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenJoinModal,
  onOpenLogin
}) => {
  return (
    <footer className="bg-[#0B1E38] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Col 1 & 2: Institutional Identity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#EA580C] text-white flex items-center justify-center font-bold text-sm">
                USB
              </div>
              <div>
                <h4 className="text-white font-bold text-base leading-tight">
                  Semillero de Ingeniería USB Cali
                </h4>
                <p className="text-xs text-slate-400">
                  Universidad de San Buenaventura Cali · Facultad de Ingeniería
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Espacio para el fomento de la investigación formativa, desarrollo tecnológico y pensamiento científico en los estudiantes de la Facultad de Ingeniería.
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#EA580C] shrink-0 mt-0.5" />
                <span>Campus La Umbría, Av. 10 de Mayo, Cali, Valle del Cauca</span>
              </div>
            </div>
          </div>

          {/* Col 3: Navegación Rápida */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              Navegación
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#proyectos" className="hover:text-white transition-colors">Repositorio de Proyectos</a>
              </li>
              <li>
                <a href="#integrantes" className="hover:text-white transition-colors">Dirección y Presidencia</a>
              </li>
              <li>
                <a href="#calendario" className="hover:text-white transition-colors">Calendario de Eventos</a>
              </li>
              <li>
                <a href="#noticias" className="hover:text-white transition-colors">Noticias</a>
              </li>
            </ul>
          </div>

          {/* Col 4: Acciones Institucionales */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-white">
              Participación
            </h5>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={onOpenJoinModal}
                  className="hover:text-white transition-colors text-left flex items-center gap-1.5 cursor-pointer text-xs"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-[#EA580C]" />
                  <span>Postulación de Estudiantes</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenLogin}
                  className="hover:text-white transition-colors text-left cursor-pointer text-xs"
                >
                  Portal de Miembros
                </button>
              </li>
              <li>
                <a
                  href="https://www.usbcali.edu.co"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors flex items-center gap-1 text-xs"
                >
                  <span>Portal Oficial USB Cali</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} Semillero de Ingeniería · Universidad de San Buenaventura Cali.
          </div>
         
        </div>
      </div>
    </footer>
  );
};
