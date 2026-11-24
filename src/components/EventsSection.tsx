import React, { useState } from 'react';
import { CalendarEvent, EventType } from '../types';
import { Calendar, Clock, MapPin, Plus, Check, X, CalendarPlus, Lock } from 'lucide-react';

interface EventsSectionProps {
  events: CalendarEvent[];
  onRegisterForEvent: (eventId: string, studentName: string, email: string) => void;
  onAddNewEvent?: (event: CalendarEvent) => void;
  currentUser?: { name: string; role: string } | null;
  activePresidentName?: string;
  onOpenLogin: () => void;
}

export const EventsSection: React.FC<EventsSectionProps> = ({
  events,
  onRegisterForEvent,
  onAddNewEvent,
  currentUser,
  activePresidentName,
  onOpenLogin
}) => {
  const defaultSpeaker = activePresidentName
    ? `Dr. Iván Mauricio Cabezas & ${activePresidentName}`
    : 'Dr. Iván Mauricio Cabezas';

  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<EventType>('Reunión Semanal');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('10:00 - 12:00');
  const [newLocation, setNewLocation] = useState('Campus La Umbría (USB Cali) / Teams');
  const [newSpeaker, setNewSpeaker] = useState(defaultSpeaker);
  const [newDescription, setNewDescription] = useState('');

  const [registeringEvent, setRegisteringEvent] = useState<CalendarEvent | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleCreateEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenLogin();
      return;
    }
    if (!newTitle || !newDate || !onAddNewEvent) return;

    const event: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newTitle,
      type: newType,
      date: newDate,
      time: newTime,
      location: newLocation,
      mode: 'Híbrido',
      speaker: newSpeaker,
      description: newDescription || 'Encuentro del Semillero de Ingeniería USB Cali.',
      registrationOpen: true
    };

    onAddNewEvent(event);
    setIsAddingEvent(false);
    setNewTitle('');
    setNewDate('');
    setNewDescription('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringEvent || !studentName || !studentEmail) return;
    onRegisterForEvent(registeringEvent.id, studentName, studentEmail);
    setRegistrationSuccess(true);
    setTimeout(() => {
      setRegistrationSuccess(false);
      setRegisteringEvent(null);
      setStudentName('');
      setStudentEmail('');
    }, 2000);
  };

  return (
    <section id="calendario" className="py-16 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#0F2D59]">
            <span>Agenda Institucional</span>
            <span aria-hidden="true">·</span>
            <span>Semestre Académico</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Calendario de Eventos y Encuentros
          </h2>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Reuniones de avance, talleres de investigación y sustentaciones programadas por la Dirección y Presidencia del Semillero.
          </p>
        </div>

        {currentUser ? (
          <button
            onClick={() => {
              setNewSpeaker(defaultSpeaker);
              setIsAddingEvent(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer self-start md:self-auto shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Programar Evento</span>
          </button>
        ) : (
          <button
            onClick={onOpenLogin}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors cursor-pointer self-start md:self-auto shadow-xs"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Acceso Miembros para Programar</span>
          </button>
        )}
      </div>

      {/* Events List or Blank State */}
      <div className="mt-8">
        {events.length === 0 ? (
          <div className="text-center py-16 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-xs max-w-3xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-[#0F2D59] mb-4 shadow-xs">
              <Calendar className="w-7 h-7 text-[#0F2D59]" />
            </div>

            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#EA580C] block mb-1">
              Calendario Habilitado
            </span>

            <h3 className="text-xl font-bold text-slate-900">
              No Hay Eventos Programados Actualmente
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
              El calendario se encuentra en blanco mientras se coordinan las fechas oficiales para el periodo académico. Los próximos talleres, sesiones de inducción y reuniones se publicarán en este espacio.
            </p>

            <div className="mt-6">
              {currentUser ? (
                <button
                  onClick={() => {
                    setNewSpeaker(defaultSpeaker);
                    setIsAddingEvent(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Programar Primer Evento (Miembro Activo)</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500">
                    Solo los miembros activos con sesión iniciada pueden programar eventos en el calendario.
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
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => {
              const dateObj = new Date(event.date + 'T00:00:00');
              const dayName = dateObj.toLocaleDateString('es-CO', { weekday: 'short' });
              const dayNum = dateObj.toLocaleDateString('es-CO', { day: '2-digit' });
              const monthName = dateObj.toLocaleDateString('es-CO', { month: 'short' });

              return (
                <div
                  key={event.id}
                  className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 sm:p-6 transition-all shadow-xs hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-5">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold uppercase text-[#EA580C] tracking-wider leading-none">
                        {monthName}
                      </span>
                      <span className="text-xl font-bold font-mono text-[#0F2D59] leading-tight tabular-nums">
                        {dayNum}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize leading-none">
                        {dayName}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-[#0F2D59]">{event.type}</span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {event.time}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-600">{event.mode}</span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                        {event.title}
                      </h3>

                      <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                        {event.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-y-1 gap-x-4 pt-1 text-xs text-slate-500">
                        <div className="flex items-center gap-1 text-slate-700">
                          <MapPin className="w-3.5 h-3.5 text-[#EA580C]" />
                          <span>{event.location}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Responsable: </span>
                          <span className="font-medium text-slate-800">{event.speaker}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    {event.registrationOpen && (
                      <button
                        onClick={() => setRegisteringEvent(event)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer"
                      >
                        Inscribirme
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Program Event Modal */}
      {isAddingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-5 sm:px-6 py-4 bg-[#0F2D59] text-white flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase text-orange-200 block">
                  Semillero USB Cali
                </span>
                <h3 className="text-base font-bold text-white truncate mt-0.5">
                  Programar Nuevo Evento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingEvent(false)}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-3"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEventSubmit} className="p-5 sm:p-6 space-y-3.5 flex-1 overflow-y-auto min-h-0">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej. Sesión de Inducción para Semilleristas"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Evento
                  </label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value as EventType)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  >
                    <option value="Reunión Semanal">Reunión Semanal</option>
                    <option value="Taller Técnico">Taller Técnico</option>
                    <option value="Sustentación">Sustentación</option>
                    <option value="Seminario LIDIS">Seminario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horario
                  </label>
                  <input
                    type="text"
                    value={newTime}
                    onChange={e => setNewTime(e.target.value)}
                    placeholder="10:00 - 12:00"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lugar / Enlace
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={e => setNewLocation(e.target.value)}
                    placeholder="Campus La Umbría / Teams"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Responsable / Expositor
                </label>
                <input
                  type="text"
                  value={newSpeaker}
                  onChange={e => setNewSpeaker(e.target.value)}
                  placeholder={defaultSpeaker}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Descripción
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Temas a tratar en la sesión..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingEvent(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Guardar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {registeringEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            <div className="px-5 sm:px-6 py-4 bg-[#0F2D59] text-white flex items-center justify-between shrink-0">
              <div className="min-w-0">
                <span className="text-[11px] font-semibold uppercase text-orange-200 block">
                  Reserva de Asistencia
                </span>
                <h3 className="text-base font-bold text-white truncate mt-0.5">
                  Inscripción al Evento
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRegisteringEvent(null)}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0 ml-3"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 flex-1 overflow-y-auto min-h-0">
              {registrationSuccess ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">¡Inscripción Confirmada!</h3>
                  <p className="text-xs text-slate-600">
                    Tu asistencia para <span className="font-semibold">{registeringEvent.title}</span> ha sido registrada.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-200/70 font-medium">
                    {registeringEvent.title}
                  </p>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nombre Completo
                      </label>
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={e => setStudentName(e.target.value)}
                        placeholder="Tu nombre completo"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Correo Electrónico
                      </label>
                      <input
                        type="email"
                        required
                        value={studentEmail}
                        onChange={e => setStudentEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0F2D59]"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setRegisteringEvent(null)}
                        className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 text-xs font-semibold text-white bg-[#0F2D59] hover:bg-[#1E3A8A] rounded-lg transition-colors cursor-pointer shadow-xs"
                      >
                        Confirmar
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
