import React, { useState } from 'react';
import { X, Check, Send, Sparkles, Building2, User, Mail, GraduationCap } from 'lucide-react';
import { ResearchLine, JoinApplication } from '../types';

interface ContactJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveApplication: (app: JoinApplication) => Promise<void> | void;
  onSaveContactMessage: (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => Promise<void> | void;
}

export const ContactJoinModal: React.FC<ContactJoinModalProps> = ({
  isOpen,
  onClose,
  onSaveApplication,
  onSaveContactMessage
}) => {
  const [activeTab, setActiveTab] = useState<'join' | 'contact'>('join');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [contactError, setContactError] = useState('');

  // Form states for Join
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [email, setEmail] = useState('');
  const [academicProgram, setAcademicProgram] = useState('Ingeniería de Sistemas');
  const [semester, setSemester] = useState<number>(5);
  const [researchLine, setResearchLine] = useState<ResearchLine>('Software');
  const [motivation, setMotivation] = useState('');
  const [skills, setSkills] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');

  // Form states for General Contact
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  if (!isOpen) return null;

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@(?:correo\.)?usbcali\.edu\.co$/i.test(normalizedEmail)) {
      setSubmitError(
        'Debes postularte con tu correo institucional USB Cali (@correo.usbcali.edu.co o @usbcali.edu.co).'
      );
      return;
    }

    setIsSubmitting(true);

    const newApp: JoinApplication = {
      id: `app-${Date.now()}`,
      fullName,
      studentCode,
      institutionalEmail: email,
      academicProgram,
      semester,
      researchLine,
      interestsAndMotivation: motivation,
      programmingSkills: skills,
      portfolioUrl: portfolioUrl || undefined,
      submittedAt: new Date().toISOString().split('T')[0],
      status: 'Recibida'
    };

    try {
      await onSaveApplication(newApp);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        // Reset form
        setFullName('');
        setStudentCode('');
        setEmail('');
        setMotivation('');
        setSkills('');
        setPortfolioUrl('');
      }, 2500);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo enviar la postulación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError('');
    setIsSubmitting(true);
    try {
      await onSaveContactMessage({
        name: contactName.trim(),
        email: contactEmail.trim().toLowerCase(),
        subject: contactSubject.trim(),
        message: contactMessage.trim(),
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setContactName('');
        setContactEmail('');
        setContactSubject('');
        setContactMessage('');
      }, 2500);
    } catch (err) {
      setContactError(
        err instanceof Error ? err.message : 'No se pudo guardar el mensaje de contacto.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header with Institutional Branding */}
        <div className="px-5 sm:px-6 py-4 bg-[#0F2D59] text-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-orange-200 truncate">
              <span>Universidad de San Buenaventura Cali</span>
              <span aria-hidden="true">·</span>
              <span>LIDIS</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-0.5 truncate">
              {activeTab === 'join' ? 'Postulación al Semillero' : 'Contacto y Alianzas'}
            </h3>
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

        {/* Tab switch */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'join'
                ? 'bg-white text-[#0F2D59] border-b-2 border-[#0F2D59]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Postularme como Semillerista</span>
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'contact'
                ? 'bg-white text-[#0F2D59] border-b-2 border-[#0F2D59]'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Contacto General & Empresas</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto min-h-0">
          {isSuccess ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">
                {activeTab === 'join' ? '¡Postulación Recibida!' : '¡Mensaje Enviado con Éxito!'}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                {activeTab === 'join'
                  ? 'Tu postulación ha sido enviada directamente al panel del Docente Director (Dr. Iván Mauricio Cabezas). Una vez evaluada y aprobada por la dirección institucional, se activará tu cuenta de miembro del semillero.'
                  : 'Gracias por comunicarte con el Laboratorio LIDIS de la Universidad de San Buenaventura Cali. Te responderemos a la brevedad.'}
              </p>
            </div>
          ) : activeTab === 'join' ? (
            <form onSubmit={handleJoinSubmit} className="space-y-4 pr-1">
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-[#0F2D59] space-y-1">
                <strong>Requisitos mínimos:</strong> Ser estudiante activo de la Facultad de Ingeniería USB Cali (a partir de 3° semestre) y contar con disponibilidad mínima de 4 horas semanales para actividades de investigación.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="Ej. Sofía Andrade Gómez"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código Estudiantil *
                  </label>
                  <input
                    type="text"
                    required
                    value={studentCode}
                    onChange={e => setStudentCode(e.target.value)}
                    placeholder="Ej. 30000054321"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Correo Institucional (@correo.usbcali.edu.co) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="estudiante@correo.usbcali.edu.co"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Programa Académico *
                  </label>
                  <select
                    value={academicProgram}
                    onChange={e => setAcademicProgram(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  >
                    <option value="Ingeniería de Sistemas">Ingeniería de Sistemas</option>
                    <option value="Ingeniería Multimedia">Ingeniería Multimedia</option>
                    <option value="Ingeniería Electrónica y Telecomunicaciones">Ingeniería Electrónica y Telecomunicaciones</option>
                    <option value="Ingeniería Mecatrónica">Ingeniería Mecatrónica</option>
                    <option value="Ingeniería Industrial">Ingeniería Industrial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Semestre Actual
                  </label>
                  <select
                    value={semester}
                    onChange={e => setSemester(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  >
                    {[3, 4, 5, 6, 7, 8, 9, 10].map(s => (
                      <option key={s} value={s}>{s}° Semestre</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Línea de Interés Principal *
                  </label>
                    <select
                    value={researchLine}
                    onChange={e => setResearchLine(e.target.value as ResearchLine)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  >
                    <option value="Software">Software</option>
                    <option value="IoT">IoT</option>
                    <option value="Cloud">Cloud</option>
                    <option value="Bioinformática & Salud Digital">Bioinformática & Salud Digital</option>
                    <option value="Ciberseguridad & Infraestructura Crítica">Ciberseguridad & Infraestructura</option>
                    <option value="Diseño UX/UI">Diseño UX/UI</option>
                    <option value="Electrónica">Electrónica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ¿Por qué deseas vincularte al Semillero? (Motivación) *
                </label>
                <textarea
                  required
                  rows={2}
                  value={motivation}
                  onChange={e => setMotivation(e.target.value)}
                  placeholder="Describe qué te entusiasma investigar o qué habilidades buscas fortalecer..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lenguajes, Tecnologías o Intereses Previos *
                </label>
                <input
                  type="text"
                  required
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                  placeholder="Ej. Python, Docker, React, C++, Arduino, Git..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enlace a Perfil de GitHub / Portafolio (Opcional)
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/tu-usuario"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              {submitError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs">
                  {submitError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] disabled:opacity-60 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar Postulación'}</span>
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <strong>Ubicación institucional:</strong> Universidad de San Buenaventura Cali, Av. 10 de Mayo, La Umbría.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo / Entidad *
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="Ej. Empresa / Investigador Aliado"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Correo Electrónico de Contacto *
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asunto *
                </label>
                <input
                  type="text"
                  required
                  value={contactSubject}
                  onChange={e => setContactSubject(e.target.value)}
                  placeholder="Propuesta de proyecto / Pasantía / Consulta técnica"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mensaje *
                </label>
                <textarea
                  required
                  rows={3}
                  value={contactMessage}
                  onChange={e => setContactMessage(e.target.value)}
                  placeholder="Escribe tu mensaje para la dirección de LIDIS..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              {contactError && (
                <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs">
                  {contactError}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] disabled:opacity-60 rounded-lg transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
