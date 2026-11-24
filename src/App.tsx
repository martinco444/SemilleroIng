import React, { useState, useEffect, useCallback } from 'react';
import {
  Project,
  Member,
  MemberRole,
  CalendarEvent,
  NewsArticle,
  AuthUser,
  ResearchLog,
  JoinApplication,
  AccountRequest,
  ContactMessage,
} from './types';
import { api } from './services/api';
import type { AuthResponse, LeadershipAccount } from './services/api';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProjectsSection } from './components/ProjectsSection';
import { MembersSection } from './components/MembersSection';
import { EventsSection } from './components/EventsSection';
import { NewsSection } from './components/NewsSection';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { MemberPortalModal } from './components/MemberPortalModal';
import { ContactJoinModal } from './components/ContactJoinModal';
import { DirectorApprovalModal } from './components/DirectorApprovalModal';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [researchLogs, setResearchLogs] = useState<ResearchLog[]>([]);
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<AuthUser[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [leadershipAccounts, setLeadershipAccounts] = useState<LeadershipAccount[]>([]);

  // Auth session kept strictly in memory (never stored in localStorage/sessionStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Modal open states
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [portalModalOpen, setPortalModalOpen] = useState(false);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [directorModalOpen, setDirectorModalOpen] = useState(false);

  const loadBootstrap = useCallback(async (token?: string | null) => {
    try {
      const data = await api.bootstrap(token);
      setProjects(data.projects);
      setMembers(data.members);
      setEvents(data.events);
      setNews(data.news);
      setLeadershipAccounts(data.leadershipAccounts || []);
      setCurrentUser(data.currentUser);
      setResearchLogs(data.researchLogs || []);
      setAccountRequests(data.accountRequests || []);
      setApprovedUsers(data.approvedUsers || []);
      setContactMessages(data.contactMessages || []);
    } catch (err) {
      console.error('Error loading semillero data from SQLite:', err);
    }
  }, []);

  useEffect(() => {
    void loadBootstrap(null);
  }, [loadBootstrap]);

  const handleAuthSuccess = (auth: AuthResponse) => {
    setAuthToken(auth.token);
    setCurrentUser(auth.user);
    setLeadershipAccounts(auth.leadershipAccounts || []);
    setResearchLogs(auth.researchLogs || []);
    if (auth.accountRequests) setAccountRequests(auth.accountRequests);
    if (auth.approvedUsers) setApprovedUsers(auth.approvedUsers);
    if (auth.contactMessages) setContactMessages(auth.contactMessages);
    setLoginModalOpen(false);
  };

  const handleLogout = () => {
    if (authToken) {
      void api.logout(authToken).catch(() => {
        // Session will also be cleared locally in memory
      });
    }
    setAuthToken(null);
    setCurrentUser(null);
    setResearchLogs([]);
    setAccountRequests([]);
    setApprovedUsers([]);
    setContactMessages([]);
    setPortalModalOpen(false);
    setDirectorModalOpen(false);
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!authToken) {
      throw new Error('Debes iniciar sesión para cambiar tu contraseña.');
    }
    const res = await api.changePassword(authToken, currentPassword, newPassword);
    setAuthToken(res.token);
    return res.message;
  };

  const handleOpenDirectorPanel = async () => {
    setDirectorModalOpen(true);
    if (!authToken) return;
    try {
      const overview = await api.getDirectorOverview(authToken);
      setAccountRequests(overview.accountRequests);
      setApprovedUsers(overview.approvedUsers);
      setMembers(overview.members);
      setContactMessages(overview.contactMessages || []);
    } catch (err) {
      console.error('Error refreshing director panel:', err);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!authToken) return;
    try {
      const res = await api.approveRequest(authToken, requestId);
      setAccountRequests(res.accountRequests);
      setApprovedUsers(res.approvedUsers);
      setMembers(res.members);
    } catch (err) {
      console.error('Error approving request:', err);
    }
  };

  const handleRejectRequest = async (requestId: string, reason?: string) => {
    if (!authToken) return;
    try {
      const res = await api.rejectRequest(authToken, requestId, reason);
      setAccountRequests(res.accountRequests);
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  const handleDeactivateAccount = async (
    email: string,
    reasonType: 'graduado' | 'retirado' | 'desactivada',
    reasonDetails: string,
    period?: string
  ) => {
    if (!authToken) return;
    try {
      const res = await api.deactivateMember(authToken, {
        email,
        reasonType,
        reasonDetails,
        period,
      });
      setAccountRequests(res.accountRequests);
      setApprovedUsers(res.approvedUsers);
      setMembers(res.members);
      setLeadershipAccounts(res.leadershipAccounts || []);
    } catch (err) {
      console.error('Error deactivating member:', err);
    }
  };

  const handleReactivateAccount = async (email: string) => {
    if (!authToken) return;
    try {
      const res = await api.reactivateMember(authToken, email);
      setAccountRequests(res.accountRequests);
      setApprovedUsers(res.approvedUsers);
      setMembers(res.members);
      setLeadershipAccounts(res.leadershipAccounts || []);
    } catch (err) {
      console.error('Error reactivating member:', err);
    }
  };

  const handleUpdateMemberRole = async (
    email: string,
    newRole: MemberRole,
    previousPresidentAction?: 'keep_active' | 'graduado' | 'retirado',
    previousPresidentReason?: string
  ) => {
    if (!authToken) return;
    const res = await api.updateMemberRole(authToken, {
      email,
      newRole,
      previousPresidentAction,
      previousPresidentReason,
    });
    setAccountRequests(res.accountRequests);
    setApprovedUsers(res.approvedUsers);
    setMembers(res.members);
    setLeadershipAccounts(res.leadershipAccounts || []);
  };

  const handleResetMemberPassword = async (email: string) => {
    if (!authToken) return;
    const res = await api.resetMemberPassword(authToken, email);
    setLeadershipAccounts(res.leadershipAccounts || []);
    return res.message;
  };

  const handleAddNewProject = async (newProject: Project) => {
    if (!authToken) return;
    try {
      const { project } = await api.createProject(authToken, newProject);
      setProjects((prev) => [project, ...prev]);
    } catch (err) {
      console.error('Error saving project to SQLite:', err);
    }
  };

  const handleAddResearchLog = async (newLog: ResearchLog) => {
    if (!authToken) return;
    try {
      const { log } = await api.createResearchLog(authToken, newLog);
      setResearchLogs((prev) => [log, ...prev]);
    } catch (err) {
      console.error('Error saving research log to SQLite:', err);
    }
  };

  const handleSaveApplication = async (newApp: JoinApplication) => {
    await api.submitApplication(newApp);
    if (
      authToken &&
      (currentUser?.role === 'Docente Director' ||
        currentUser?.email.toLowerCase() === 'imcabezas@usbcali.edu.co')
    ) {
      const overview = await api.getDirectorOverview(authToken);
      setAccountRequests(overview.accountRequests);
    }
  };

  const handleSaveContactMessage = async (payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    await api.submitContactMessage(payload);
    if (
      authToken &&
      (currentUser?.role === 'Docente Director' ||
        currentUser?.email.toLowerCase() === 'imcabezas@usbcali.edu.co')
    ) {
      const overview = await api.getDirectorOverview(authToken);
      setContactMessages(overview.contactMessages || []);
    }
  };

  const handleUpdateContactStatus = async (id: string, status: 'nuevo' | 'atendido') => {
    if (!authToken) return;
    try {
      const res = await api.updateContactMessageStatus(authToken, id, status);
      setContactMessages(res.contactMessages);
    } catch (err) {
      console.error('Error updating contact message status:', err);
    }
  };

  const handleAddNewEvent = async (newEvent: CalendarEvent) => {
    if (!authToken) return;
    try {
      const { event } = await api.createEvent(authToken, newEvent);
      setEvents((prev) => [event, ...prev]);
    } catch (err) {
      console.error('Error saving event to SQLite:', err);
    }
  };

  const handleAddNewArticle = async (newArticle: NewsArticle) => {
    if (!authToken) return;
    try {
      const { article } = await api.createNews(authToken, newArticle);
      setNews((prev) => [article, ...prev]);
    } catch (err) {
      console.error('Error saving news article to SQLite:', err);
    }
  };

  const handleRegisterForEvent = async (
    eventId: string,
    studentName: string,
    studentEmail: string
  ) => {
    try {
      const { events: updatedEvents } = await api.registerForEvent(
        eventId,
        studentName,
        studentEmail
      );
      setEvents(updatedEvents);
    } catch (err) {
      console.error('Error registering for event:', err);
    }
  };

  const handleExploreProjects = () => {
    const el = document.getElementById('proyectos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const pendingRequestsCount = accountRequests.filter((r) => r.status === 'pendiente').length;
  const activePresidentName = members.find(
    (m) => m.role === 'Presidente del Semillero' && (!m.status || m.status === 'activo')
  )?.name;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#EA580C] selection:text-white">
      {/* Top Header Navigation */}
      <Header
        currentUser={currentUser}
        onOpenLogin={() => setLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenPortal={() => setPortalModalOpen(true)}
        onOpenJoinModal={() => setJoinModalOpen(true)}
        pendingRequestsCount={pendingRequestsCount}
        onOpenDirectorPanel={handleOpenDirectorPanel}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onExploreProjects={handleExploreProjects}
          onOpenJoinModal={() => setJoinModalOpen(true)}
        />

        {/* Projects Repository */}
        <ProjectsSection
          projects={projects}
          currentUser={currentUser}
          activePresidentName={activePresidentName}
          onOpenNewProjectModal={() => {
            if (currentUser) {
              setPortalModalOpen(true);
            } else {
              setLoginModalOpen(true);
            }
          }}
          onOpenLogin={() => setLoginModalOpen(true)}
        />

        {/* Members: Active & Past */}
        <MembersSection members={members} />

        {/* Events Calendar */}
        <EventsSection
          events={events}
          onRegisterForEvent={handleRegisterForEvent}
          onAddNewEvent={handleAddNewEvent}
          currentUser={currentUser}
          activePresidentName={activePresidentName}
          onOpenLogin={() => setLoginModalOpen(true)}
        />

        {/* News and Bulletins */}
        <NewsSection
          news={news}
          onAddNewArticle={handleAddNewArticle}
          currentUser={currentUser}
          onOpenLogin={() => setLoginModalOpen(true)}
        />
      </main>

      {/* Institutional Footer */}
      <Footer
        onOpenJoinModal={() => setJoinModalOpen(true)}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        leadershipAccounts={leadershipAccounts}
        onAuthSuccess={handleAuthSuccess}
        onRegisterSuccess={() => {
          if (authToken) void loadBootstrap(authToken);
        }}
      />

      {currentUser && (
        <MemberPortalModal
          isOpen={portalModalOpen}
          onClose={() => setPortalModalOpen(false)}
          currentUser={currentUser}
          activePresidentName={activePresidentName}
          projects={projects}
          researchLogs={researchLogs}
          onAddResearchLog={handleAddResearchLog}
          onAddNewProject={handleAddNewProject}
          onAddNewEvent={handleAddNewEvent}
          onAddNewArticle={handleAddNewArticle}
          onOpenDirectorPanel={handleOpenDirectorPanel}
          onChangePassword={handleChangePassword}
          pendingRequestsCount={pendingRequestsCount}
        />
      )}

      {/* Director Approval Panel - Exclusive for Dr. Iván Mauricio Cabezas */}
      <DirectorApprovalModal
        isOpen={directorModalOpen}
        onClose={() => setDirectorModalOpen(false)}
        currentUser={currentUser}
        accountRequests={accountRequests}
        onApproveRequest={handleApproveRequest}
        onRejectRequest={handleRejectRequest}
        members={members}
        approvedUsers={approvedUsers}
        onDeactivateAccount={handleDeactivateAccount}
        onReactivateAccount={handleReactivateAccount}
        onUpdateMemberRole={handleUpdateMemberRole}
        onResetMemberPassword={handleResetMemberPassword}
        contactMessages={contactMessages}
        onUpdateContactStatus={handleUpdateContactStatus}
      />

      <ContactJoinModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
        onSaveApplication={handleSaveApplication}
        onSaveContactMessage={handleSaveContactMessage}
      />
    </div>
  );
}
