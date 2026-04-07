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
  ExternalLink,
  Calendar
} from 'lucide-react';
import { Contact, PlanType } from '../../types';
import { reportsService } from '../../services/api';

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
    <div className="flex flex-col mb-8 pt-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-2xl ${colorClass} bg-opacity-10 dark:bg-opacity-20 shadow-sm ring-1 ring-inset ${colorClass.replace('bg-', 'ring-').replace('-500', '-500/20')}`}>
          <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">{title}</h2>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  const KpiCard = ({ label, value, description, icon: Icon, colorClass, trend, prefix }: any) => (
    <Card className="p-5 border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl shadow-sm hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-10 dark:bg-opacity-20 ring-1 ring-inset ${colorClass.replace('bg-', 'ring-').replace('-500', '-200/40')}`}>
            <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              {trend > 0 ? `+${trend}%` : `${trend}%`}
            </div>
          )}
        </div>

        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
          <div className="flex items-baseline gap-1">
            {prefix && <span className="text-sm font-bold text-gray-300 dark:text-gray-600">{prefix}</span>}
            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
              {value}
            </h3>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
          <p className="text-[10px] text-gray-400 font-bold leading-tight">{description}</p>
        </div>
      </div>
      <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full ${colorClass} opacity-[0.02] blur-2xl group-hover:opacity-[0.05] transition-opacity duration-500`} />
    </Card>
  );

  return (
    <div className="space-y-10 animate-fade-in py-4 pb-20 max-w-[1400px] mx-auto">
      {/* Header Premium */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Painel Operacional</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">Resumo estratégico do seu programa de benefícios.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              if (typeof setSelectedContact === 'function') setSelectedContact(null);
              onChangeTab('new');
            }}
            className="px-6 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-black text-[10px] uppercase tracking-widest shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Cadastrar Cliente
          </button>

          <button
            onClick={() => window.open(`${window.location.origin}/p/${tenantSlug}`, '_blank')}
            className="px-6 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Ver Página Pública
          </button>
        </div>
      </div>

      {/* PONTOS PENDENTES - DESTAQUE MÁXIMO */}
      {metrics?.pending_count > 0 && (
        <Card className="p-1 px-1 bg-primary-500 rounded-[32px] shadow-xl shadow-primary-500/20 overflow-hidden relative group cursor-pointer border-none" onClick={() => onChangeTab('visits')}>
           <div className="bg-white dark:bg-slate-900 m-1 rounded-[28px] p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/20 animate-pulse">
                  <Activity className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Solicitações de Pontos</h3>
                  <p className="text-primary-500 font-bold uppercase tracking-widest text-xs">Existem {metrics.pending_count} registros aguardando sua aprovação</p>
                </div>
              </div>
              <Button className="h-14 px-10 bg-primary-500 hover:bg-primary-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-primary-500/20 relative z-10">
                IR PARA APROVAÇÕES 🚀
              </Button>
           </div>
        </Card>
      )}

      {/* KPIs PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            label="Base de Clientes"
            value={metrics?.total_customers || 0}
            description="Total acumulado no CRM."
            icon={Users}
            colorClass="bg-blue-500"
          />
          <KpiCard
            label="Visitas Hoje"
            value={metrics?.visits_today || 0}
            description="Atendimentos realizados hoje."
            icon={Activity}
            colorClass="bg-emerald-500"
          />
          <KpiCard
            label="Vendas (Mês)"
            value={Number(metrics?.total_revenue || 0).toLocaleString('ja-JP')}
            prefix="¥"
            description="Receita bruta registrada."
            icon={TrendingUp}
            colorClass="bg-indigo-500"
          />
          <KpiCard
            label="Resgates de Prêmios"
            value={metrics?.prizes_today || 0}
            description="Metas atingidas hoje."
            icon={Trophy}
            colorClass="bg-amber-500"
          />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Lembretes do CRM (Prioridade 1) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <SectionHeader title="Próximos Lembretes" subtitle="Acompanhamento de clientes" icon={Calendar} colorClass="bg-amber-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics?.active_reminders?.data && metrics.active_reminders.data.length > 0 ? (
              metrics.active_reminders.data.map((r: any, i: number) => (
                <Card key={i} className="p-5 border border-amber-100 dark:border-amber-900/30 bg-white dark:bg-gray-900 rounded-[24px] shadow-sm hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <Badge color="yellow" className="text-[9px] font-black">{new Date(r.reminder_date).toLocaleDateString('pt-BR')}</Badge>
                    <span className="text-[10px] font-bold text-gray-400">{r.reminder_time.substring(0, 5)}</span>
                  </div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white mb-1">{r.customer?.name}</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium line-clamp-2 mb-4">{r.reminder_text}</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full h-8 text-[9px] font-black uppercase tracking-widest rounded-xl"
                    onClick={() => {
                        const fullContact = contacts.find(c => c.id === r.customer?.id) || r.customer;
                        setSelectedContact(fullContact);
                        onChangeTab('new');
                    }}
                  >
                    Ver Cliente
                  </Button>
                </Card>
              ))
            ) : (
              <div className="col-span-full py-12 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-[32px] border-2 border-dashed border-gray-200 dark:border-gray-800">
                <Activity className="w-10 h-10 text-gray-300 mb-2" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhum lembrete para hoje</p>
              </div>
            )}
          </div>
        </div>

        {/* Ranking de Fidelidade (Prioridade 2) */}
        <div className="lg:col-span-4 space-y-6">
          <SectionHeader title="Top Clientes" subtitle="Por pontuação acumulada" icon={Trophy} colorClass="bg-yellow-500" />
          <Card className="p-6 border-none bg-white dark:bg-gray-900 rounded-[32px] shadow-sm h-[400px] overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              {insights?.ranking?.map((c: any, i: number) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-transparent hover:border-yellow-100 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                      {i + 1}
                    </div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[120px]">{c.name}</span>
                  </div>
                  <Badge color="yellow" className="text-[10px]">{c.points_balance} pts</Badge>
                </div>
              ))}
            </div>
            <div className="pt-4 mt-2 border-t border-gray-50 dark:border-gray-800 text-center">
               <button onClick={() => onChangeTab('clients')} className="text-[10px] font-black text-primary-500 uppercase tracking-widest hover:underline">Ver todos os clientes</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};