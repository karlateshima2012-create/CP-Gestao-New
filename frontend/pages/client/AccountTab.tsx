import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, StatusModal } from '../../components/ui';
import { 
  Mail, 
  Layers, 
  Rocket,
  Monitor,
  X,
  Sparkles,
  CheckCircle2,
  Share2,
  Globe,
  Zap,
  Settings2,
  Smartphone,
  Send,
  Volume2,
  ExternalLink,
  Moon,
  Sun,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';
import { DevicesTab } from './DevicesTab';

interface AccountTabProps {
  darkMode?: boolean;
  setDarkMode?: (val: boolean) => void;
}

export const AccountTab: React.FC<AccountTabProps> = ({ darkMode, setDarkMode }) => {
  const [tenantInfo, setTenantInfo] = useState({
    name: '',
    plan_expires_at: '',
    plan: '',
    slug: '',
    customers_count: 0,
    plan_limit: 0,
    email: 'contato@exemplo.com.br',
    phone: '(11) 99999-9999'
  });
  
  const [telegramSettings, setTelegramSettings] = useState({
    chat_id: '',
    sound_registration: true,
    sound_points: true,
    sound_reminders: true,
    dashboard_sound_enabled: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [selectedPackIndex, setSelectedPackIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const onCopyLink = () => {
    const url = `${window.location.origin}/p/${tenantInfo.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

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

  const packs = [
    { name: 'Pack Bronze', extra: '+1.000', price: '¥ 2.500', icon: <Zap className="w-5 h-5 text-amber-500" /> },
    { name: 'Pack Prata', extra: '+2.000', price: '¥ 4.500', icon: <Rocket className="w-5 h-5 text-blue-500" /> },
    { name: 'Pack Ouro', extra: '+4.000', price: '¥ 8.000', icon: <ShieldCheck className="w-5 h-5 text-emerald-500" /> },
    { name: 'Pack Infinity', extra: 'Ilimitado', price: 'Consultar', icon: <Zap className="w-5 h-5 text-purple-500" /> },
  ];

  const handleRequestPack = () => {
    const pack = packs[selectedPackIndex];
    const message = `Olá! Gostaria de solicitar o upgrade de pack de clientes.
Loja: ${tenantInfo.name}
Plano Atual: ${tenantInfo.plan}
Pacote Escolhido: ${pack.name} (${pack.extra} contatos)
Valor: ${pack.price}`;
    window.open(`https://wa.me/819011886491?text=${encodeURIComponent(message)}`, '_blank');
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/client/settings');
      const { tenant, settings } = res.data;
      
      // Determine real limits based on plan
      let limit = tenant.plan_limit || 1000;
      if (tenant.plan?.toUpperCase().includes('ELITE')) limit = 6000;
      else if (tenant.plan?.toUpperCase().includes('PROFISSIONAL') || tenant.plan?.toUpperCase().includes('PRO')) limit = 4000;

      setTenantInfo({
        ...tenant,
        plan_limit: limit,
        email: tenant.email || 'contato@exemplo.com.br',
        phone: tenant.phone || '(11) 99999-9999'
      });
      setTelegramSettings({
        chat_id: settings.telegram_chat_id || '',
        sound_registration: settings.telegram_sound_registration ?? true,
        sound_points: settings.telegram_sound_points ?? true,
        sound_reminders: settings.telegram_sound_reminders ?? true,
        dashboard_sound_enabled: settings.dashboard_sound_enabled ?? true
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload: any = {
        telegram_chat_id: telegramSettings.chat_id,
        telegram_sound_registration: telegramSettings.sound_registration,
        telegram_sound_points: telegramSettings.sound_points,
        telegram_sound_reminders: telegramSettings.sound_reminders,
        dashboard_sound_enabled: telegramSettings.dashboard_sound_enabled,
      };

      await api.patch('/client/settings', payload);
      setModal({
        isOpen: true,
        title: 'Sucesso!',
        message: 'Suas configurações foram salvas com sucesso.',
        type: 'success'
      });
      fetchSettings();
    } catch (error: any) {
      setModal({
        isOpen: true,
        title: 'Erro ao Salvar',
        message: error.response?.data?.message || error.response?.data?.error || 'Não foi possível salvar as alterações.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20 max-w-5xl mx-auto">
      <div className="hidden md:block">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Configurações</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium">Siga estes 3 passos para começar a pontuar seus clientes</p>
      </div>

      <div className="space-y-8">

        {/* PASSO 01: CONFIGURAÇÕES E ALERTAS */}
        <section>
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-xl space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[9px] font-black text-[#38B6FF] uppercase tracking-[0.2em]">PASSO 01</span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mt-1">NOTIFICAÇÕES E ALERTAS</h3>
                  </div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-400 leading-relaxed max-w-2xl mt-4">
                    Instale o Telegram no seu celular ou computador.
                    Clique em "Pegar Chat ID" – o Telegram será aberto automaticamente.
                    No bot, clique em "Start", copie o número do seu Chat ID e cole no campo abaixo.
                  </p>
                </div>
              </div>
            
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AVISOS SONOROS */}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                      NOTIFICAÇÕES DE SOM VIA NAVEGADOR
                    </h4>
                    <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed uppercase">
                      Esses alertas funcionam apenas com o painel aberto no computador ou celular.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={telegramSettings.dashboard_sound_enabled}
                      onChange={(e) => setTelegramSettings({ ...telegramSettings, dashboard_sound_enabled: e.target.checked })}
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                {/* TEMA DO PAINEL */}
                <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">Tema do Painel</h3>
                    <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed uppercase">Alternar Modo Escuro / Claro</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setDarkMode?.(false)}
                      className={`flex items-center gap-1.5 transition-all ${!darkMode ? 'text-primary-500' : 'text-slate-400'}`}
                    >
                      <Sun className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">CLARO</span>
                    </button>
                    <button 
                      onClick={() => setDarkMode?.(true)}
                      className={`flex items-center gap-1.5 transition-all ${darkMode ? 'text-primary-500' : 'text-slate-400'}`}
                    >
                      <Moon className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-widest">ESCURO</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ALERTAS TELEGRAM UNIFICADO - LAYOUT PRESERVADO */}
              <div className="grid grid-cols-1 md:grid-cols-2 p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800 divide-x divide-slate-200/50 dark:divide-slate-800/50 min-h-[72px]">
                {/* Lado Esquerdo: Ativação */}
                <div className="flex items-center justify-between pr-6 w-full">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                      ALERTAS VIA TELEGRAM
                    </h4>
                    <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed uppercase">
                      ATIVAR CADASTROS E CRM.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={telegramSettings.sound_registration} 
                      onChange={e => {
                        const val = e.target.checked;
                        setTelegramSettings({
                          ...telegramSettings, 
                          sound_registration: val,
                          sound_reminders: val,
                          sound_points: val
                        });
                      }} 
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                {/* Lado Direito: Configuração */}
                <div className="flex items-center justify-between pl-6 w-full">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none shrink-0">
                    ID PARA NOTIFICAÇÕES
                  </h4>
                  <div className="flex gap-2 items-center">
                    <Input 
                      placeholder="CHAT ID AQUI"
                      value={telegramSettings.chat_id}
                      onChange={e => setTelegramSettings({...telegramSettings, chat_id: e.target.value})}
                      className="h-8 text-[9px] font-bold bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-lg px-2 w-24 outline-none shadow-sm placeholder:text-slate-300"
                    />
                    <a 
                      href="https://t.me/cpgestao_fidelidade_bot" 
                      target="_blank" 
                      rel="noreferrer"
                      className="h-8 px-3 bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-white flex items-center justify-center gap-2 rounded-lg font-black text-[8px] uppercase tracking-widest transition-all whitespace-nowrap shadow-sm active:scale-95"
                    >
                      PEGAR CHAT ID
                    </a>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </section>

        {/* PASSO 02: QR CODE SOLICITAÇÃO DE PONTO */}
        <section>
          <Card className="p-10 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-xl space-y-10 overflow-hidden relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[9px] font-black text-[#38B6FF] uppercase tracking-[0.2em]">PASSO 02</span>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mt-1">QR CODE SOLICITAÇÃO DE PONTO</h2>
                  </div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-400 leading-relaxed max-w-2xl mt-4">
                    Imprima o QR Code do balcão.
                    Seu cliente escaneia no momento da compra e solicita os pontos do programa de fidelidade.
                  </p>
                </div>
              </div>
            <DevicesTab
              tenantSlug={tenantInfo.slug}
              tenantPlan={tenantInfo.plan as any}
            />
          </Card>
        </section>

        {/* PASSO 03: LINK DA BIO / REDES SOCIAIS */}
        <section>
          <Card className="p-10 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-xl space-y-10 overflow-hidden relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-lg">
                  <Share2 className="w-5 h-5" />
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[9px] font-black text-[#38B6FF] uppercase tracking-[0.2em]">PASSO 03</span>
                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none mt-1">LINK REDES SOCIAIS (BIO/WHATSAPP)</h2>
                  </div>
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-400 leading-relaxed max-w-2xl mt-4">
                    Cole esse link nas redes sociais ou envie pelo WhatsApp para que clientes possam se cadastrar e consultar seu saldo.
                  </p>
                </div>
              </div>
              
              <div className="max-w-4xl mx-auto bg-slate-50 dark:bg-slate-800/30 p-8 sm:p-10 rounded-xl border border-slate-100 dark:border-slate-800 space-y-8">
                {/* Link e Botão embaixo */}
                <div className="space-y-4 max-w-lg mx-auto">
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-300 shadow-inner flex items-center justify-center h-12 truncate">
                     {window.location.host}/p/{tenantInfo.slug}
                  </div>
                  <Button
                    onClick={onCopyLink}
                    className={`h-11 w-full rounded-lg font-black uppercase text-xs tracking-[0.2em] transition-all shadow-lg ${copiedLink ? 'bg-emerald-500 text-white shadow-emerald-500/10' : 'bg-slate-500 text-white hover:bg-slate-600 shadow-slate-500/10'}`}
                  >
                    {copiedLink ? 'COPIADO COM SUCESSO!' : 'COPIAR MEU LINK AGORA'}
                  </Button>
                </div>
              </div>
          </Card>
        </section>

        {/* MINHA CONTA */}
        <section>
          <Card className="p-10 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</p>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{tenantInfo.name}</h3>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</p>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{tenantInfo.email}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telefone</p>
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400">{tenantInfo.phone}</p>
                </div>
              </div>

              {/* DADOS DO PLANO */}
              <div className="lg:col-span-7 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800 p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Plano Ativo</p>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{tenantInfo.plan}</h4>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Início do plano</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter">01/01/2026</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Próximo Vencimento</p>
                      <p className="text-xs font-black text-primary-500 uppercase tracking-tighter">--/--/--</p>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Limite de Clientes</p>
                        <button 
                          onClick={() => setShowUpgradeModal(true)}
                          className="px-3 h-7 bg-slate-500 hover:bg-slate-600 text-white font-black uppercase text-[9px] tracking-widest rounded-lg transition-all border-none shadow-sm shadow-slate-500/10"
                        >
                          Upgrade
                        </button>
                      </div>
                      <div className="flex items-baseline gap-1.5 leading-none">
                        <span className="text-2xl font-black text-primary-500 tabular-nums">{(tenantInfo.customers_count || 0).toLocaleString()}</span>
                        <span className="text-[10px] font-black text-slate-400 italic">/ {tenantInfo.plan_limit.toLocaleString()} cadastrados</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500 transition-all duration-1000"
                          style={{ width: `${Math.min(((tenantInfo.customers_count || 0) / tenantInfo.plan_limit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* SALVAR (Global Action Center) */}
        <div className="pt-8 w-full space-y-12">
          <Button 
            onClick={handleSave}
            isLoading={isLoading}
            className="w-full h-14 bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-xl shadow-blue-500/10 transition-all border-none"
          >
            Salvar Configurações
          </Button>

          {/* RODAPÉ FINAL */}
          <footer className="pt-8 pb-10 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                © 2026 Creative Print. Todos os direitos reservados.
              </p>
              <div className="flex flex-col items-center gap-4">
                 <button 
                   onClick={() => setShowTermsModal(true)}
                   className="text-[9px] font-black text-[#38B6FF] hover:text-[#38B6FF]/70 uppercase tracking-widest transition-all underline underline-offset-2"
                 >
                   Termos de Uso e Política de Privacidade
                 </button>
                 
                 <button 
                    onClick={() => window.open('https://wa.me/819011886491?text=Olá!%20Preciso%20de%20suporte%20com%20o%20CP%20Gestão.', '_blank')}
                    className="px-4 h-7 bg-slate-500 hover:bg-slate-600 text-white font-black uppercase text-[9px] tracking-[0.1em] rounded-lg transition-all border-none shadow-sm shadow-slate-500/10"
                 >
                   FALAR COM SUPORTE
                 </button>
              </div>
          </footer>
        </div>
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
          <Card className="w-full max-w-2xl p-0 shadow-2xl overflow-hidden animate-scale-up my-auto max-h-[95vh] flex flex-col border-none bg-white dark:bg-slate-900">
            <div className="p-4 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                   Pack de Clientes
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">ESCOLHA O PACK IDEAL</p>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {packs.map((pack, index) => {
                  const isSelected = selectedPackIndex === index;
                  return (
                    <div 
                      key={pack.name} 
                      onClick={() => setSelectedPackIndex(index)}
                      className={`relative group cursor-pointer h-full border rounded-xl p-8 transition-all flex flex-col items-center text-center space-y-4 ${
                        isSelected 
                        ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 shadow-xl' 
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300'
                      }`}
                    >
                        {isSelected && (
                          <div className="absolute top-4 right-4 bg-emerald-500 p-1.5 rounded-lg shadow-lg shadow-emerald-500/20 animate-scale-up">
                            <ShieldCheck className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                        
                        <div className="space-y-1">
                          <div className="flex items-center justify-center gap-3">
                            {pack.icon}
                            <h4 className={`text-xl font-black uppercase tracking-tight ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>{pack.name}</h4>
                          </div>
                          <p className={`text-[11px] font-black uppercase tracking-widest pt-1 ${isSelected ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>CONTRATE {pack.extra} CONTATOS</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                           <p className={`text-sm font-black ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600'}`}>{pack.price}</p>
                           <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${
                             isSelected 
                             ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300' 
                             : 'bg-white/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400'
                           }`}>Pagamento Único</span>
                        </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleRequestPack}
                  className="w-full h-14 bg-slate-400 hover:bg-slate-500 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl transition-all border-none shadow-xl shadow-slate-400/10"
                >
                  Solicitar Pack de Contatos
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* MODAL DE TERMOS E POLÍTICAS */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <Card className="w-full max-w-4xl p-0 shadow-2xl overflow-hidden animate-scale-up my-auto max-h-[90vh] flex flex-col border-none bg-white dark:bg-slate-900 rounded-xl">
            <div className="p-4 sm:p-8 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                   Termos e Políticas
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">CONTRATO, TERMOS DE USO E PRIVACIDADE</p>
              </div>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 sm:p-10 overflow-y-auto space-y-10 custom-scrollbar">
              {/* CONTRATO */}
              <section className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-2xl">📄</span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">CONTRATO DE PRESTAÇÃO DE SERVIÇO – CP GESTÃO</h4>
                </div>
                
                <div className="space-y-8 text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  <div className="space-y-3">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">1. Objeto</p>
                    <p>A CONTRATADA (Creative Print) disponibiliza ao CONTRATANTE acesso ao sistema CP Gestão, incluindo funcionalidades de fidelidade, CRM, gestão de clientes e integração com dispositivos QR Code.</p>
                  </div>

                  <div className="space-y-3">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">2. Modalidade de Contratação</p>
                    <p>O serviço é contratado na modalidade de Plano Anual, com duração mínima de 12 meses. O período mínimo contratado começa a partir da data da confirmação do primeiro pagamento. O compromisso assumido no momento da contratação será aplicado durante todo o período contratado.</p>
                  </div>

                  <div className="space-y-3">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">3. Forma de Pagamento e Renovação</p>
                    <p>O serviço é cobrado de forma recorrente, com pagamentos mensais automáticos via Stripe. A assinatura permanece ativa e será renovada automaticamente até que o cliente solicite o cancelamento, respeitando o período mínimo contratado.</p>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Valores Vigentes (Plano Anual):</p>
                      <p className="font-black text-slate-900 dark:text-white">Plano PRO: ¥2.480/mês</p>
                      <p className="font-black text-slate-900 dark:text-white">Plano ELITE: ¥3.980/mês</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">4. Compromisso e Cancelamento</p>
                    <p>Ao contratar o serviço, o CONTRATANTE concorda com o período mínimo de 12 meses.</p>
                    <div className="space-y-2 pl-4 border-l-2 border-primary-500/30">
                      <p>• Caso o cancelamento ocorra antes de 12 meses, o plano contratado será considerado até o final do período.</p>
                      <p>• O acesso ao sistema será encerrado imediatamente após o cancelamento.</p>
                      <p>• Não haverá reembolso de valores já pagos.</p>
                      <p>• As cobranças futuras serão interrompidas após o processamento do cancelamento.</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">5. Inadimplência</p>
                    <p>Caso o pagamento não seja realizado, o acesso ao sistema poderá ser suspenso automaticamente. A reativação dependerá da regularização do pagamento.</p>
                  </div>

                  <div className="space-y-3">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">6. Ativação do Serviço</p>
                    <p>Após a contratação do plano, a ativação é online e o uso do sistema poderá ser iniciado imediatamente via QR Code digital. A Creative Print fará a personalização do QR Code impresso em 3D e enviará pelo correio assim que o cliente aprovar o design.</p>
                  </div>

                  <div className="space-y-3">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">7. Responsabilidade do Cliente</p>
                    <p>O CONTRATANTE é responsável pelo uso correto da plataforma, gestão de seus clientes e dados, e operação dos dispositivos QR Code vinculados ao sistema.</p>
                  </div>

                  <div className="space-y-3">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-widest">8. Aceite</p>
                    <p>Ao realizar o pagamento, o CONTRATANTE declara estar de acordo com todos os termos deste contrato.</p>
                  </div>
                </div>
              </section>

              {/* TERMOS DE USO */}
              <section className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-2xl">📜</span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">TERMOS DE USO – CP GESTÃO</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  <div className="space-y-2">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">1. Uso da Plataforma</p>
                    <p>O sistema deve ser utilizado exclusivamente para fins comerciais legítimos, sendo proibida a prática de spam, fraudes ou uso indevido de dados de clientes.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">2. Dados e Privacidade</p>
                    <p>Os dados inseridos no sistema são de responsabilidade do CONTRATANTE. A Creative Print não compartilha dados com terceiros, exceto provedores técnicos essenciais (Stripe).</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">3. Acesso</p>
                    <p>O acesso é individual e vinculado ao cliente contratante. O compartilhamento indevido ou revenda do acesso sem autorização resultará na suspensão imediata do serviço.</p>
                  </div>
                  <div className="space-y-2">
                    <p className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest">4. Atualizações</p>
                    <p>Reservamo-nos o direito de realizar melhorias e atualizações visando desempenho e segurança sem aviso prévio.</p>
                  </div>
                </div>
              </section>

              {/* PRIVACIDADE */}
              <section className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-2xl">🔒</span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">POLÍTICA DE PRIVACIDADE</h4>
                </div>
                
                <div className="space-y-6 text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  <p>A Creative Print valoriza a sua privacidade. Coletamos apenas informações essenciais para a prestação de serviços de gestão e fidelidade.</p>
                  <p>Adotamos medidas de segurança técnicas rigorosas para proteger os seus dados e os dados de seus clientes contra acessos não autorizados.</p>
                  <p className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-100 dark:border-primary-900/30 text-primary-700 dark:text-primary-300 font-bold">
                    Este sistema utiliza Cookies para autenticação de sessão e gerenciamento de preferências. Ao utilizar, você consente com o uso destes recursos.
                  </p>
                </div>
              </section>

              <div className="pt-10 flex flex-col items-center gap-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Última atualização: Abril de 2026</p>
                <Button 
                  onClick={() => setShowTermsModal(false)}
                  className="px-10 h-12 bg-slate-500 hover:bg-slate-600 text-white font-black uppercase text-xs tracking-widest rounded-lg transition-all shadow-xl shadow-slate-500/10 border-none"
                >
                  Entendi e Aceito
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
