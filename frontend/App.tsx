import React, { useState, useEffect } from 'react';
import { AdminDashboard } from './pages/AdminDashboard';
import { ClientCRM } from './pages/ClientCRM';
import { PublicTerminal } from './pages/PublicTerminal';
import { ForgotPasswordScreen, ResetPasswordScreen, FirstAccessChangeScreen } from './pages/AuthScreens';
import { OnboardingModal } from './pages/OnboardingModal';
import {
  LayoutDashboard,
  Users,
  Settings,
  Moon,
  Sun,
  Menu,
  LogOut,
  UserPlus,
  Download,
  UserCircle,
  Calendar,
  ArrowRight,
  Star,
  ChevronLeft,
  AlertTriangle,
  X,
  Smartphone,
  Bell,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Button, Input } from './components/ui';
import { Contact, PlanType } from './types';
import api from './services/api';

type Role = 'admin' | 'client' | 'terminal' | null;
type ClientTab = 'dashboard' | 'clients' | 'loyalty' | 'devices' | 'visits' | 'new' | 'export' | 'account';

const CPLogo: React.FC<{ className?: string, hideText?: boolean, light?: boolean }> = ({ 
  className = "h-7", 
  hideText = false,
  light = false 
}) => {
  const title = "CP GESTÃO";
  const subtitle = "CREATIVE PRINT";

  return (
    <div className={`flex items-center gap-2.5 flex-shrink-0 ${className}`}>
      {/* 4 Colored Blocks Logo Mark */}
      <div className="grid grid-cols-2 gap-[1.5px] w-7 h-7 flex-shrink-0">
        {/* Top Left: Large Magenta */}
        <div className="bg-[#E5157A] rounded-[1px]"></div>

        {/* Top Right: Mini Grid */}
        <div className="grid grid-cols-2 gap-[1px]">
          <div className="bg-[#FFF200] rounded-[0.5px]"></div> {/* Small Yellow */}
          <div className=""></div> {/* Empty Top-Right */}
          <div className="bg-[#38b6ff] rounded-[0.5px]"></div> {/* Small Blue */}
          <div className="bg-[#E5157A] rounded-[0.5px]"></div> {/* Small Magenta */}
        </div>

        {/* Bottom Left: Large Blue */}
        <div className="bg-[#38b6ff] rounded-[1px]"></div>

        {/* Bottom Right: Large Yellow */}
        <div className="bg-[#FFF200] rounded-[1px]"></div>
      </div>

      {/* Text Part */}
      {!hideText && (
        <div className="flex flex-col justify-center select-none whitespace-nowrap">
          {/* Main Title */}
          <div className={`text-[20px] font-black tracking-[-0.02em] leading-none ${light ? 'text-black' : 'text-slate-900'}`}>
            {title}
          </div>

          {/* Subtitle - Justified to match title width */}
          <div className={`flex justify-between items-center text-[5.8px] font-bold mt-0.5 ${light ? 'text-slate-500' : 'text-slate-500'}`}>
            {subtitle.split("").map((char, index) => (
              <span key={index} className="flex-shrink-0">
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const SidebarItem: React.FC<{
  icon: any,
  label: string,
  active?: boolean,
  onClick: () => void,
  collapsed: boolean,
  id?: string,
  onboardingActive?: boolean
}> = ({ icon: Icon, label, active, onClick, collapsed, id, onboardingActive }) => (
  <button
    id={id}
    onClick={onClick}
    className={`w-full flex items-center px-4 py-2.5 mb-1.5 rounded-lg transition-all duration-200 group ${active
      ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
      : 'text-slate-500 hover:bg-slate-100/50 dark:text-slate-400 dark:hover:bg-slate-800'
      } ${onboardingActive ? 'ring-2 ring-blue-500/20' : ''}`}
  >
    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-[#38B6FF]' : 'text-slate-400 group-hover:text-[#38B6FF] dark:text-slate-500 dark:group-hover:text-white'}`} />
    {!collapsed && (
      <span className={`ml-3 text-sm whitespace-nowrap overflow-hidden ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
    )}
  </button>
);

const App: React.FC = () => {
  const [authRole, setAuthRole] = useState<Role>(null);
  const [clientTab, setClientTab] = useState<ClientTab>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'login' | 'forgot-password' | 'reset-password' | 'first-access'>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [accountSettings, setAccountSettings] = useState<any>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5); // A4

      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio alert failed:', e);
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) root.classList.add('dark');
    else root.classList.remove('dark');
  }, [darkMode]);

  // Check login on load
  useEffect(() => {
    const isPublic = window.location.pathname.startsWith('/terminal') || window.location.pathname.startsWith('/p/');
    if (isPublic) return;

    const token = localStorage.getItem('auth_token');
    if (token) {
      api.get('/me').then(res => {
        setUserData(res.data);
        setAuthRole(res.data.role);
        if (res.data.tenant) {
          setTenantSlug(res.data.tenant.slug);
        }
        if (res.data.role === 'client') {
          const params = new URLSearchParams(window.location.search);
          const urlTab = params.get('tab') as ClientTab;
          if (urlTab) setClientTab(urlTab);

          fetchContacts();
          fetchDashboardMetrics();
          if (!res.data.onboarding_completed) {
            setShowOnboarding(true);
          }
          fetchAccountSettings();
        }
      }).catch((err) => {
        if (err.response?.status === 403) {
          setBlockedReason(err.response.data.error || 'Acesso Suspenso');
          setAuthRole('client'); // Still set as client to show the layout but with blocked content
        } else {
          localStorage.removeItem('auth_token');
        }
      });
    }
  }, []);

  // Check for reset password token in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    const email = params.get('email');
    if (token && email) {
      setResetToken(token);
      setResetEmail(email);
      setAuthView('reset-password');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/client/contacts');
      const mapped = (Array.isArray(res.data) ? res.data : [])
        .map((c: any) => {
          if (!c) return null;
          return {
            ...c,
            name: c.name || '',
            phone: c.phone || '',
            pointsBalance: c.points_balance ?? c.pointsBalance ?? 0,
            loyaltyLevel: c.loyalty_level ?? 1,
            loyalty_level_name: c.loyalty_level_name,
            postalCode: c.postal_code,
            address: c.address,
            linkedCard: c.devices && c.devices.length > 0 ? (c.devices[0].uid_formatted || c.devices[0].uid) : null,
            lastContacted: c.last_contacted ?? c.lastContacted,
            reminderDate: c.reminder_date ?? c.reminderDate,
            reminderText: c.reminder_text ?? c.reminderText,
            totalSpent: c.total_spent ?? c.totalSpent ?? 0,
            averageTicket: c.average_ticket ?? c.averageTicket ?? 0,
            attendanceCount: c.attendance_count ?? c.attendanceCount ?? 0,
          };
        })
        .filter(Boolean);
      setContacts(mapped as any);
      setBlockedReason(null);
    } catch (error: any) {
      if (error.response?.status === 403) {
        setBlockedReason(error.response.data.error || 'Acesso Suspenso');
      }
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchDashboardMetrics = async (params = {}) => {
    try {
      const res = await api.get('/client/dashboard/metrics', { params });
      setDashboardMetrics(res.data);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    }
  };

  const fetchPendingRequestsCount = async (shouldNotify = false) => {
    try {
      const res = await api.get('/client/visits');
      const newCount = res.data.pending_count;

      if (shouldNotify && newCount > pendingRequestsCount && accountSettings?.telegram_sound_points) {
        playNotificationSound();
      }

      setPendingRequestsCount(newCount);
    } catch (error) {
      console.error('Error fetching requests count:', error);
    }
  };

  const fetchAccountSettings = async () => {
    try {
      const res = await api.get('/client/settings');
      setAccountSettings(res.data.settings);
    } catch (error) {
      console.error('Error fetching account settings:', error);
    }
  };

  const refreshAllData = (params = {}) => {
    if (authRole === 'client') {
      fetchContacts();
      fetchDashboardMetrics(params);
      fetchPendingRequestsCount();
    }
  };

  // Re-fetch when switching to dashboard or clients tab to ensure fresh data
  useEffect(() => {
    if (authRole === 'client' && (clientTab === 'dashboard' || clientTab === 'clients' || clientTab === 'visits')) {
      refreshAllData();
    }
  }, [clientTab, authRole]);

  // Periodic polling for data updates (Real-time dashboard updates)
  useEffect(() => {
    let interval: any;
    if (authRole === 'client') {
      interval = setInterval(() => {
        // We refresh everything to ensure points and new registrations are picked up
        refreshAllData();
      }, 12000); // Poll every 12 seconds
    }
    return () => clearInterval(interval);
  }, [authRole, clientTab, pendingRequestsCount, accountSettings]);

  const handleLogin = async (email?: string, password?: string) => {
    setIsLoading(true);
    try {
      const res = await api.post('/auth/login', {
        email: (email || loginForm.email).trim().replace(/\.+$/, ''),
        password: password || loginForm.password,
      });

      const user = res.data.user;

      if (user.must_change_password) {
        localStorage.setItem('auth_token', res.data.access_token);
        setAuthView('first-access');
        return;
      }

      localStorage.setItem('auth_token', res.data.access_token);
      setUserData(user);
      setAuthRole(user.role);
      if (user.tenant) {
        setTenantSlug(user.tenant.slug);
      }
      if (user.role === 'client') {
        const params = new URLSearchParams(window.location.search);
        const urlTab = params.get('tab') as ClientTab;
        if (urlTab) {
          setClientTab(urlTab);
        } else {
          setClientTab('dashboard');
        }

        fetchContacts();
        fetchDashboardMetrics();
        if (!user.onboarding_completed) {
          setShowOnboarding(true);
        }
        fetchAccountSettings();
      }
    } catch (error: any) {
      setLoginError(error.response?.data?.error || 'Acesso negado. Verifique seu e-mail e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setAuthRole(null);
    setTenantSlug(null);
    setShowOnboarding(false);
    setIsMobileMenuOpen(false);
  };

  const handleCompleteOnboarding = async () => {
    try {
      await api.post('/auth/complete-onboarding');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setShowOnboarding(false); // Still hide it to not block the user
    }
  };

  const updateSingleContactPoints = (phone: string, pointsToAdd: number) => {
    setContacts(prev => prev.map(c => {
      if (c.phone === phone || c.phone.replace(/\D/g, '') === phone.replace(/\D/g, '')) {
        return { ...c, pointsBalance: (c.pointsBalance || 0) + pointsToAdd };
      }
      return c;
    }));
  };

  const registerNewContact = (contact: Contact) => {
    setContacts(prev => [contact, ...prev]);
  };

  const isPublicTerminal = window.location.pathname.includes('/terminal') || window.location.pathname.includes('/p/');

  if (isPublicTerminal) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
        <PublicTerminal />
      </div>
    );
  }

  if (authRole === 'terminal') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans">
        <div className="absolute top-6 left-6 z-50">
          <Button variant="ghost" onClick={() => setAuthRole('client')} className="text-gray-500 bg-white/80 backdrop-blur shadow-sm">
            <ChevronLeft className="w-4 h-4 mr-2" /> Voltar ao Painel
          </Button>
        </div>
        <PublicTerminal
          slug={tenantSlug || undefined}
          forceShowOwnerActions={true}
          contacts={contacts}
          onUpdatePoints={updateSingleContactPoints}
          onQuickRegister={registerNewContact}
        />
      </div>
    );
  }

  if (!authRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 font-sans transition-colors">
        <div className="bg-white dark:bg-gray-900 w-full max-w-[420px] p-8 md:p-10 rounded-[2rem] shadow-xl shadow-gray-200/50 dark:shadow-none border-t-[6px] border-t-[#25aae1] relative z-10">
          <div className="flex items-center justify-center mb-8">
            <CPLogo className="h-16" />
          </div>

          {authView === 'login' && (
            <div className="space-y-5">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                placeholder="seu@email.com"
                value={loginForm.email}
                onChange={(e) => { setLoginForm({ ...loginForm, email: e.target.value }); setLoginError(null); }}
              />
              <div className="space-y-1">
                <Input
                  label="Senha"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  value={loginForm.password}
                  onChange={(e) => { setLoginForm({ ...loginForm, password: e.target.value }); setLoginError(null); }}
                />
                <div className="text-right">
                  <button
                    onClick={() => setAuthView('forgot-password')}
                    className="text-xs font-bold text-[#25aae1] hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </div>
              {loginError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl animate-shake">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-red-600 uppercase tracking-tight">Falha na Autenticação</p>
                      <p className="text-[11px] text-red-500 font-medium leading-tight mt-0.5">{loginError}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                className="w-full py-3.5 bg-[#25aae1] hover:bg-[#1c98ce] text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                onClick={() => handleLogin()}
                disabled={isLoading}
              >
                {isLoading ? 'Entrando...' : 'Entrar'} <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {authView === 'forgot-password' && (
            <ForgotPasswordScreen onBack={() => setAuthView('login')} />
          )}

          {authView === 'first-access' && (
            <FirstAccessChangeScreen
              onBack={() => { handleLogout(); setAuthView('login'); }}
              onSuccess={() => {
                // Refresh user data after password change
                api.get('/me').then(res => {
                  setUserData(res.data);
                  setAuthRole(res.data.role);
                  if (res.data.tenant) setTenantSlug(res.data.tenant.slug);
                  if (res.data.role === 'client') {
                    fetchContacts();
                    if (!res.data.onboarding_completed) {
                      setShowOnboarding(true);
                    }
                  }
                  setAuthView('login');
                });
              }}
            />
          )}

          {authView === 'reset-password' && resetToken && (
            <ResetPasswordScreen
              token={resetToken}
              email={resetEmail || ''}
              onBack={() => setAuthView('login')}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden font-sans">


      {authRole !== 'admin' && (
        <aside className={`
          hidden md:flex flex-col z-40 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300
          ${sidebarCollapsed ? 'w-20' : 'w-72'}
        `}>
          <div className="h-24 flex items-center px-6 mb-2">
            <div className="flex items-center justify-between w-full">
              {!sidebarCollapsed ? (
                <CPLogo light={darkMode} />
              ) : (
                <div className="mx-auto"><CPLogo hideText={true} /></div>
              )}
              <button className="md:hidden p-2 text-gray-500" onClick={() => setIsMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 px-4 py-2 overflow-y-auto no-scrollbar">
            <SidebarItem id="side-tab-dashboard" icon={LayoutDashboard} label="DASHBOARD" onboardingActive={showOnboarding && clientTab === 'dashboard'} active={clientTab === 'dashboard'} onClick={() => { setClientTab('dashboard'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />

            <div className="relative">
              <SidebarItem id="side-tab-visits" icon={Calendar} label="SOLICITAÇÕES DE PONTOS" active={clientTab === 'visits'} onClick={() => { setClientTab('visits'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
              {pendingRequestsCount > 0 && (
                <div className={`absolute ${sidebarCollapsed ? 'top-1 right-3' : 'top-3 right-4'} bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-900 pointer-events-none`}>
                  {pendingRequestsCount}
                </div>
              )}
            </div>

            <SidebarItem id="side-tab-loyalty" icon={Star} label="PROGRAMA DE FIDELIDADE" onboardingActive={showOnboarding && clientTab === 'loyalty'} active={clientTab === 'loyalty'} onClick={() => { setSelectedContact(null); setClientTab('loyalty'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
            <SidebarItem id="side-tab-new" icon={UserPlus} label="NOVO CADASTRO" onboardingActive={showOnboarding && clientTab === 'new'} active={clientTab === 'new'} onClick={() => { setSelectedContact(null); setClientTab('new'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
            <SidebarItem id="side-tab-clients" icon={Users} label="MEUS CLIENTES" onboardingActive={showOnboarding && clientTab === 'clients'} active={clientTab === 'clients'} onClick={() => { setSelectedContact(null); setClientTab('clients'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
            <SidebarItem id="side-tab-export" icon={Download} label="EXPORTAR DADOS" onboardingActive={showOnboarding && clientTab === 'export'} active={clientTab === 'export'} onClick={() => { setSelectedContact(null); setClientTab('export'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
            <SidebarItem id="side-tab-account" icon={Settings} label="CONFIGURAÇÕES" onboardingActive={showOnboarding && clientTab === 'account'} active={clientTab === 'account'} onClick={() => { setSelectedContact(null); setClientTab('account'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
          </div>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-1">
            <button onClick={handleLogout} className={`w-full flex items-center px-4 py-2.5 text-sm font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-lg transition-colors uppercase tracking-widest ${sidebarCollapsed ? 'justify-center' : ''}`}>
              <LogOut className={`w-4 h-4 ${sidebarCollapsed ? '' : 'mr-3'} text-slate-400 group-hover:text-rose-500 shrink-0`} />
              {!sidebarCollapsed && "SAIR"}
            </button>
          </div>
        </aside>
      )}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-[#f8fafc] dark:bg-gray-950">
        <header className="flex-shrink-0 h-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 z-10 transition-colors">
          <div className="flex items-center gap-4">
            {authRole === 'admin' ? (
              <CPLogo className="w-10 h-10" light={darkMode} />
            ) : (
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">PAINEL DE GESTÃO</span>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight mt-0.5">
                   {userData?.tenant?.name || 'Sushi Elite'}
                </h1>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {authRole !== 'admin' && (
              <>
                <button className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                </button>
                <button 
                  onClick={() => setClientTab('account')}
                  className={`p-2.5 transition-colors ${clientTab === 'account' ? 'text-[#38B6FF] bg-blue-50 dark:bg-blue-900/20 rounded-xl' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                >
                  <Settings className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 ml-1 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-slate-50 dark:bg-slate-800">
                  {userData?.tenant?.logo_url ? (
                    <img src={userData.tenant.logo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                </div>
              </>
            )}
            {authRole === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-2" /> Sair
              </Button>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 scroll-smooth no-scrollbar">
          <div className="max-w-[1400px] mx-auto w-full px-1 pb-12">
            {authRole === 'admin' ? (
              <AdminDashboard />
            ) : blockedReason ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Acesso Suspenso</h2>
                  <p className="text-gray-500 max-w-md mx-auto font-medium">
                    {blockedReason === 'Plano Expirado'
                      ? "O período de validade do seu plano terminou. Entre em contato com o suporte para renovar seu acesso."
                      : "Você atingiu o limite de contatos do seu plano atual. Realize o upgrade para continuar utilizando o CRM."}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm inline-block">
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Motivo: <span className="text-red-600">{blockedReason}</span></p>
                </div>
                <Button className="bg-[#25aae1] text-white px-10 h-14 rounded-2xl font-bold" onClick={() => window.open('https://wa.me/819011886491', '_blank')}>
                  FALAR COM SUPORTE
                </Button>
              </div>
            ) : (
              <ClientCRM
                tenantPlan={userData?.tenant?.plan as PlanType}
                contacts={contacts}
                setContacts={setContacts}
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
                metrics={dashboardMetrics}
                onRefresh={refreshAllData}
                activeTab={clientTab}
                onChangeTab={setClientTab}
                onTerminalMode={() => setAuthRole('terminal')}
                tenantSlug={tenantSlug}
                darkMode={darkMode}
                setDarkMode={setDarkMode}
              />
            )}
          </div>
        </div>

        {/* Bottom Navigation Mobile - PERSISTENTE NA BASE (SEM SOBREPOSIÇÃO) */}
        {authRole === 'client' && !blockedReason && (
          <nav className="md:hidden flex-shrink-0 h-20 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-around px-2 z-[60] pb-safe shadow-[0_-4px_16px_rgba(33,150,243,0.05)]">
            {/* Visão Geral */}
            <button 
              onClick={() => setClientTab('dashboard')}
              className={`flex flex-col items-center gap-1 w-[19%] transition-all ${clientTab === 'dashboard' ? 'text-[#38B6FF]' : 'text-slate-400'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${clientTab === 'dashboard' ? 'bg-[#38B6FF] text-white shadow-xl shadow-blue-500/20' : ''}`}>
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.05em] text-center ${clientTab === 'dashboard' ? 'opacity-100' : 'opacity-60'}`}>Geral</span>
            </button>

            {/* Solicitações de Pontos */}
            <button 
              onClick={() => setClientTab('visits')}
              className={`flex flex-col items-center gap-1 w-[19%] transition-all relative ${clientTab === 'visits' ? 'text-[#38B6FF]' : 'text-slate-400'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${clientTab === 'visits' ? 'bg-[#38B6FF] text-white shadow-xl shadow-blue-500/20' : ''}`}>
                <Activity className="w-5 h-5" />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.05em] text-center ${clientTab === 'visits' ? 'opacity-100' : 'opacity-60'}`}>Solicitações</span>
              {pendingRequestsCount > 0 && (
                <div className="absolute top-1 right-2 w-4 h-4 bg-red-500 rounded-lg flex items-center justify-center text-[8px] font-bold text-white border-2 border-white dark:border-gray-900 shadow-sm">
                  {pendingRequestsCount}
                </div>
              )}
            </button>

            {/* Programa de Fidelidade */}
            <button 
              onClick={() => setClientTab('loyalty')}
              className={`flex flex-col items-center gap-1 w-[19%] transition-all ${clientTab === 'loyalty' ? 'text-[#38B6FF]' : 'text-slate-400'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${clientTab === 'loyalty' ? 'bg-[#38B6FF] text-white shadow-xl shadow-blue-500/20' : ''}`}>
                <Star className="w-5 h-5" />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.05em] text-center ${clientTab === 'loyalty' ? 'opacity-100' : 'opacity-60'}`}>Fidelidade</span>
            </button>

            {/* Meus Clientes */}
            <button 
              onClick={() => setClientTab('clients')}
              className={`flex flex-col items-center gap-1 w-[19%] transition-all ${clientTab === 'clients' ? 'text-[#38B6FF]' : 'text-slate-400'}`}
            >
              <div className={`p-2 rounded-2xl transition-all ${clientTab === 'clients' ? 'bg-[#38B6FF] text-white shadow-xl shadow-blue-500/20' : ''}`}>
                <Users className="w-5 h-5" />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.05em] text-center ${clientTab === 'clients' ? 'opacity-100' : 'opacity-60'}`}>Clientes</span>
            </button>

            {/* Sair */}
            <button 
              onClick={() => {
                localStorage.removeItem('token');
                setAuthRole(null);
                window.location.reload();
              }}
              className="flex flex-col items-center gap-1 w-[19%] transition-all text-slate-400 hover:text-red-500"
            >
              <div className="p-2 rounded-2xl transition-all">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-[0.05em] text-center opacity-60">Sair</span>
            </button>
          </nav>
        )}
      </main>

      {showOnboarding && (
        <OnboardingModal
          onComplete={handleCompleteOnboarding}
          onChangeTab={(tab) => setClientTab(tab as any)}
        />
      )}
    </div>
  );
};

export default App;
