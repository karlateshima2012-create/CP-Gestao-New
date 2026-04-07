import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, StatusModal } from '../../components/ui';
import { 
  Calendar, 
  ShieldCheck, 
  Lock, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Rocket, 
  ArrowUpCircle, 
  Check, 
  Smartphone,
  X
} from 'lucide-react';
import api from '../../services/api';

export const AccountTab: React.FC = () => {
  const [tenantInfo, setTenantInfo] = useState({
    name: '',
    plan_expires_at: '',
    plan: '',
    slug: '',
    customers_count: 0,
    plan_limit: 0,
    extra_contacts_quota: 0
  });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/client/settings');
      if (res.data && res.data.tenant) {
        setTenantInfo(res.data.tenant);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 animate-fade-in space-y-10 text-gray-800 dark:text-gray-200">
      <div className="text-center md:text-left">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Minha Conta</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mt-2 font-medium">Dados cadastrais e status do seu plano.</p>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* PERFIL RESUMO */}
        <Card className="p-8 border-none bg-white dark:bg-slate-900 shadow-xl rounded-[32px]">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="w-24 h-24 rounded-3xl bg-primary-500/10 flex items-center justify-center border-2 border-primary-500/20">
              <span className="text-4xl font-black text-primary-500">
                {tenantInfo.name?.substring(0, 1).toUpperCase() || 'L'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{tenantInfo.name || 'Sua Loja'}</h2>
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                <Badge color="blue" className="px-4 py-1.5 rounded-xl font-black uppercase text-[10px] tracking-widest bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 border-none">
                  PLANO {tenantInfo.plan?.toUpperCase() || 'BASE'}
                </Badge>
                <span className="flex items-center gap-1.5 text-[10px] text-green-600 font-black uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" /> CONTA ATIVA
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* STATUS DO PLANO */}
        <Card className="p-0 border-none shadow-2xl overflow-hidden rounded-[32px] bg-white dark:bg-slate-900">
            <div className="bg-gradient-to-br from-primary-600 to-indigo-600 p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">Status do Assinante</h3>
                    <p className="text-[11px] text-white/70 font-black uppercase tracking-widest">Validade e Limites de Uso</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Validade */}
                <div className="flex items-center gap-6 group">
                  <div className="p-5 bg-primary-50 dark:bg-slate-800 rounded-3xl group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-black tracking-widest leading-none mb-2">Expira em</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">
                      {tenantInfo.plan_expires_at ? new Date(tenantInfo.plan_expires_at).toLocaleDateString('pt-BR') : '--/--/----'}
                    </p>
                  </div>
                </div>

                {/* Limite */}
                <div className="flex items-center gap-6 group">
                  <div className="p-5 bg-primary-50 dark:bg-slate-800 rounded-3xl group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 uppercase font-black tracking-widest leading-none mb-2">Capacidade da Base</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-2xl font-black text-gray-900 dark:text-white">{tenantInfo.customers_count.toLocaleString()}</span>
                       <span className="text-gray-300 font-bold">/</span>
                       <span className="text-2xl font-black text-gray-900 dark:text-white">
                         {tenantInfo.plan_limit >= 1000000 ? 'ILIMITADO' : tenantInfo.plan_limit.toLocaleString()}
                       </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {tenantInfo.plan_limit < 1000000 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-end px-1">
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Ocupação da Base de Clientes</span>
                    <span className="text-xs font-black text-primary-500">
                      {Math.round((tenantInfo.customers_count / tenantInfo.plan_limit) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-4 rounded-full overflow-hidden p-1 border border-gray-100 dark:border-gray-700">
                    <div 
                      className="h-full bg-primary-500 rounded-full transition-all duration-1000 shadow-lg shadow-primary-500/30"
                      style={{ width: `${Math.min(100, (tenantInfo.customers_count / tenantInfo.plan_limit) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Botões de Ação */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                <Button 
                  variant="secondary"
                  className="h-14 font-black uppercase text-[11px] tracking-widest rounded-2xl"
                  onClick={() => window.open('https://wa.me/819011886491', '_blank')}
                >
                  Falar com Karla (Suporte)
                </Button>
                {tenantInfo.plan_limit < 1000000 && (
                  <Button 
                    className="h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                    onClick={() => setShowUpgradeModal(true)}
                  >
                    <ArrowUpCircle className="w-5 h-5" /> Fazer Upgrade Agora
                  </Button>
                )}
              </div>
            </div>
        </Card>

        {/* FOOTER */}
        <footer className="mt-12 py-10 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center gap-4 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">
            © {new Date().getFullYear()} CREATIVE PRINT • SISTEMA GESTÃO V2
          </p>
          <button 
            onClick={() => setShowTermsModal(true)}
            className="text-[10px] font-black text-primary-500 hover:underline uppercase tracking-widest"
          >
            Termos de Uso e Privacidade
          </button>
        </footer>
      </div>

      {modal.isOpen && (
        <StatusModal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}

      {/* MODAL DE UPGRADE */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <Card className="w-full max-w-xl p-8 shadow-2xl rounded-[32px] relative">
            <button onClick={() => setShowUpgradeModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600">
               <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-6 uppercase tracking-tight">Solicitar Upgrade</h3>
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-500 leading-relaxed">
                Para aumentar seu limite de contatos ou mudar de plano, entre em contato direto com nossa consultora.
              </p>
              <div className="p-6 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100">
                 <p className="text-xs font-bold text-primary-700">Seu plano atual:</p>
                 <p className="text-lg font-black text-primary-900 dark:text-primary-400 uppercase tracking-widest">{tenantInfo.plan}</p>
              </div>
              <Button 
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20"
                onClick={() => {
                  const msg = `Olá! Gostaria de falar sobre upgrade para minha loja: ${tenantInfo.name}`;
                  window.open(`https://wa.me/819011886491?text=${encodeURIComponent(msg)}`, '_blank');
                }}
              >
                Chamar no WhatsApp
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL DE TERMOS */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <Card className="w-full max-w-2xl p-10 shadow-2xl rounded-[32px] relative my-10 max-h-[85vh] overflow-y-auto">
            <button onClick={() => setShowTermsModal(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600">
               <X className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-8 border-b pb-4">Políticas de Privacidade</h3>
            <div className="space-y-6 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
               <p>Seus dados são tratados com total segurança dentro da arquitetura Multi-Tenant da Creative Print.</p>
               <p>Utilizamos cookies estritamente necessários para o funcionamento da plataforma e proteção contra fraudes.</p>
               {/* Simplified terms for brevity as per previous request to keep it professional but clean */}
            </div>
            <Button className="w-full mt-10 h-14 rounded-2xl font-black uppercase text-xs tracking-widest" onClick={() => setShowTermsModal(false)}>
              Estou de acordo
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
