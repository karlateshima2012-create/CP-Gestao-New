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
  Globe,
  Layout,
  Award,
  Zap
} from 'lucide-react';
import { Button, Input } from './components/ui';
import { Contact, PlanType } from './types';
import api from './services/api';

type Role = 'admin' | 'client' | 'terminal' | null;
type ClientTab = 'dashboard' | 'clients' | 'public_page' | 'loyalty_system' | 'settings' | 'visits' | 'new' | 'account';

const CPLogo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => (
  <div className={`grid grid-cols-2 grid-rows-2 gap-[10%] ${className}`}>
    <div className="bg-[#25aae1] rounded-[20%]"></div>
    <div className="bg-[#facc15] rounded-[20%]"></div>
    <div className="bg-[#25aae1] rounded-[20%]"></div>
    <div className="bg-[#25aae1] rounded-[20%]"></div>
  </div>
);

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
    className={`w-full flex items-center px-4 py-3 mb-2 rounded-xl transition-all duration-200 group ${active
      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
      } ${onboardingActive ? 'onboarding-pulse' : ''}`}
  >
    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-gray-700 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white'}`} />
    {!collapsed && (
      <span className="ml-3 font-medium text-sm whitespace-nowrap overflow-hidden">{label}</span>
    )}
  </button>
);

const App: React.FC = () => {
  const [authRole, setAuthRole] = useState<Role>('client'); // MOCK FOR UI REFINEMENT
  const [clientTab, setClientTab] = useState<ClientTab>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>('loja-teste');
  const [authView, setAuthView] = useState<'login' | 'forgot-password' | 'reset-password' | 'first-access'>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userData, setUserData] = useState<any>({
    name: 'Logista de Teste',
    role: 'client',
    tenant: { name: 'Loja Teste Premium', slug: 'loja-teste', plan: 'elite' }
  });
  const [contacts, setContacts] = useState<Contact[]>([
    { 
      id: '1', name: 'João Silva', phone: '11999999999', pointsBalance: 8, loyaltyLevel: 2, attendanceCount: 5, totalSpent: 1500,
      tenantId: '1', email: 'joao@example.com', tags: [], notes: '', createdAt: new Date().toISOString()
    },
    { 
      id: '2', name: 'Maria Souza', phone: '11888888888', pointsBalance: 12, loyaltyLevel: 4, attendanceCount: 10, totalSpent: 3500,
      tenantId: '1', email: 'maria@example.com', tags: [], notes: '', createdAt: new Date().toISOString()
    },
  ]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<any>({
    total_customers: 150,
    active_customers: 85,
    new_customers_30d: 12,
    total_revenue: 125000,
    visits_today: 8,
    prizes_today: 2,
    pending_count: 3,
    active_reminders: { data: [
        { reminder_date: new Date().toISOString(), reminder_time: '14:00', reminder_text: 'Retornar para Maria sobre novos produtos', customer: { name: 'Maria Souza' } }
    ], current_page: 1, last_page: 1 }
  });
  const [pendingRequestsCount, setPendingRequestsCount] = useState(3);
  const [accountSettings, setAccountSettings] = useState<any>({ telegram_sound_points: true });
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

  // Check login on load - DISABLED FOR MOCK
  useEffect(() => {
    // console.log('Mock mode active');
  }, []);

  const fetchContacts = async () => {};
  const fetchDashboardMetrics = async () => {};
  const fetchAccountSettings = async () => {};
  const refreshAllData = () => {};

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
          <div className="flex items-center justify-center gap-4 mb-8">
            <CPLogo className="w-14 h-14 shrink-0" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">CP Gestão</h1>
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
    <div className="flex h-screen bg-[#f8fafc] dark:bg-gray-950 overflow-hidden font-sans">
      {/* Sidebar Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-transform duration-300 transform 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:relative md:translate-x-0 ${sidebarCollapsed ? 'md:w-20' : 'md:w-72'}
        flex flex-col shadow-[2px_0_24px_-12px_rgba(0,0,0,0.05)]
        ${authRole === 'admin' ? 'hidden' : ''}
      `}>
        <div className="h-24 flex items-center px-6 mb-2">
          <div className="flex items-center justify-between w-full">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <CPLogo className="w-9 h-9 shrink-0" />
                <div>
                  <h1 className="font-bold text-gray-900 dark:text-white text-base leading-tight">
                    {authRole === 'admin' ? 'Admin Panel' : 'CP Gestão'}
                  </h1>
                  <p className="text-xs text-gray-400">Gestão e Fidelidade</p>
                </div>
              </div>
            ) : (
              <div className="mx-auto"><CPLogo className="w-9 h-9" /></div>
            )}
            <button className="md:hidden p-2 text-gray-500" onClick={() => setIsMobileMenuOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 px-4 py-2 overflow-y-auto no-scrollbar">
          {authRole === 'admin' ? (
            <>
              <SidebarItem icon={LayoutDashboard} label="Visão Geral" active={clientTab === 'dashboard'} onClick={() => { setClientTab('dashboard'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
            </>
          ) : (
            <>
              <SidebarItem id="side-tab-dashboard" icon={LayoutDashboard} label="DASHBOARD" onboardingActive={showOnboarding && clientTab === 'dashboard'} active={clientTab === 'dashboard'} onClick={() => { setClientTab('dashboard'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />

              <div className="relative">
                <SidebarItem id="side-tab-visits" icon={Calendar} label="APROVAR PONTOS" active={clientTab === 'visits'} onClick={() => { setClientTab('visits'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
                {pendingRequestsCount > 0 && (
                  <div className={`absolute ${sidebarCollapsed ? 'top-1 right-3' : 'top-3 right-4'} bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 pointer-events-none`}>
                    {pendingRequestsCount}
                  </div>
                )}
              </div>

              <SidebarItem id="side-tab-loyalty-system" icon={Award} label="SISTEMA DE FIDELIDADE" active={clientTab === 'loyalty_system'} onClick={() => { setClientTab('loyalty_system'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />

              <SidebarItem id="side-tab-clients" icon={Users} label="CLIENTES CADASTRADOS" onboardingActive={showOnboarding && clientTab === 'clients'} active={clientTab === 'clients'} onClick={() => { setSelectedContact(null); setClientTab('clients'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
              
              <SidebarItem id="side-tab-public-page" icon={Globe} label="MINHA PÁGINA" active={clientTab === 'public_page'} onClick={() => { setClientTab('public_page'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
              
              <SidebarItem id="side-tab-settings" icon={Settings} label="CONFIGURAÇÕES" active={clientTab === 'settings'} onClick={() => { setClientTab('settings'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
            </>
          )}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-1">
          <SidebarItem id="side-tab-account" icon={UserCircle} label="MINHA CONTA" onboardingActive={showOnboarding && clientTab === 'account'} active={clientTab === 'account'} onClick={() => { setSelectedContact(null); setClientTab('account'); setIsMobileMenuOpen(false); }} collapsed={sidebarCollapsed} />
          <button onClick={handleLogout} className={`w-full flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <LogOut className={`w-5 h-5 ${sidebarCollapsed ? '' : 'mr-3'} text-gray-700`} />
            {!sidebarCollapsed && "Sair da conta"}
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-20 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            {authRole !== 'admin' && (
              <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="w-5 h-5 text-gray-700 border-none" />
              </Button>
            )}
            <div className="flex items-center gap-4">
              {authRole === 'admin' && <CPLogo className="w-10 h-10" />}
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {authRole === 'admin' ? 'Super Admin' : (userData?.tenant?.name || 'Painel')}
                </h1>
                <p className="text-sm text-gray-500">
                  Painel de Gerenciamento
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 transition-colors">
              {darkMode ? <Sun className="w-5 h-5 text-gray-700" /> : <Moon className="w-5 h-5 text-gray-700" />}
            </button>
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
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-8 scroll-smooth bg-[#f8fafc] dark:bg-gray-950">
          <div className="max-w-[1400px] mx-auto w-full px-1">

            {authRole === 'admin' ? (
              <AdminDashboard />
            ) : blockedReason ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/10 rounded-full flex items-center justify-center">
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
              />
            )}
          </div>
        </div>
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
