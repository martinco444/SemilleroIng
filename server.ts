import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import {
  db,
  listMembers,
  listProjects,
  listEvents,
  listNews,
  listResearchLogsForUser,
  listAccountRequests,
  listApprovedUsers,
  listApplications,
  listContactMessages,
  mapUserRow,
} from './server/db.ts';
import type { UserRow } from './server/db.ts';
import {
  hashPassword,
  verifyPassword,
  safeComparePlaintext,
  getEnvPasscodeForEmail,
  signAuthToken,
  getAuthenticatedUserFromRequest,
  requireAuth,
  requireDirector,
} from './server/auth.ts';
import type { AuthenticatedRequest } from './server/auth.ts';
import {
  securityHeaders,
  createRateLimiter,
  isInstitutionalEmail,
  getClientIp,
} from './server/security.ts';
import type {
  ResearchLine,
  MemberRole,
  ProjectStatus,
  EventType,
  Project,
  CalendarEvent,
  NewsArticle,
  ResearchLog,
} from './src/types.ts';

const ALLOWED_RESEARCH_LINES: ReadonlySet<string> = new Set<ResearchLine>([
  'Software',
  'IoT',
  'Cloud',
  'Bioinformática & Salud Digital',
  'Ciberseguridad & Infraestructura Crítica',
  'Diseño UX/UI',
  'Electrónica',
]);

const SELF_REGISTER_ROLES: ReadonlySet<string> = new Set<MemberRole>([
  'Estudiante Semillerista',
  'Estudiante Investigador Líder',
  'Docente Investigador',
  'Docente Investigadora',
  'Egresado Mentor',
]);

const ALLOWED_ASSIGNABLE_ROLES: ReadonlySet<string> = new Set<MemberRole>([
  'Presidente del Semillero',
  'Estudiante Investigador Líder',
  'Estudiante Investigadora Líder',
  'Estudiante Semillerista',
  'Docente Investigador',
  'Docente Investigadora',
  'Egresado Mentor',
]);

const ALLOWED_PROJECT_STATUSES: ReadonlySet<string> = new Set<ProjectStatus>([
  'En curso',
  'Finalizado',
  'En validación',
]);

const ALLOWED_EVENT_TYPES: ReadonlySet<string> = new Set<EventType>([
  'Seminario LIDIS',
  'Taller Técnico',
  'Reunión Semanal',
  'Sustentación',
  'Hackathon',
]);

const ALLOWED_NEWS_CATEGORIES: ReadonlySet<string> = new Set([
  'Logro Académico',
  'Publicación Científica',
  'Convocatoria',
  'Evento',
]);

function sanitizeHttpUrl(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function normalizeEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

function makeInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'SB'
  );
}

function listLeadershipAccounts() {
  const rows = db
    .prepare(
      `SELECT id, name, email, role, avatar_initials, color, password_hash
       FROM users
       WHERE status = 'aprobada' AND role IN ('Docente Director', 'Presidente del Semillero')
       ORDER BY CASE role WHEN 'Docente Director' THEN 0 ELSE 1 END, created_at ASC`
    )
    .all() as {
    id: string;
    name: string;
    email: string;
    role: MemberRole;
    avatar_initials: string;
    color: string;
    password_hash: string | null;
  }[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    initials: row.avatar_initials,
    color: row.color,
    needsPasswordSetup: !getEnvPasscodeForEmail(row.email) && !row.password_hash,
  }));
}

function buildAuthPayload(user: ReturnType<typeof mapUserRow>) {
  const isDirector =
    user.role === 'Docente Director' || user.email.toLowerCase() === 'imcabezas@usbcali.edu.co';

  return {
    user,
    researchLogs: listResearchLogsForUser(user),
    ...(isDirector
      ? {
          accountRequests: listAccountRequests(),
          approvedUsers: listApprovedUsers(),
          applications: listApplications(),
          contactMessages: listContactMessages(),
        }
      : {}),
  };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use(express.json({ limit: '1mb' }));

  // Tiered rate limiters tailored to an academic portal
  const apiGeneralLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 180,
    keyPrefix: 'api-general',
    message: 'Demasiadas peticiones desde tu conexión. Espera unos minutos e inténtalo de nuevo.',
  });

  const authIpLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 25,
    keyPrefix: 'auth-ip',
    message: 'Se superó el límite de intentos de acceso desde tu red. Intenta nuevamente en 15 minutos.',
  });

  const authAttemptLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
    keyPrefix: 'auth-account',
    keyGenerator: (req) => {
      const ip = getClientIp(req);
      const email = normalizeEmail(req.body?.email) || 'anonymous';
      return `${ip}:${email}`;
    },
    message: 'Demasiados intentos de inicio de sesión para esta cuenta. Espera 15 minutos antes de volver a intentarlo.',
  });

  const publicFormLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 8,
    keyPrefix: 'public-form',
    message: 'Has enviado varias solicitudes en poco tiempo. Espera unos minutos antes de enviar otra.',
  });

  const passwordChangeLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 6,
    keyPrefix: 'pwd-change',
    message: 'Demasiados intentos de cambio de contraseña. Espera 15 minutos e inténtalo de nuevo.',
  });

  app.use('/api', apiGeneralLimiter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, database: 'sqlite' });
  });

  // Initial public + optional authenticated state bootstrap
  app.get('/api/bootstrap', (req, res) => {
    const currentUser = getAuthenticatedUserFromRequest(req);
    const leadershipAccounts = listLeadershipAccounts();

    const basePayload = {
      projects: listProjects(),
      members: listMembers(),
      events: listEvents(),
      news: listNews(),
      leadershipAccounts,
      currentUser: currentUser ?? null,
    };

    if (!currentUser) {
      res.json({
        ...basePayload,
        researchLogs: [],
        accountRequests: [],
        approvedUsers: [],
        applications: [],
        contactMessages: [],
      });
      return;
    }

    const authData = buildAuthPayload(currentUser);
    res.json({
      ...basePayload,
      ...authData,
      currentUser: authData.user,
    });
  });

  // Auth: Login
  app.post('/api/auth/login', authIpLimiter, authAttemptLimiter, (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Por favor ingresa un correo institucional válido.' });
      return;
    }

    const userRow = db
      .prepare(
        `SELECT id, name, email, password_hash, role, program, avatar_initials, color, member_record_id, status, account_request_id, deactivation_reason, deactivation_date, token_version
         FROM users WHERE lower(email) = ?`
      )
      .get(email) as UserRow | undefined;

    if (userRow) {
      if (
        userRow.status === 'graduado' ||
        userRow.status === 'retirado' ||
        userRow.status === 'desactivada'
      ) {
        const reason =
          userRow.deactivation_reason ||
          (userRow.status === 'graduado'
            ? 'Graduación / Egresado de la USB Cali'
            : 'Retiro del semillero');
        res.status(403).json({
          error: `Esta cuenta ha sido desactivada por el Docente Director (Dr. Iván Mauricio Cabezas) debido a: "${reason}". Tu perfil se encuentra en la sección de Miembros Pasados y Egresados.`,
        });
        return;
      }

      const envPasscode = getEnvPasscodeForEmail(email);
      if (envPasscode) {
        if (!password || !safeComparePlaintext(password, envPasscode)) {
          res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
          return;
        }
      } else if (!userRow.password_hash) {
        res.status(409).json({
          code: 'NEEDS_PASSWORD_SETUP',
          email: userRow.email,
          name: userRow.name,
          role: userRow.role,
          error:
            'Esta cuenta aprobada aún no tiene contraseña configurada. Define tu contraseña inicial para activar el acceso.',
        });
        return;
      } else if (!password || !verifyPassword(password, userRow.password_hash)) {
        res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
        return;
      }

      const user = mapUserRow(userRow);
      const token = signAuthToken(user.id, userRow.token_version ?? 1);
      res.json({
        token,
        leadershipAccounts: listLeadershipAccounts(),
        ...buildAuthPayload(user),
      });
      return;
    }

    // Check if there is a pending or rejected account request
    const reqRow = db
      .prepare(`SELECT status, rejection_reason FROM account_requests WHERE lower(email) = ?`)
      .get(email) as { status: string; rejection_reason: string | null } | undefined;

    if (reqRow) {
      if (reqRow.status === 'pendiente') {
        res.status(403).json({
          error:
            'Tu cuenta está registrada pero AÚN PENDIENTE DE APROBACIÓN por el Docente Director, Dr. Iván Mauricio Cabezas. Podrás ingresar una vez sea aprobada.',
        });
        return;
      }
      if (reqRow.status === 'rechazada') {
        res.status(403).json({
          error: `Tu solicitud de cuenta fue denegada por la dirección institucional. Motivo: ${reqRow.rejection_reason || 'No cumple requisitos actuales'}.`,
        });
        return;
      }
    }

    res.status(401).json({
      error:
        'No existe una cuenta activa asociada a este correo. Solicita tu cuenta primero para que sea aprobada por el Docente Director.',
    });
  });

  // Auth: First-run initial password claim (locks atomically once set or when env passcode exists)
  app.post('/api/auth/claim-password', authIpLimiter, authAttemptLimiter, (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Correo institucional inválido.' });
      return;
    }
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({
        error: 'La contraseña debe tener entre 6 y 128 caracteres.',
      });
      return;
    }

    if (getEnvPasscodeForEmail(email)) {
      res.status(403).json({
        error:
          'Esta cuenta utiliza una clave configurada en las variables de entorno del servidor.',
      });
      return;
    }

    const passwordHash = hashPassword(password);
    const result = db
      .prepare(
        `UPDATE users
         SET password_hash = ?, token_version = token_version + 1
         WHERE lower(email) = ? AND password_hash IS NULL AND status = 'aprobada'`
      )
      .run(passwordHash, email);

    if (result.changes === 0) {
      res.status(409).json({
        error:
          'Esta cuenta ya tiene una contraseña configurada o no se encuentra aprobada para configuración inicial.',
      });
      return;
    }

    const userRow = db
      .prepare(
        `SELECT id, name, email, password_hash, role, program, avatar_initials, color, member_record_id, status, account_request_id, deactivation_reason, deactivation_date, token_version
         FROM users WHERE lower(email) = ?`
      )
      .get(email) as UserRow;

    const user = mapUserRow(userRow);
    const token = signAuthToken(user.id, userRow.token_version ?? 1);

    res.status(200).json({
      token,
      leadershipAccounts: listLeadershipAccounts(),
      ...buildAuthPayload(user),
    });
  });

  // Auth: Server-side logout (revokes current token immediately by bumping token_version)
  app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    db.prepare(`UPDATE users SET token_version = token_version + 1 WHERE id = ?`).run(user.id);
    res.json({ ok: true });
  });

  // Auth: Member password change (rotates password hash and invalidates older sessions)
  app.post('/api/auth/change-password', passwordChangeLimiter, requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const currentPassword =
      typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (newPassword.length < 6 || newPassword.length > 128) {
      res.status(400).json({ error: 'La nueva contraseña debe tener entre 6 y 128 caracteres.' });
      return;
    }
    if (currentPassword === newPassword) {
      res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la contraseña actual.' });
      return;
    }

    if (getEnvPasscodeForEmail(user.email)) {
      res.status(403).json({
        error:
          'Esta cuenta usa una clave fija en variables de entorno del servidor. Para cambiarla, actualízala en la configuración de secretos.',
      });
      return;
    }

    const userRow = db
      .prepare(`SELECT id, password_hash, token_version FROM users WHERE id = ?`)
      .get(user.id) as { id: string; password_hash: string | null; token_version: number } | undefined;

    if (!userRow || !userRow.password_hash || !verifyPassword(currentPassword, userRow.password_hash)) {
      res.status(401).json({ error: 'La contraseña actual no es correcta.' });
      return;
    }

    const nextVersion = (userRow.token_version ?? 1) + 1;
    const newHash = hashPassword(newPassword);

    db.prepare(`UPDATE users SET password_hash = ?, token_version = ? WHERE id = ?`).run(
      newHash,
      nextVersion,
      user.id
    );

    const token = signAuthToken(user.id, nextVersion);
    res.json({
      ok: true,
      token,
      message: 'Contraseña actualizada correctamente. Las sesiones anteriores han sido cerradas.',
    });
  });

  // Auth: Register new account request (requires Director approval + USB Cali domain)
  app.post('/api/auth/register', publicFormLimiter, (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body?.email);
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const role = typeof req.body?.role === 'string' ? req.body.role.trim() : '';
    const program =
      typeof req.body?.program === 'string' && req.body.program.trim()
        ? req.body.program.trim()
        : 'Ingeniería de Sistemas';
    const studentCode =
      typeof req.body?.studentCode === 'string' && req.body.studentCode.trim()
        ? req.body.studentCode.trim()
        : null;
    const motivation =
      typeof req.body?.motivation === 'string' && req.body.motivation.trim()
        ? req.body.motivation.trim()
        : null;

    if (!name || name.length > 120) {
      res.status(400).json({ error: 'Por favor ingresa tu nombre completo.' });
      return;
    }
    if (!isInstitutionalEmail(email)) {
      res.status(400).json({
        error:
          'Solo se permiten correos institucionales de la USB Cali (@usbcali.edu.co o @correo.usbcali.edu.co).',
      });
      return;
    }
    if (password.length < 6 || password.length > 128) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (!SELF_REGISTER_ROLES.has(role)) {
      res.status(400).json({ error: 'Rol solicitado no permitido para registro público.' });
      return;
    }

    const existingUser = db
      .prepare(`SELECT id, status FROM users WHERE lower(email) = ?`)
      .get(email) as { id: string; status: string } | undefined;

    if (existingUser) {
      res.status(409).json({
        error: 'Ya existe una cuenta registrada con este correo institucional. Inicia sesión directamente.',
      });
      return;
    }

    const existingReq = db
      .prepare(`SELECT id, status FROM account_requests WHERE lower(email) = ?`)
      .get(email) as { id: string; status: string } | undefined;

    if (existingReq) {
      if (existingReq.status === 'pendiente') {
        res.status(409).json({
          error:
            'Ya existe una solicitud pendiente con este correo en revisión por el Dr. Iván Mauricio Cabezas.',
        });
        return;
      }
      if (existingReq.status === 'rechazada') {
        res.status(409).json({
          error:
            'Una solicitud previa con este correo fue rechazada. Consulta con la dirección del semillero.',
        });
        return;
      }
    }

    const id = `req-${Date.now()}`;
    const requestedAt =
      'Hoy, ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
    const passwordHash = hashPassword(password);

    db.prepare(
      `INSERT INTO account_requests (
        id, name, email, password_hash, role, program, student_code, motivation, source, status, requested_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'registro_directo', 'pendiente', ?)`
    ).run(id, name, email, passwordHash, role, program, studentCode, motivation, requestedAt);

    res.status(201).json({
      request: {
        id,
        name,
        email,
        role: role as MemberRole,
        program,
        studentCode: studentCode ?? undefined,
        motivation: motivation ?? undefined,
        source: 'registro_directo' as const,
        status: 'pendiente' as const,
        requestedAt,
      },
    });
  });

  // Public: Student Join Application (also creates pending request for Director)
  app.post('/api/applications', publicFormLimiter, (req, res) => {
    const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : '';
    const studentCode = typeof req.body?.studentCode === 'string' ? req.body.studentCode.trim() : '';
    const institutionalEmail = normalizeEmail(req.body?.institutionalEmail);
    const academicProgram =
      typeof req.body?.academicProgram === 'string' ? req.body.academicProgram.trim() : '';
    const semester = Number(req.body?.semester);
    const researchLine =
      typeof req.body?.researchLine === 'string' ? req.body.researchLine.trim() : '';
    const interestsAndMotivation =
      typeof req.body?.interestsAndMotivation === 'string'
        ? req.body.interestsAndMotivation.trim()
        : '';
    const programmingSkills =
      typeof req.body?.programmingSkills === 'string' ? req.body.programmingSkills.trim() : '';
    const portfolioUrl = sanitizeHttpUrl(req.body?.portfolioUrl) ?? null;

    if (!isInstitutionalEmail(institutionalEmail)) {
      res.status(400).json({
        error:
          'Debes postularte con tu correo institucional USB Cali (@correo.usbcali.edu.co o @usbcali.edu.co).',
      });
      return;
    }

    if (
      !fullName ||
      !studentCode ||
      !academicProgram ||
      !Number.isInteger(semester) ||
      semester < 1 ||
      semester > 12 ||
      !ALLOWED_RESEARCH_LINES.has(researchLine) ||
      !interestsAndMotivation ||
      !programmingSkills
    ) {
      res.status(400).json({ error: 'Completa todos los campos obligatorios de la postulación.' });
      return;
    }

    const appId = `app-${Date.now()}`;
    const submittedAt = new Date().toLocaleDateString('es-CO');
    const requestedAt =
      'Hoy, ' + new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const saveTransaction = db.transaction(() => {
      db.prepare(
        `INSERT INTO applications (
          id, full_name, student_code, institutional_email, academic_program, semester,
          research_line, interests_and_motivation, programming_skills, portfolio_url, submitted_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Recibida')`
      ).run(
        appId,
        fullName,
        studentCode,
        institutionalEmail,
        academicProgram,
        semester,
        researchLine,
        interestsAndMotivation,
        programmingSkills,
        portfolioUrl,
        submittedAt
      );

      const existingUser = db
        .prepare(`SELECT id FROM users WHERE lower(email) = ?`)
        .get(institutionalEmail);

      if (!existingUser) {
        const reqId = `req-app-${Date.now()}`;
        const existingReq = db
          .prepare(`SELECT id FROM account_requests WHERE lower(email) = ?`)
          .get(institutionalEmail) as { id: string } | undefined;

        if (existingReq) {
          db.prepare(
            `UPDATE account_requests
             SET name = ?, program = ?, student_code = ?, motivation = ?, semester = ?,
                 research_line = ?, skills = ?, portfolio_url = ?, source = 'postulacion',
                 status = 'pendiente', requested_at = ?, rejection_reason = NULL
             WHERE id = ?`
          ).run(
            fullName,
            `${academicProgram} (${semester}° Semestre)`,
            studentCode,
            interestsAndMotivation,
            semester,
            researchLine,
            programmingSkills,
            portfolioUrl,
            requestedAt,
            existingReq.id
          );
        } else {
          db.prepare(
            `INSERT INTO account_requests (
              id, name, email, password_hash, role, program, student_code, motivation,
              semester, research_line, skills, portfolio_url, source, status, requested_at
            ) VALUES (?, ?, ?, NULL, 'Estudiante Semillerista', ?, ?, ?, ?, ?, ?, ?, 'postulacion', 'pendiente', ?)`
          ).run(
            reqId,
            fullName,
            institutionalEmail,
            `${academicProgram} (${semester}° Semestre)`,
            studentCode,
            interestsAndMotivation,
            semester,
            researchLine,
            programmingSkills,
            portfolioUrl,
            requestedAt
          );
        }
      }
    });

    saveTransaction();

    res.status(201).json({
      application: {
        id: appId,
        fullName,
        studentCode,
        institutionalEmail,
        academicProgram,
        semester,
        researchLine: researchLine as ResearchLine,
        interestsAndMotivation,
        programmingSkills,
        portfolioUrl: portfolioUrl ?? undefined,
        submittedAt,
        status: 'Recibida' as const,
      },
    });
  });

  // Public: General Contact & Industry/Academic Alliances inquiry
  app.post('/api/contact', publicFormLimiter, (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = normalizeEmail(req.body?.email);
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

    if (!name || name.length > 120) {
      res.status(400).json({ error: 'Ingresa tu nombre o entidad (máximo 120 caracteres).' });
      return;
    }
    if (!email || email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'Ingresa un correo electrónico válido de contacto.' });
      return;
    }
    if (!subject || subject.length > 160) {
      res.status(400).json({ error: 'Ingresa un asunto válido (máximo 160 caracteres).' });
      return;
    }
    if (!message || message.length > 3000) {
      res.status(400).json({ error: 'Escribe tu mensaje (máximo 3000 caracteres).' });
      return;
    }

    const id = `msg-${Date.now()}`;
    const submittedAt =
      new Date().toLocaleDateString('es-CO') +
      ' · ' +
      new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    db.prepare(
      `INSERT INTO contact_messages (id, name, email, subject, message, status, submitted_at)
       VALUES (?, ?, ?, ?, ?, 'nuevo', ?)`
    ).run(id, name, email, subject, message, submittedAt);

    res.status(201).json({
      contactMessage: {
        id,
        name,
        email,
        subject,
        message,
        status: 'nuevo' as const,
        submittedAt,
      },
    });
  });

  // Public: Register for calendar event
  app.post('/api/events/:id/register', publicFormLimiter, (req, res) => {
    const eventId = req.params.id;
    const studentName = typeof req.body?.studentName === 'string' ? req.body.studentName.trim() : '';
    const studentEmail = normalizeEmail(req.body?.studentEmail);

    if (!studentName || !studentEmail || !studentEmail.includes('@')) {
      res.status(400).json({ error: 'Ingresa tu nombre completo y correo válido para inscribirte.' });
      return;
    }

    const eventRow = db
      .prepare(`SELECT id, spots_left, registration_open FROM events WHERE id = ?`)
      .get(eventId) as { id: string; spots_left: number | null; registration_open: number } | undefined;

    if (!eventRow) {
      res.status(404).json({ error: 'Evento no encontrado.' });
      return;
    }
    if (!eventRow.registration_open) {
      res.status(400).json({ error: 'Las inscripciones para este evento están cerradas.' });
      return;
    }

    const regTransaction = db.transaction(() => {
      db.prepare(
        `INSERT INTO event_registrations (id, event_id, student_name, student_email) VALUES (?, ?, ?, ?)`
      ).run(`evreg-${Date.now()}`, eventId, studentName, studentEmail);

      if (eventRow.spots_left !== null && eventRow.spots_left > 0) {
        db.prepare(`UPDATE events SET spots_left = spots_left - 1 WHERE id = ? AND spots_left > 0`).run(
          eventId
        );
      }
    });

    regTransaction();

    res.json({ events: listEvents() });
  });

  // Protected (Active Member): Create Project
  app.post('/api/projects', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const lineOfResearch =
      typeof req.body?.lineOfResearch === 'string' ? req.body.lineOfResearch.trim() : '';
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : 'En curso';
    const summary = typeof req.body?.summary === 'string' ? req.body.summary.trim() : '';
    const fullDescription =
      typeof req.body?.fullDescription === 'string' && req.body.fullDescription.trim()
        ? req.body.fullDescription.trim()
        : summary;
    const leadResearcher =
      typeof req.body?.leadResearcher === 'string' && req.body.leadResearcher.trim()
        ? req.body.leadResearcher.trim()
        : 'Dr. Iván Mauricio Cabezas';
    const objectives = Array.isArray(req.body?.objectives)
      ? req.body.objectives.filter((o: unknown): o is string => typeof o === 'string' && o.trim().length > 0)
      : [];
    const studentTeam = Array.isArray(req.body?.studentTeam)
      ? req.body.studentTeam.filter((s: unknown): s is string => typeof s === 'string' && s.trim().length > 0)
      : [user.name];
    const technologies = Array.isArray(req.body?.technologies)
      ? req.body.technologies.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];
    const year = Number(req.body?.year) || new Date().getFullYear();
    const githubUrl = sanitizeHttpUrl(req.body?.githubUrl) ?? 'https://github.com/usb-cali-semillero';
    const paperUrl = sanitizeHttpUrl(req.body?.paperUrl) ?? null;
    const dockerized = Boolean(req.body?.dockerized);

    if (!title || !summary || !ALLOWED_RESEARCH_LINES.has(lineOfResearch) || !ALLOWED_PROJECT_STATUSES.has(status)) {
      res.status(400).json({ error: 'Datos del proyecto inválidos o incompletos.' });
      return;
    }

    const id = `proj-${Date.now()}`;
    db.prepare(
      `INSERT INTO projects (
        id, title, line_of_research, status, summary, full_description, objectives_json,
        lead_researcher, student_team_json, technologies_json, year, github_url, paper_url,
        dockerized, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      title,
      lineOfResearch,
      status,
      summary,
      fullDescription,
      JSON.stringify(objectives),
      leadResearcher,
      JSON.stringify(studentTeam),
      JSON.stringify(technologies),
      year,
      githubUrl,
      paperUrl,
      dockerized ? 1 : 0,
      user.id
    );

    const project: Project = {
      id,
      title,
      lineOfResearch: lineOfResearch as ResearchLine,
      status: status as ProjectStatus,
      summary,
      fullDescription,
      objectives,
      leadResearcher,
      studentTeam,
      technologies,
      year,
      githubUrl,
      paperUrl: paperUrl ?? undefined,
      dockerized,
    };

    res.status(201).json({ project });
  });

  // Protected (Active Member): Create Event
  app.post('/api/events', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const type = typeof req.body?.type === 'string' ? req.body.type.trim() : 'Reunión Semanal';
    const date = typeof req.body?.date === 'string' ? req.body.date.trim() : '';
    const time = typeof req.body?.time === 'string' ? req.body.time.trim() : '10:00 - 12:00';
    const location =
      typeof req.body?.location === 'string' && req.body.location.trim()
        ? req.body.location.trim()
        : 'Campus La Umbría (USB Cali) / Teams';
    const mode =
      req.body?.mode === 'Presencial (LIDIS)' || req.body?.mode === 'Virtual (Teams)' || req.body?.mode === 'Híbrido'
        ? req.body.mode
        : 'Híbrido';
    const speaker =
      typeof req.body?.speaker === 'string' && req.body.speaker.trim()
        ? req.body.speaker.trim()
        : user.name;
    const description =
      typeof req.body?.description === 'string' && req.body.description.trim()
        ? req.body.description.trim()
        : 'Encuentro del Semillero de Ingeniería USB Cali.';
    const capacity = req.body?.capacity !== undefined ? Number(req.body.capacity) : null;
    const spotsLeft = req.body?.spotsLeft !== undefined ? Number(req.body.spotsLeft) : capacity;
    const meetingLink = sanitizeHttpUrl(req.body?.meetingLink) ?? null;

    if (!title || !date || !ALLOWED_EVENT_TYPES.has(type)) {
      res.status(400).json({ error: 'Datos del evento inválidos o incompletos.' });
      return;
    }

    const id = `evt-${Date.now()}`;
    db.prepare(
      `INSERT INTO events (
        id, title, type, date, time, location, mode, speaker, description,
        capacity, spots_left, registration_open, meeting_link, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).run(
      id,
      title,
      type,
      date,
      time,
      location,
      mode,
      speaker,
      description,
      capacity,
      spotsLeft,
      meetingLink,
      user.id
    );

    const event: CalendarEvent = {
      id,
      title,
      type: type as EventType,
      date,
      time,
      location,
      mode,
      speaker,
      description,
      capacity: capacity ?? undefined,
      spotsLeft: spotsLeft ?? undefined,
      registrationOpen: true,
      meetingLink: meetingLink ?? undefined,
    };

    res.status(201).json({ event });
  });

  // Protected (Active Member): Create News Article
  app.post('/api/news', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const category =
      typeof req.body?.category === 'string' ? req.body.category.trim() : 'Convocatoria';
    const summary = typeof req.body?.summary === 'string' ? req.body.summary.trim() : '';
    const content = Array.isArray(req.body?.content)
      ? req.body.content.filter((c: unknown): c is string => typeof c === 'string' && c.trim().length > 0)
      : [summary];
    const tags = Array.isArray(req.body?.tags)
      ? req.body.tags.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0)
      : ['Semillero', 'USB Cali'];

    if (!title || !summary || !ALLOWED_NEWS_CATEGORIES.has(category)) {
      res.status(400).json({ error: 'Datos de la noticia inválidos o incompletos.' });
      return;
    }

    const id = `news-${Date.now()}`;
    const date = new Date().toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const readTime = '2 min de lectura';

    db.prepare(
      `INSERT INTO news (
        id, title, date, category, summary, content_json, author, read_time, tags_json, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      title,
      date,
      category,
      summary,
      JSON.stringify(content.length > 0 ? content : [summary]),
      user.name,
      readTime,
      JSON.stringify(tags),
      user.id
    );

    const article: NewsArticle = {
      id,
      title,
      date,
      category: category as NewsArticle['category'],
      summary,
      content: content.length > 0 ? content : [summary],
      author: user.name,
      readTime,
      tags,
    };

    res.status(201).json({ article });
  });

  // Protected (Active Member): Create Research Log
  app.post('/api/research-logs', requireAuth, (req: AuthenticatedRequest, res) => {
    const user = req.authUser!;
    const projectId = typeof req.body?.projectId === 'string' ? req.body.projectId.trim() : '';
    const projectTitle =
      typeof req.body?.projectTitle === 'string' && req.body.projectTitle.trim()
        ? req.body.projectTitle.trim()
        : 'Investigación General';
    const hoursSpent = Number(req.body?.hoursSpent);
    const summary = typeof req.body?.summary === 'string' ? req.body.summary.trim() : '';
    const deliverableUrl = sanitizeHttpUrl(req.body?.deliverableUrl) ?? null;

    if (!summary || !Number.isFinite(hoursSpent) || hoursSpent <= 0 || hoursSpent > 200) {
      res.status(400).json({ error: 'Ingresa un resumen válido y una cantidad de horas positiva.' });
      return;
    }

    const id = `log-${Date.now()}`;
    const date = new Date().toISOString().split('T')[0];
    const approved = user.role.includes('Director') ? 1 : 0;

    db.prepare(
      `INSERT INTO research_logs (
        id, member_id, member_name, project_id, project_title, date, hours_spent, summary, deliverable_url, approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      user.id,
      user.name,
      projectId,
      projectTitle,
      date,
      hoursSpent,
      summary,
      deliverableUrl,
      approved
    );

    const log: ResearchLog = {
      id,
      memberId: user.id,
      memberName: user.name,
      projectId,
      projectTitle,
      date,
      hoursSpent,
      summary,
      deliverableUrl: deliverableUrl ?? undefined,
      approved: Boolean(approved),
    };

    res.status(201).json({ log });
  });

  // Director-Only: Overview
  app.get('/api/director/overview', requireDirector, (_req, res) => {
    res.json({
      accountRequests: listAccountRequests(),
      approvedUsers: listApprovedUsers(),
      members: listMembers(),
      applications: listApplications(),
      contactMessages: listContactMessages(),
    });
  });

  // Director-Only: Mark general contact inquiry as attended / new
  app.post('/api/director/contacts/:id/status', requireDirector, (req, res) => {
    const id = req.params.id;
    const status = req.body?.status === 'atendido' ? 'atendido' : 'nuevo';

    const result = db
      .prepare(`UPDATE contact_messages SET status = ? WHERE id = ?`)
      .run(status, id);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Mensaje de contacto no encontrado.' });
      return;
    }

    res.json({ contactMessages: listContactMessages() });
  });

  // Director-Only: Approve Account Request
  app.post('/api/director/requests/:id/approve', requireDirector, (req, res) => {
    const requestId = req.params.id;
    const reqRow = db
      .prepare(`SELECT * FROM account_requests WHERE id = ?`)
      .get(requestId) as Record<string, unknown> | undefined;

    if (!reqRow) {
      res.status(404).json({ error: 'Solicitud no encontrada.' });
      return;
    }

    const email = String(reqRow.email).toLowerCase();
    const name = String(reqRow.name);
    const role = String(reqRow.role);
    const program = String(reqRow.program);
    const passwordHash = reqRow.password_hash ? String(reqRow.password_hash) : null;
    const motivation = reqRow.motivation ? String(reqRow.motivation) : null;
    const portfolioUrl = reqRow.portfolio_url ? String(reqRow.portfolio_url) : null;
    const researchLine = reqRow.research_line ? String(reqRow.research_line) : null;
    const initials = makeInitials(name);
    const reviewedAt = 'Aprobado el ' + new Date().toLocaleDateString('es-CO');
    const year = new Date().getFullYear();

    const approveTx = db.transaction(() => {
      db.prepare(
        `UPDATE account_requests SET status = 'aprobada', reviewed_at = ?, rejection_reason = NULL WHERE id = ?`
      ).run(reviewedAt, requestId);

      const existingMember = db
        .prepare(`SELECT id FROM members WHERE lower(email) = ?`)
        .get(email) as { id: string } | undefined;

      const memberId = existingMember ? existingMember.id : `mem-${requestId}`;
      if (existingMember) {
        db.prepare(
          `UPDATE members SET status = 'activo', exit_reason = NULL, exit_date = NULL WHERE id = ?`
        ).run(memberId);
      } else {
        const lines: ResearchLine[] =
          researchLine && ALLOWED_RESEARCH_LINES.has(researchLine)
            ? [researchLine as ResearchLine]
            : ['Software', 'Cloud'];
        db.prepare(
          `INSERT INTO members (
            id, name, role, program, degree, email, bio, github, research_lines_json,
            avatar_color, initials, publications_count, projects_active, status, period
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'from-[#0F2D59] to-[#1E3A8A]', ?, 0, 0, 'activo', ?)`
        ).run(
          memberId,
          name,
          role,
          program.includes('USB') ? program : `${program} · USB Cali`,
          `${role} · USB Cali`,
          email,
          motivation ||
            'Miembro investigador activo en el Semillero de Ingeniería de la Universidad de San Buenaventura Cali.',
          portfolioUrl,
          JSON.stringify(lines),
          initials,
          `${year} - Presente`
        );
      }

      const existingUser = db
        .prepare(`SELECT id, password_hash FROM users WHERE lower(email) = ?`)
        .get(email) as { id: string; password_hash: string | null } | undefined;

      if (existingUser) {
        db.prepare(
          `UPDATE users
           SET status = 'aprobada',
               password_hash = COALESCE(password_hash, ?),
               member_record_id = ?,
               deactivation_reason = NULL,
               deactivation_date = NULL
           WHERE id = ?`
        ).run(passwordHash, memberId, existingUser.id);
      } else {
        db.prepare(
          `INSERT INTO users (
            id, name, email, password_hash, role, program, avatar_initials, color,
            member_record_id, status, account_request_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 'from-[#0F2D59] to-[#1E3A8A]', ?, 'aprobada', ?)`
        ).run(`usr-${requestId}`, name, email, passwordHash, role, program, initials, memberId, requestId);
      }
    });

    approveTx();

    res.json({
      accountRequests: listAccountRequests(),
      approvedUsers: listApprovedUsers(),
      members: listMembers(),
    });
  });

  // Director-Only: Reject Account Request
  app.post('/api/director/requests/:id/reject', requireDirector, (req, res) => {
    const requestId = req.params.id;
    const reason =
      typeof req.body?.reason === 'string' && req.body.reason.trim()
        ? req.body.reason.trim()
        : 'No cumple requisitos actuales';

    const result = db
      .prepare(
        `UPDATE account_requests SET status = 'rechazada', rejection_reason = ?, reviewed_at = ? WHERE id = ?`
      )
      .run(reason, 'Rechazado el ' + new Date().toLocaleDateString('es-CO'), requestId);

    if (result.changes === 0) {
      res.status(404).json({ error: 'Solicitud no encontrada.' });
      return;
    }

    res.json({ accountRequests: listAccountRequests() });
  });

  // Director-Only: Deactivate Member / Account (Graduado / Retirado)
  app.post('/api/director/members/deactivate', requireDirector, (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const reasonType =
      req.body?.reasonType === 'graduado' ||
      req.body?.reasonType === 'retirado' ||
      req.body?.reasonType === 'desactivada'
        ? req.body.reasonType
        : 'retirado';
    const reasonDetails =
      typeof req.body?.reasonDetails === 'string' && req.body.reasonDetails.trim()
        ? req.body.reasonDetails.trim()
        : reasonType === 'graduado'
          ? 'Graduado del programa · USB Cali'
          : 'Retiro del semillero';
    const period =
      typeof req.body?.period === 'string' && req.body.period.trim()
        ? req.body.period.trim()
        : undefined;

    if (!email) {
      res.status(400).json({ error: 'Correo de miembro requerido.' });
      return;
    }
    if (email === 'imcabezas@usbcali.edu.co') {
      res.status(400).json({ error: 'No se puede desactivar la cuenta del Docente Director.' });
      return;
    }

    const today = new Date().toLocaleDateString('es-CO');
    const memberStatus = reasonType === 'desactivada' ? 'inactivo' : reasonType;

    const deactivateTx = db.transaction(() => {
      db.prepare(
        `UPDATE users
         SET status = ?, deactivation_reason = ?, deactivation_date = ?, token_version = token_version + 1
         WHERE lower(email) = ?`
      ).run(reasonType, reasonDetails, today, email);

      db.prepare(
        `UPDATE account_requests SET status = ?, deactivation_reason = ?, deactivation_date = ? WHERE lower(email) = ?`
      ).run(reasonType, reasonDetails, today, email);

      db.prepare(
        `UPDATE members
         SET status = ?, exit_reason = ?, exit_date = ?, period = COALESCE(?, period)
         WHERE lower(email) = ?`
      ).run(memberStatus, reasonDetails, today, period ?? null, email);
    });

    deactivateTx();

    res.json({
      accountRequests: listAccountRequests(),
      approvedUsers: listApprovedUsers(),
      members: listMembers(),
      leadershipAccounts: listLeadershipAccounts(),
    });
  });

  // Director-Only: Change Member Role / Transfer Semillero Presidency
  app.post('/api/director/members/role', requireDirector, (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const newRole = typeof req.body?.newRole === 'string' ? req.body.newRole.trim() : '';
    const previousPresidentAction =
      req.body?.previousPresidentAction === 'graduado' ||
      req.body?.previousPresidentAction === 'retirado'
        ? req.body.previousPresidentAction
        : 'keep_active';
    const previousPresidentReason =
      typeof req.body?.previousPresidentReason === 'string' &&
      req.body.previousPresidentReason.trim()
        ? req.body.previousPresidentReason.trim()
        : previousPresidentAction === 'graduado'
          ? 'Culminación de periodo en Presidencia y graduación · USB Cali'
          : 'Culminación de periodo en Presidencia / Retiro del semillero';

    if (!email) {
      res.status(400).json({ error: 'Correo del integrante requerido.' });
      return;
    }
    if (email === 'imcabezas@usbcali.edu.co') {
      res.status(400).json({ error: 'No se puede modificar el rol del Docente Director.' });
      return;
    }
    if (!ALLOWED_ASSIGNABLE_ROLES.has(newRole)) {
      res.status(400).json({ error: 'El rol seleccionado no es válido.' });
      return;
    }

    const memberRow = db
      .prepare(`SELECT id, role, status FROM members WHERE lower(email) = ?`)
      .get(email) as { id: string; role: string; status: string } | undefined;

    if (!memberRow || (memberRow.status && memberRow.status !== 'activo')) {
      res.status(404).json({ error: 'Solo se puede cambiar el rol de un miembro activo.' });
      return;
    }

    const today = new Date().toLocaleDateString('es-CO');
    const isPromotingToPresident = newRole === 'Presidente del Semillero';
    const targetColor = isPromotingToPresident
      ? 'from-[#EA580C] to-[#C2410C]'
      : 'from-[#0F2D59] to-[#1E3A8A]';
    const targetDegree = isPromotingToPresident
      ? 'Estudiante Investigador · Presidente del Semillero'
      : `${newRole} · USB Cali`;

    const roleTx = db.transaction(() => {
      if (isPromotingToPresident) {
        const previousPresidents = db
          .prepare(
            `SELECT email FROM members
             WHERE role = 'Presidente del Semillero'
               AND (status IS NULL OR status = 'activo')
               AND lower(email) != ?`
          )
          .all(email) as { email: string }[];

        for (const prev of previousPresidents) {
          const prevEmail = prev.email.toLowerCase();
          if (previousPresidentAction === 'graduado' || previousPresidentAction === 'retirado') {
            db.prepare(
              `UPDATE users
               SET status = ?, deactivation_reason = ?, deactivation_date = ?, token_version = token_version + 1
               WHERE lower(email) = ?`
            ).run(previousPresidentAction, previousPresidentReason, today, prevEmail);

            db.prepare(
              `UPDATE account_requests SET status = ?, deactivation_reason = ?, deactivation_date = ? WHERE lower(email) = ?`
            ).run(previousPresidentAction, previousPresidentReason, today, prevEmail);

            db.prepare(
              `UPDATE members SET status = ?, exit_reason = ?, exit_date = ? WHERE lower(email) = ?`
            ).run(previousPresidentAction, previousPresidentReason, today, prevEmail);
          } else {
            const fallbackRole: MemberRole = 'Estudiante Investigador Líder';
            db.prepare(
              `UPDATE users SET role = ?, color = 'from-[#0F2D59] to-[#1E3A8A]' WHERE lower(email) = ?`
            ).run(fallbackRole, prevEmail);

            db.prepare(`UPDATE account_requests SET role = ? WHERE lower(email) = ?`).run(
              fallbackRole,
              prevEmail
            );

            db.prepare(
              `UPDATE members SET role = ?, degree = ?, avatar_color = 'from-[#0F2D59] to-[#1E3A8A]' WHERE lower(email) = ?`
            ).run(fallbackRole, `${fallbackRole} · USB Cali`, prevEmail);
          }
        }
      }

      db.prepare(`UPDATE users SET role = ?, color = ? WHERE lower(email) = ?`).run(
        newRole,
        targetColor,
        email
      );

      db.prepare(`UPDATE account_requests SET role = ? WHERE lower(email) = ?`).run(
        newRole,
        email
      );

      db.prepare(
        `UPDATE members SET role = ?, degree = ?, avatar_color = ? WHERE lower(email) = ?`
      ).run(newRole, targetDegree, targetColor, email);
    });

    roleTx();

    res.json({
      accountRequests: listAccountRequests(),
      approvedUsers: listApprovedUsers(),
      members: listMembers(),
      leadershipAccounts: listLeadershipAccounts(),
    });
  });

  // Director-Only: Reactivate Member / Account
  app.post('/api/director/members/reactivate', requireDirector, (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      res.status(400).json({ error: 'Correo de miembro requerido.' });
      return;
    }

    const currentPeriod = `${new Date().getFullYear()} - Presente`;

    const reactivateTx = db.transaction(() => {
      db.prepare(
        `UPDATE users SET status = 'aprobada', deactivation_reason = NULL, deactivation_date = NULL WHERE lower(email) = ?`
      ).run(email);

      db.prepare(
        `UPDATE account_requests SET status = 'aprobada', deactivation_reason = NULL, deactivation_date = NULL WHERE lower(email) = ?`
      ).run(email);

      db.prepare(
        `UPDATE members SET status = 'activo', exit_reason = NULL, exit_date = NULL, period = ? WHERE lower(email) = ?`
      ).run(currentPeriod, email);
    });

    reactivateTx();

    res.json({
      accountRequests: listAccountRequests(),
      approvedUsers: listApprovedUsers(),
      members: listMembers(),
      leadershipAccounts: listLeadershipAccounts(),
    });
  });

  // Director-Only: Reset a member's password (revokes active sessions & re-enables one-time password setup)
  app.post('/api/director/members/reset-password', requireDirector, (req, res) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      res.status(400).json({ error: 'Correo del integrante requerido.' });
      return;
    }
    if (email === 'imcabezas@usbcali.edu.co') {
      res.status(400).json({
        error: 'Para cambiar tu propia contraseña de Director, utiliza la pestaña Seguridad en tu portal.',
      });
      return;
    }
    if (getEnvPasscodeForEmail(email)) {
      res.status(403).json({
        error: 'Esta cuenta utiliza una clave definida en las variables de entorno del servidor.',
      });
      return;
    }

    const result = db
      .prepare(
        `UPDATE users
         SET password_hash = NULL, token_version = token_version + 1
         WHERE lower(email) = ? AND status = 'aprobada'`
      )
      .run(email);

    if (result.changes === 0) {
      res.status(404).json({ error: 'No se encontró una cuenta activa con ese correo.' });
      return;
    }

    res.json({
      ok: true,
      leadershipAccounts: listLeadershipAccounts(),
      message:
        'Contraseña restablecida y sesiones cerradas. El miembro deberá definir una nueva contraseña al iniciar sesión.',
    });
  });

  // Catch-all for unknown API routes
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada.' });
  });

  const PORT = Number(process.env.PORT) || 3000;
  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(distDir, 'index.html'));

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Semillero USB Cali server running on http://0.0.0.0:${PORT} (SQLite active)`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
