import React from 'react';
import { Card, Button, Badge } from '../../components/ui';
import {
  Users,
  Star,
  Gift,
  TrendingUp,
  UserPlus,
  LayoutGrid,
  Activity,
  Percent,
  RefreshCw,
  Crown,
  Smartphone,
  MousePointerClick,
  ChevronLeft,
  UserX,
  MapPin,
  Trophy,
  RefreshCcw,
  Zap,
  QrCode,
  Share2,
  Download,
  Sparkles,
  Info
} from 'lucide-react';
import { Contact, PlanType } from '../../types';
import api, { reportsService } from '../../services/api';

interface DashboardTabProps {
  tenantPlan?: PlanType;
  contacts: Contact[];
  metrics: any;
  unexportedCount: number;
  onChangeTab: (tab: any) => void;
  onCopyLink: () => void;
  copiedLink: boolean;
  onTerminalMode?: () => void;
  onRefresh: (params?: any) => void;
  tenantSlug?: string | null;
  setSelectedContact: (contact: Contact | null) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  tenantPlan,
  metrics,
  onChangeTab,
  onCopyLink,
  copiedLink,
  onRefresh,
  tenantSlug,
  setSelectedContact,
  contacts,
}) => {
  const [insights, setInsights] = React.useState<any>(null);
  const [loadingInsights, setLoadingInsights] = React.useState(true);
  const prevPendingCount = React.useRef(0);

  const playAlert = () => {
     try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
        oscillator.stop(audioCtx.currentTime + 0.5);
     } catch (e) {
        console.error("Audio error", e);
     }
  };

  // Polling de 30 segundos para manter dados vivos
  React.useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
      fetchInsights();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Monitorar aumento de pendências para aviso sonoro
  React.useEffect(() => {
    if (metrics?.dashboard_sound_enabled !== false && metrics?.pending_count > prevPendingCount.current) {
      playAlert();
    }
    prevPendingCount.current = metrics?.pending_count || 0;
  }, [metrics?.pending_count, metrics?.dashboard_sound_enabled]);


  React.useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoadingInsights(true);
      const res = await reportsService.getInsights();
      setInsights(res.data);
    } catch (error) {
      console.error('Erro ao buscar insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };


  const suggestions = metrics?.suggestions || [];

  const SectionHeader = ({ title, subtitle, icon: Icon, colorClass }: any) => (
    <div className="flex flex-col mb-8 pt-6 border-t border-slate-100 dark:border-slate-800/50">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClass} bg-opacity-5 dark:bg-opacity-10 border border-slate-100 dark:border-slate-800/50`}>
          <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white capitalize">{title}</h2>
          {subtitle && <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  const KpiCard = ({ label, value, description, icon: Icon, colorClass, trend, prefix }: any) => (
    <Card className="p-5 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 group relative">
      {/* Strategic Accent Line */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${colorClass}`} />
      
      <div className="relative z-10 pl-1">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-2.5 rounded-lg ${colorClass} bg-opacity-5 dark:bg-opacity-10 border border-slate-100 dark:border-slate-800`}>
            <Icon className={`w-4 h-4 ${colorClass.replace('bg-', 'text-')}`} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </div>
          )}
        </div>

        <div className="space-y-0.5">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</p>
          <div className="flex items-baseline gap-1 mt-1">
            {prefix && <span className="text-sm font-bold text-slate-300 dark:text-slate-600">{prefix}</span>}
            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
              {value}
            </h3>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{description}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      {/* Header Premium */}
      <div className="hidden md:flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200 dark:border-slate-800 mb-8 font-primary">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Visão Geral</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium">Painel de controle estratégico e métricas em tempo real.</p>
        </div>
      </div>
      
      {/* Seção de Inteligência (Insights) - Movida da aba Exportar */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-slate-900 bg-opacity-10 dark:bg-opacity-20 shadow-sm ring-1 ring-inset ring-slate-900/20`}>
            <TrendingUp className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white capitalize">Inteligência do Negócio</h2>
            <p className="text-base font-medium text-slate-500 dark:text-slate-400 mt-1"></p>
          </div>
        </div>

        {loadingInsights ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-[2rem]"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card 1: Link Social (Estratégico) */}
            <Card className="p-8 border border-slate-100 bg-white shadow-sm relative overflow-hidden group rounded-2xl">
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-gray-400" />
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">Link Redes Sociais</h3>
                </div>
                
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">Cole esse link nas redes sociais ou envie pelo WhatsApp para que clientes possam se cadastrar e consultar seu saldo.</p>
                
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 font-mono text-[10px] text-slate-600 shadow-inner truncate text-center">
                    {window.location.host}/p/{tenantSlug}
                  </div>
                  <Button
                    onClick={onCopyLink}
                    className={`h-14 w-full rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl ${copiedLink ? 'bg-emerald-500 text-white shadow-emerald-500/10' : 'bg-[#38B6FF] text-white hover:bg-[#38B6FF]/90 shadow-blue-500/10'}`}
                  >
                    {copiedLink ? 'COPIADO!' : 'COPIAR LINK'}
                  </Button>
                </div>
              </div>
            </Card>
            {/* Cards de Inatividade / Links Estratégicos */}
            {/* Ranking de Engajamento */}
            <Card className="p-8 border border-slate-100 bg-white shadow-sm overflow-hidden relative group rounded-2xl">
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                   <Trophy className="w-5 h-5 text-gray-400" />
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">Ranking de Clientes</h3>
                </div>
                <div className="space-y-3 max-h-[120px] overflow-y-auto no-scrollbar pr-2">
                  {insights?.ranking?.map((c: any, i: number) => (
                    <div key={c.id} className="flex flex-col min-h-[40px] border-b border-slate-200/30 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate max-w-[120px] uppercase tracking-tight">{i + 1}. {c.name}</span>
                         <Badge color="blue" className="text-[10px] font-black bg-[#38B6FF]/10 text-[#38B6FF] border-[#38B6FF]/20 px-2">{c.points_balance} PTS</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Monitor de Base (Estratégico) */}
            <Card className="p-8 border border-slate-100 bg-white shadow-sm relative overflow-hidden group rounded-2xl">
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                   <Users className="w-5 h-5 text-gray-400" />
                   <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest leading-none">RESUMO</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-50">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{metrics?.total_customers || 0}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Clientes</p>
                  </div>
                  <div className="space-y-1 border-l border-slate-100 pl-4">
                    <h2 className="text-3xl font-black text-[#38B6FF] tracking-tighter">{metrics?.points_in_circulation || 0}</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Pontos</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[11px] font-semibold text-slate-400 leading-tight mb-4">Acompanhe o volume de clientes e o passivo de pontos circulantes em tempo real.</p>
                  <Button
                    onClick={() => onChangeTab('clients')}
                    variant="outline"
                    className="h-10 w-full rounded-lg font-black uppercase text-[10px] tracking-widest border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    GERENCIAR
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </section>


      {/* Sugestões Inteligentes (Insights Estratégicos) - Movido abaixo de Crescimento */}
      {suggestions.length > 0 && (
        <section className="bg-slate-50 dark:bg-slate-900/50 rounded-[32px] p-8 overflow-hidden relative border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary-500/5 to-transparent pointer-events-none" />
          <SectionHeader title="Insights Estratégicos" subtitle="" icon={Activity} colorClass="bg-slate-900" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {suggestions.map((s: any, i: number) => (
              <div key={i} className="group p-6 bg-white dark:bg-slate-900/40 rounded-[24px] border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${s.color}-500/10 text-${s.color}-600 dark:text-${s.color}-400`}>
                    {s.type === 'new_registration' ? <Sparkles className="w-5 h-5 fill-current" /> : <Star className="w-5 h-5 fill-current" />}
                  </div>
                  <p className="text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">{s.title}</p>
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}


      {/* Seção 4: Lembretes do CRM */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <SectionHeader title="Lembretes do CRM" subtitle="" icon={Activity} colorClass="bg-amber-500" />

          {metrics?.active_reminders?.last_page > 1 && (
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm self-start md:self-auto">
              <button
                disabled={metrics.active_reminders.current_page === 1}
                onClick={() => onRefresh({ reminders_page: metrics.active_reminders.current_page - 1 })}
                className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 transition-all text-gray-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10px] font-black text-gray-400 px-2 min-w-[60px] text-center">
                {metrics.active_reminders.current_page} / {metrics.active_reminders.last_page}
              </span>
              <button
                disabled={metrics.active_reminders.current_page === metrics.active_reminders.last_page}
                onClick={() => onRefresh({ reminders_page: metrics.active_reminders.current_page + 1 })}
                className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 transition-all text-gray-500"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics?.active_reminders?.data && metrics.active_reminders.data.length > 0 ? (
            metrics.active_reminders.data.map((r: any, i: number) => (
              <Card key={i} className="p-5 border border-amber-100 dark:border-amber-900/30 bg-white/50 dark:bg-amber-950/10 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                        {new Date(r.reminder_date).toLocaleDateString('pt-BR')} às {r.reminder_time.substring(0, 5)}
                      </p>
                    </div>
                  </div>
                  <Badge color="yellow" className="text-[9px] border-amber-500/30 text-amber-600">PENDENTE</Badge>
                </div>

                <h4 className="text-sm font-black text-gray-900 dark:text-white mb-2 line-clamp-1">{r.customer?.name}</h4>
                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed mb-4 line-clamp-2">
                  {r.reminder_text}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400">{r.customer?.phone}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[9px] px-3 font-black uppercase text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    onClick={() => {
                      const fullContact = contacts.find(c => c.id === r.customer?.id) || r.customer;
                      setSelectedContact(fullContact);
                      onChangeTab('new');
                    }}
                  >
                    Ver Cliente
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800">
              <Activity className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Nenhum lembrete ativo para os próximos dias</p>
            </div>
          )}
        </div>
      </section>

      {/* Seção 3: Performance Financeira */}
      <section>
        <SectionHeader title="Performance Financeira" subtitle="" icon={TrendingUp} colorClass="bg-slate-900" />
        <div className="grid grid-cols-1">
          <KpiCard
            label="Receita Registrada"
            value={Number(metrics?.total_revenue || 0).toLocaleString('ja-JP')}
            prefix="¥"
            description="Valor total em vendas processadas através do sistema."
            icon={TrendingUp}
            colorClass="bg-slate-900"
          />
        </div>
      </section>
    </div>
  );
};