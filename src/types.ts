export type ResearchLine = 
  | 'Software'
  | 'IoT'
  | 'Cloud'
  | 'Bioinformática & Salud Digital'
  | 'Ciberseguridad & Infraestructura Crítica'
  | 'Diseño UX/UI'
  | 'Electrónica';

export type ProjectStatus = 'En curso' | 'Finalizado' | 'En validación';

export interface Project {
  id: string;
  title: string;
  lineOfResearch: ResearchLine;
  status: ProjectStatus;
  summary: string;
  fullDescription: string;
  objectives: string[];
  leadResearcher: string;
  studentTeam: string[];
  technologies: string[];
  year: number;
  githubUrl: string;
  paperUrl?: string;
  dockerized: boolean;
  dockerComposeSnippet?: string;
  metrics?: { label: string; value: string }[];
  featured?: boolean;
}

export type MemberRole = 
  | 'Docente Director'
  | 'Docente Investigador'
  | 'Docente Investigadora'
  | 'Presidente del Semillero'
  | 'Estudiante Investigador Líder'
  | 'Estudiante Investigadora Líder'
  | 'Estudiante Semillerista'
  | 'Egresado Mentor';

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  program: string;
  degree: string;
  email: string;
  bio: string;
  orcid?: string;
  cvlac?: string;
  github?: string;
  linkedin?: string;
  researchLines: ResearchLine[];
  avatarColor: string;
  initials: string;
  publicationsCount: number;
  projectsActive: number;
  // Estado de vinculación al semillero
  status?: 'activo' | 'graduado' | 'retirado' | 'inactivo';
  period?: string; // Ej: "2023 - 2025" o "2024 - Presente"
  exitReason?: string; // Ej: "Graduado con honores", "Retiro voluntario"
  exitDate?: string;
  currentCompanyOrPostgraduate?: string;
}

export type EventType = 
  | 'Seminario LIDIS'
  | 'Taller Técnico'
  | 'Reunión Semanal'
  | 'Sustentación'
  | 'Hackathon';

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // ISO date 'YYYY-MM-DD'
  time: string;
  location: string;
  mode: 'Presencial (LIDIS)' | 'Virtual (Teams)' | 'Híbrido';
  speaker: string;
  description: string;
  capacity?: number;
  spotsLeft?: number;
  registrationOpen: boolean;
  meetingLink?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  category: 'Logro Académico' | 'Publicación Científica' | 'Convocatoria' | 'Evento';
  summary: string;
  content: string[];
  author: string;
  readTime: string;
  tags: string[];
}

export interface ResearchLog {
  id: string;
  memberId: string;
  memberName: string;
  projectId: string;
  projectTitle: string;
  date: string;
  hoursSpent: number;
  summary: string;
  deliverableUrl?: string;
  approved: boolean;
}

export interface JoinApplication {
  id: string;
  fullName: string;
  studentCode: string;
  institutionalEmail: string;
  academicProgram: string;
  semester: number;
  researchLine: ResearchLine;
  interestsAndMotivation: string;
  programmingSkills: string;
  portfolioUrl?: string;
  submittedAt: string;
  status: 'Recibida' | 'En revisión' | 'Entrevista agendada';
}

export interface AccountRequest {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  program: string;
  studentCode?: string;
  motivation?: string;
  semester?: number;
  researchLine?: ResearchLine;
  skills?: string;
  portfolioUrl?: string;
  source?: 'postulacion' | 'registro_directo';
  status: 'pendiente' | 'aprobada' | 'rechazada' | 'graduado' | 'retirado' | 'desactivada';
  requestedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
  deactivationReason?: string;
  deactivationDate?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  program: string;
  avatarInitials: string;
  color: string;
  memberRecordId?: string;
  status?: 'aprobada' | 'pendiente' | 'rechazada' | 'graduado' | 'retirado' | 'desactivada';
  accountRequestId?: string;
  deactivationReason?: string;
  deactivationDate?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'nuevo' | 'atendido';
  submittedAt: string;
}
