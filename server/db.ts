import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import type {
  Project,
  Member,
  CalendarEvent,
  NewsArticle,
  ResearchLog,
  JoinApplication,
  AccountRequest,
  AuthUser,
  ContactMessage,
  ResearchLine,
  MemberRole,
  ProjectStatus,
  EventType,
} from '../src/types.ts';

const defaultDbPath = path.resolve(process.cwd(), 'data', 'semillero.db');
const dbPath = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : defaultDbPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize normalized SQLite schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL,
    program TEXT NOT NULL,
    avatar_initials TEXT NOT NULL,
    color TEXT NOT NULL,
    member_record_id TEXT,
    status TEXT NOT NULL DEFAULT 'aprobada',
    account_request_id TEXT,
    deactivation_reason TEXT,
    deactivation_date TEXT,
    token_version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    program TEXT NOT NULL,
    degree TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    bio TEXT NOT NULL,
    orcid TEXT,
    cvlac TEXT,
    github TEXT,
    linkedin TEXT,
    research_lines_json TEXT NOT NULL,
    avatar_color TEXT NOT NULL,
    initials TEXT NOT NULL,
    publications_count INTEGER NOT NULL DEFAULT 0,
    projects_active INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'activo',
    period TEXT,
    exit_reason TEXT,
    exit_date TEXT,
    current_company_or_postgraduate TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS account_requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    role TEXT NOT NULL,
    program TEXT NOT NULL,
    student_code TEXT,
    motivation TEXT,
    semester INTEGER,
    research_line TEXT,
    skills TEXT,
    portfolio_url TEXT,
    source TEXT NOT NULL DEFAULT 'registro_directo',
    status TEXT NOT NULL DEFAULT 'pendiente',
    requested_at TEXT NOT NULL,
    reviewed_at TEXT,
    rejection_reason TEXT,
    deactivation_reason TEXT,
    deactivation_date TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    line_of_research TEXT NOT NULL,
    status TEXT NOT NULL,
    summary TEXT NOT NULL,
    full_description TEXT NOT NULL,
    objectives_json TEXT NOT NULL,
    lead_researcher TEXT NOT NULL,
    student_team_json TEXT NOT NULL,
    technologies_json TEXT NOT NULL,
    year INTEGER NOT NULL,
    github_url TEXT NOT NULL,
    paper_url TEXT,
    dockerized INTEGER NOT NULL DEFAULT 0,
    docker_compose_snippet TEXT,
    metrics_json TEXT,
    featured INTEGER NOT NULL DEFAULT 0,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    mode TEXT NOT NULL,
    speaker TEXT NOT NULL,
    description TEXT NOT NULL,
    capacity INTEGER,
    spots_left INTEGER,
    registration_open INTEGER NOT NULL DEFAULT 1,
    meeting_link TEXT,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS event_registrations (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_email TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    category TEXT NOT NULL,
    summary TEXT NOT NULL,
    content_json TEXT NOT NULL,
    author TEXT NOT NULL,
    read_time TEXT NOT NULL,
    tags_json TEXT NOT NULL,
    created_by_user_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS research_logs (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    project_id TEXT NOT NULL,
    project_title TEXT NOT NULL,
    date TEXT NOT NULL,
    hours_spent REAL NOT NULL,
    summary TEXT NOT NULL,
    deliverable_url TEXT,
    approved INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    student_code TEXT NOT NULL,
    institutional_email TEXT NOT NULL,
    academic_program TEXT NOT NULL,
    semester INTEGER NOT NULL,
    research_line TEXT NOT NULL,
    interests_and_motivation TEXT NOT NULL,
    programming_skills TEXT NOT NULL,
    portfolio_url TEXT,
    submitted_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Recibida',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'nuevo',
    submitted_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Safe idempotent migration for existing SQLite databases created before token_version existed
const userColumns = db.prepare(`PRAGMA table_info(users)`).all() as { name: string }[];
if (!userColumns.some((col) => col.name === 'token_version')) {
  db.exec(`ALTER TABLE users ADD COLUMN token_version INTEGER NOT NULL DEFAULT 1`);
}

// Seed only real leadership profiles (Director and President) if not present yet.
// Projects, events, news, and account requests stay completely empty until real users add them.
const seedInitialLeadership = db.transaction(() => {
  const insertMember = db.prepare(`
    INSERT OR IGNORE INTO members (
      id, name, role, program, degree, email, bio, orcid, cvlac, github, linkedin,
      research_lines_json, avatar_color, initials, publications_count, projects_active, status, period
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'activo', ?)
  `);

  insertMember.run(
    'mem-01',
    'Dr. Iván Mauricio Cabezas',
    'Docente Director',
    'Facultad de Ingeniería · USB Cali',
    'PhD en Ingeniería · Docente Investigador USB Cali',
    'imcabezas@usbcali.edu.co',
    'Director del Semillero de Ingeniería en la Universidad de San Buenaventura Cali. Lidera las directrices de investigación formativa, formulación de proyectos científicos y articulación académica para los estudiantes de ingeniería.',
    '0000-0002-9182-4410',
    'https://scienti.minciencias.gov.co/cvlac/visualizador/icabezas',
    null,
    'https://www.linkedin.com/in/ivanmcabezas/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BvcgpB0YxS2WQcuIBqALlzQ%3D%3D',
    JSON.stringify(['Cloud', 'Software', 'IoT']),
    'from-[#0F2D59] to-[#1E3A8A]',
    'IC',
    '2023 - Presente'
  );

  insertMember.run(
    'mem-02',
    'Martín Correa',
    'Presidente del Semillero',
    'Ingeniería de Sistemas · USB Cali',
    'Estudiante Investigador · Presidente del Semillero',
    'mcorreav1@correo.usbcali.edu.co',
    'Presidente del Semillero de Ingeniería de la Universidad de San Buenaventura Cali. Coordina el equipo estudiantil, la gestión de actividades académicas, la vinculación de nuevos semilleristas y el seguimiento de proyectos en formación.',
    null,
    null,
    'https://github.com/martincorrea',
    'https://www.linkedin.com/in/martinco444',
    JSON.stringify(['Cloud', 'Software', 'IoT']),
    'from-[#EA580C] to-[#C2410C]',
    'MC',
    '2024 - Presente'
  );

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (
      id, name, email, password_hash, role, program, avatar_initials, color, member_record_id, status
    ) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 'aprobada')
  `);

  insertUser.run(
    'usr-icabezas',
    'Dr. Iván Mauricio Cabezas',
    'imcabezas@usbcali.edu.co',
    'Docente Director',
    'Director del Semillero de Ingeniería',
    'IC',
    'from-[#0F2D59] to-[#1E3A8A]',
    'mem-01'
  );

  insertUser.run(
    'usr-mcorrea',
    'Martín Correa',
    'mcorreav1@correo.usbcali.edu.co',
    'Presidente del Semillero',
    'Ingeniería de Sistemas · Presidente',
    'MC',
    'from-[#EA580C] to-[#C2410C]',
    'mem-02'
  );
});

seedInitialLeadership();

// Row mapping helpers
function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  role: MemberRole;
  program: string;
  avatar_initials: string;
  color: string;
  member_record_id: string | null;
  status: AuthUser['status'];
  account_request_id: string | null;
  deactivation_reason: string | null;
  deactivation_date: string | null;
  token_version?: number;
}

export function mapUserRow(row: UserRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    program: row.program,
    avatarInitials: row.avatar_initials,
    color: row.color,
    memberRecordId: row.member_record_id ?? undefined,
    status: row.status ?? 'aprobada',
    accountRequestId: row.account_request_id ?? undefined,
    deactivationReason: row.deactivation_reason ?? undefined,
    deactivationDate: row.deactivation_date ?? undefined,
  };
}

export function listMembers(): Member[] {
  const rows = db.prepare(`SELECT * FROM members ORDER BY created_at ASC`).all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    role: r.role as MemberRole,
    program: String(r.program),
    degree: String(r.degree),
    email: String(r.email),
    bio: String(r.bio),
    orcid: r.orcid ? String(r.orcid) : undefined,
    cvlac: r.cvlac ? String(r.cvlac) : undefined,
    github: r.github ? String(r.github) : undefined,
    linkedin: r.linkedin ? String(r.linkedin) : undefined,
    researchLines: safeJsonParse<ResearchLine[]>(r.research_lines_json as string, ['Software']),
    avatarColor: String(r.avatar_color),
    initials: String(r.initials),
    publicationsCount: Number(r.publications_count ?? 0),
    projectsActive: Number(r.projects_active ?? 0),
    status: (r.status as Member['status']) ?? 'activo',
    period: r.period ? String(r.period) : undefined,
    exitReason: r.exit_reason ? String(r.exit_reason) : undefined,
    exitDate: r.exit_date ? String(r.exit_date) : undefined,
    currentCompanyOrPostgraduate: r.current_company_or_postgraduate
      ? String(r.current_company_or_postgraduate)
      : undefined,
  }));
}

export function listProjects(): Project[] {
  const rows = db.prepare(`SELECT * FROM projects ORDER BY created_at DESC`).all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    lineOfResearch: r.line_of_research as ResearchLine,
    status: r.status as ProjectStatus,
    summary: String(r.summary),
    fullDescription: String(r.full_description),
    objectives: safeJsonParse<string[]>(r.objectives_json as string, []),
    leadResearcher: String(r.lead_researcher),
    studentTeam: safeJsonParse<string[]>(r.student_team_json as string, []),
    technologies: safeJsonParse<string[]>(r.technologies_json as string, []),
    year: Number(r.year),
    githubUrl: String(r.github_url),
    paperUrl: r.paper_url ? String(r.paper_url) : undefined,
    dockerized: Boolean(r.dockerized),
    dockerComposeSnippet: r.docker_compose_snippet ? String(r.docker_compose_snippet) : undefined,
    metrics: r.metrics_json
      ? safeJsonParse<{ label: string; value: string }[]>(r.metrics_json as string, [])
      : undefined,
    featured: Boolean(r.featured),
  }));
}

export function listEvents(): CalendarEvent[] {
  const rows = db.prepare(`SELECT * FROM events ORDER BY date ASC, created_at DESC`).all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    type: r.type as EventType,
    date: String(r.date),
    time: String(r.time),
    location: String(r.location),
    mode: r.mode as CalendarEvent['mode'],
    speaker: String(r.speaker),
    description: String(r.description),
    capacity: r.capacity !== null && r.capacity !== undefined ? Number(r.capacity) : undefined,
    spotsLeft: r.spots_left !== null && r.spots_left !== undefined ? Number(r.spots_left) : undefined,
    registrationOpen: Boolean(r.registration_open),
    meetingLink: r.meeting_link ? String(r.meeting_link) : undefined,
  }));
}

export function listNews(): NewsArticle[] {
  const rows = db.prepare(`SELECT * FROM news ORDER BY created_at DESC`).all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    title: String(r.title),
    date: String(r.date),
    category: r.category as NewsArticle['category'],
    summary: String(r.summary),
    content: safeJsonParse<string[]>(r.content_json as string, []),
    author: String(r.author),
    readTime: String(r.read_time),
    tags: safeJsonParse<string[]>(r.tags_json as string, []),
  }));
}

export function listResearchLogsForUser(user: AuthUser): ResearchLog[] {
  const isDirector = user.role === 'Docente Director' || user.email.toLowerCase() === 'imcabezas@usbcali.edu.co';
  const rows = isDirector
    ? (db.prepare(`SELECT * FROM research_logs ORDER BY created_at DESC`).all() as Record<string, unknown>[])
    : (db
        .prepare(`SELECT * FROM research_logs WHERE member_id = ? ORDER BY created_at DESC`)
        .all(user.id) as Record<string, unknown>[]);

  return rows.map((r) => ({
    id: String(r.id),
    memberId: String(r.member_id),
    memberName: String(r.member_name),
    projectId: String(r.project_id),
    projectTitle: String(r.project_title),
    date: String(r.date),
    hoursSpent: Number(r.hours_spent),
    summary: String(r.summary),
    deliverableUrl: r.deliverable_url ? String(r.deliverable_url) : undefined,
    approved: Boolean(r.approved),
  }));
}

export function listAccountRequests(): AccountRequest[] {
  const rows = db
    .prepare(`SELECT * FROM account_requests ORDER BY created_at DESC`)
    .all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    role: r.role as MemberRole,
    program: String(r.program),
    studentCode: r.student_code ? String(r.student_code) : undefined,
    motivation: r.motivation ? String(r.motivation) : undefined,
    semester: r.semester !== null && r.semester !== undefined ? Number(r.semester) : undefined,
    researchLine: r.research_line ? (r.research_line as ResearchLine) : undefined,
    skills: r.skills ? String(r.skills) : undefined,
    portfolioUrl: r.portfolio_url ? String(r.portfolio_url) : undefined,
    source: (r.source as AccountRequest['source']) ?? 'registro_directo',
    status: r.status as AccountRequest['status'],
    requestedAt: String(r.requested_at),
    reviewedAt: r.reviewed_at ? String(r.reviewed_at) : undefined,
    rejectionReason: r.rejection_reason ? String(r.rejection_reason) : undefined,
    deactivationReason: r.deactivation_reason ? String(r.deactivation_reason) : undefined,
    deactivationDate: r.deactivation_date ? String(r.deactivation_date) : undefined,
  }));
}

export function listApprovedUsers(): AuthUser[] {
  const rows = db
    .prepare(`SELECT id, name, email, role, program, avatar_initials, color, member_record_id, status, account_request_id, deactivation_reason, deactivation_date FROM users ORDER BY created_at ASC`)
    .all() as UserRow[];
  return rows.map(mapUserRow);
}

export function listApplications(): JoinApplication[] {
  const rows = db
    .prepare(`SELECT * FROM applications ORDER BY created_at DESC`)
    .all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    fullName: String(r.full_name),
    studentCode: String(r.student_code),
    institutionalEmail: String(r.institutional_email),
    academicProgram: String(r.academic_program),
    semester: Number(r.semester),
    researchLine: r.research_line as ResearchLine,
    interestsAndMotivation: String(r.interests_and_motivation),
    programmingSkills: String(r.programming_skills),
    portfolioUrl: r.portfolio_url ? String(r.portfolio_url) : undefined,
    submittedAt: String(r.submitted_at),
    status: r.status as JoinApplication['status'],
  }));
}

export function listContactMessages(): ContactMessage[] {
  const rows = db
    .prepare(`SELECT * FROM contact_messages ORDER BY created_at DESC`)
    .all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    subject: String(r.subject),
    message: String(r.message),
    status: (r.status === 'atendido' ? 'atendido' : 'nuevo') as ContactMessage['status'],
    submittedAt: String(r.submitted_at),
  }));
}
