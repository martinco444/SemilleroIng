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
  MemberRole,
} from '../types';

export interface LeadershipAccount {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  initials: string;
  color: string;
  needsPasswordSetup: boolean;
}

export interface BootstrapResponse {
  projects: Project[];
  members: Member[];
  events: CalendarEvent[];
  news: NewsArticle[];
  leadershipAccounts: LeadershipAccount[];
  currentUser: AuthUser | null;
  researchLogs: ResearchLog[];
  accountRequests: AccountRequest[];
  approvedUsers: AuthUser[];
  applications: JoinApplication[];
  contactMessages: ContactMessage[];
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  leadershipAccounts: LeadershipAccount[];
  researchLogs: ResearchLog[];
  accountRequests?: AccountRequest[];
  approvedUsers?: AuthUser[];
  applications?: JoinApplication[];
  contactMessages?: ContactMessage[];
}

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: Record<string, unknown>;

  constructor(message: string, status: number, code?: string, data?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

async function apiRequest<T>(
  url: string,
  options: {
    method?: string;
    token?: string | null;
    body?: unknown;
  } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;

  if (!res.ok) {
    throw new ApiError(
      typeof payload.error === 'string' ? payload.error : 'Error de comunicación con el servidor.',
      res.status,
      typeof payload.code === 'string' ? payload.code : undefined,
      payload
    );
  }

  return payload as T;
}

export const api = {
  bootstrap(token?: string | null) {
    return apiRequest<BootstrapResponse>('/api/bootstrap', { token });
  },

  login(email: string, password: string) {
    return apiRequest<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  claimPassword(email: string, password: string) {
    return apiRequest<AuthResponse>('/api/auth/claim-password', {
      method: 'POST',
      body: { email, password },
    });
  },

  logout(token: string) {
    return apiRequest<{ ok: boolean }>('/api/auth/logout', {
      method: 'POST',
      token,
    });
  },

  changePassword(token: string, currentPassword: string, newPassword: string) {
    return apiRequest<{ ok: boolean; token: string; message: string }>('/api/auth/change-password', {
      method: 'POST',
      token,
      body: { currentPassword, newPassword },
    });
  },

  registerAccount(payload: {
    name: string;
    email: string;
    password: string;
    role: MemberRole;
    program: string;
    studentCode?: string;
    motivation?: string;
  }) {
    return apiRequest<{ request: AccountRequest }>('/api/auth/register', {
      method: 'POST',
      body: payload,
    });
  },

  submitApplication(app: JoinApplication) {
    return apiRequest<{ application: JoinApplication }>('/api/applications', {
      method: 'POST',
      body: app,
    });
  },

  submitContactMessage(payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    return apiRequest<{ contactMessage: ContactMessage }>('/api/contact', {
      method: 'POST',
      body: payload,
    });
  },

  registerForEvent(eventId: string, studentName: string, studentEmail: string) {
    return apiRequest<{ events: CalendarEvent[] }>(
      `/api/events/${encodeURIComponent(eventId)}/register`,
      {
        method: 'POST',
        body: { studentName, studentEmail },
      }
    );
  },

  createProject(token: string, project: Project) {
    return apiRequest<{ project: Project }>('/api/projects', {
      method: 'POST',
      token,
      body: project,
    });
  },

  createEvent(token: string, event: CalendarEvent) {
    return apiRequest<{ event: CalendarEvent }>('/api/events', {
      method: 'POST',
      token,
      body: event,
    });
  },

  createNews(token: string, article: NewsArticle) {
    return apiRequest<{ article: NewsArticle }>('/api/news', {
      method: 'POST',
      token,
      body: article,
    });
  },

  createResearchLog(token: string, log: ResearchLog) {
    return apiRequest<{ log: ResearchLog }>('/api/research-logs', {
      method: 'POST',
      token,
      body: log,
    });
  },

  getDirectorOverview(token: string) {
    return apiRequest<{
      accountRequests: AccountRequest[];
      approvedUsers: AuthUser[];
      members: Member[];
      applications: JoinApplication[];
      contactMessages: ContactMessage[];
    }>('/api/director/overview', { token });
  },

  updateContactMessageStatus(token: string, id: string, status: 'nuevo' | 'atendido') {
    return apiRequest<{ contactMessages: ContactMessage[] }>(
      `/api/director/contacts/${encodeURIComponent(id)}/status`,
      {
        method: 'POST',
        token,
        body: { status },
      }
    );
  },

  approveRequest(token: string, requestId: string) {
    return apiRequest<{
      accountRequests: AccountRequest[];
      approvedUsers: AuthUser[];
      members: Member[];
    }>(`/api/director/requests/${encodeURIComponent(requestId)}/approve`, {
      method: 'POST',
      token,
    });
  },

  rejectRequest(token: string, requestId: string, reason?: string) {
    return apiRequest<{ accountRequests: AccountRequest[] }>(
      `/api/director/requests/${encodeURIComponent(requestId)}/reject`,
      {
        method: 'POST',
        token,
        body: { reason },
      }
    );
  },

  deactivateMember(
    token: string,
    payload: {
      email: string;
      reasonType: 'graduado' | 'retirado' | 'desactivada';
      reasonDetails: string;
      period?: string;
    }
  ) {
    return apiRequest<{
      accountRequests: AccountRequest[];
      approvedUsers: AuthUser[];
      members: Member[];
      leadershipAccounts: LeadershipAccount[];
    }>('/api/director/members/deactivate', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  updateMemberRole(
    token: string,
    payload: {
      email: string;
      newRole: MemberRole;
      previousPresidentAction?: 'keep_active' | 'graduado' | 'retirado';
      previousPresidentReason?: string;
    }
  ) {
    return apiRequest<{
      accountRequests: AccountRequest[];
      approvedUsers: AuthUser[];
      members: Member[];
      leadershipAccounts: LeadershipAccount[];
    }>('/api/director/members/role', {
      method: 'POST',
      token,
      body: payload,
    });
  },

  reactivateMember(token: string, email: string) {
    return apiRequest<{
      accountRequests: AccountRequest[];
      approvedUsers: AuthUser[];
      members: Member[];
      leadershipAccounts: LeadershipAccount[];
    }>('/api/director/members/reactivate', {
      method: 'POST',
      token,
      body: { email },
    });
  },

  resetMemberPassword(token: string, email: string) {
    return apiRequest<{
      ok: boolean;
      leadershipAccounts: LeadershipAccount[];
      message: string;
    }>('/api/director/members/reset-password', {
      method: 'POST',
      token,
      body: { email },
    });
  },
};
