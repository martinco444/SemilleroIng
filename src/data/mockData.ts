import { Project, Member, CalendarEvent, NewsArticle, AuthUser, ResearchLog } from '../types';

// Repositorio de proyectos en blanco (sin información ficticia)
export const INITIAL_PROJECTS: Project[] = [];

// Perfiles de la Dirección y Presidencia del Semillero (Miembros Activos)
export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-01',
    name: 'Dr. Iván Mauricio Cabezas',
    role: 'Docente Director',
    program: 'Facultad de Ingeniería · USB Cali',
    degree: 'PhD en Ingeniería · Docente Investigador USB Cali',
    email: 'imcabezas@usbcali.edu.co',
    bio: 'Director del Semillero de Ingeniería en la Universidad de San Buenaventura Cali. Lidera las directrices de investigación formativa, formulación de proyectos científicos y articulación académica para los estudiantes de ingeniería.',
    orcid: '0000-0002-9182-4410',
    cvlac: 'https://scienti.minciencias.gov.co/cvlac/visualizador/icabezas',
    linkedin: 'https://www.linkedin.com/in/ivanmcabezas/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BvcgpB0YxS2WQcuIBqALlzQ%3D%3D',
    researchLines: ['Cloud', 'Software', 'IoT'],
    avatarColor: 'from-[#0F2D59] to-[#1E3A8A]',
    initials: 'IC',
    publicationsCount: 0,
    projectsActive: 0,
    status: 'activo',
    period: '2023 - Presente'
  },
  {
    id: 'mem-02',
    name: 'Martín Correa',
    role: 'Presidente del Semillero',
    program: 'Ingeniería de Sistemas · USB Cali',
    degree: 'Estudiante Investigador · Presidente del Semillero',
    email: 'mcorreav1@correo.usbcali.edu.co',
    bio: 'Presidente del Semillero de Ingeniería de la Universidad de San Buenaventura Cali. Coordina el equipo estudiantil, la gestión de actividades académicas, la vinculación de nuevos semilleristas y el seguimiento de proyectos en formación.',
    github: 'https://github.com/martincorrea',
    linkedin: 'https://www.linkedin.com/in/martinco444',
    researchLines: ['Cloud', 'Software', 'IoT'],
    avatarColor: 'from-[#EA580C] to-[#C2410C]',
    initials: 'MC',
    publicationsCount: 0,
    projectsActive: 0,
    status: 'activo',
    period: '2024 - Presente'
  }
];

// Calendario en blanco (sin eventos inventados)
export const INITIAL_EVENTS: CalendarEvent[] = [];

// Sección de noticias en blanco (sin publicaciones ficticias)
export const INITIAL_NEWS: NewsArticle[] = [];

// Cuentas de acceso autorizadas: Presidente y Director
export const DEMO_USERS: AuthUser[] = [
  {
    id: 'usr-mcorrea',
    name: 'Martín Correa',
    email: 'mcorreav1@correo.usbcali.edu.co',
    role: 'Presidente del Semillero',
    program: 'Ingeniería de Sistemas · Presidente',
    avatarInitials: 'MC',
    color: 'from-[#EA580C] to-[#C2410C]',
    memberRecordId: 'mem-02'
  },
  {
    id: 'usr-icabezas',
    name: 'Dr. Iván Mauricio Cabezas',
    email: 'imcabezas@usbcali.edu.co',
    role: 'Docente Director',
    program: 'Director del Semillero de Ingeniería',
    avatarInitials: 'IC',
    color: 'from-[#0F2D59] to-[#1E3A8A]',
    memberRecordId: 'mem-01'
  }
];

export const INITIAL_RESEARCH_LOGS: ResearchLog[] = [];

// Solicitudes de creación de cuenta pendientes de aprobación por el Docente Director
export const INITIAL_ACCOUNT_REQUESTS = [
  {
    id: 'req-01',
    name: 'Laura Sofía Valencia Morales',
    email: 'lvalencia@correo.usbcali.edu.co',
    role: 'Estudiante Semillerista' as const,
    program: 'Ingeniería de Sistemas',
    studentCode: '30000078129',
    motivation: 'Interesada en participar en la formulación de proyectos en Software, Cloud e IoT.',
    status: 'pendiente' as const,
    requestedAt: 'Hoy, 09:30 AM'
  }
];
