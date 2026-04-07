import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, StatusModal } from '../../components/ui';
import {
  Monitor,
  Send,
  ShieldCheck,
  Zap,
  ExternalLink,
  Calendar,
  Layers,
  Moon,
  Sun,
  Bell
} from 'lucide-react';
import api from '../../services/api';

export const SettingsTab: React.FC = () => {
  const [telegramSettings, setTelegramSettings] = useState({
    chat_id: '',
    sound_registration: true,
    sound_points: true,
    sound_reminders: true
  });
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean; title: string; message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  const [clientInfo, setClientInfo] = useState({
    name: 'Sushi Elite',
    owner_name: 'Karla Teshima',
    phone: '(11) 99999-9999',
    email: 'contato@sushielite.com.br',
    plan_date: '06/04/2026',
    plan_name: 'Plano Premium Especial',
    plan_details: 'Fidelidade Ilimitada + CRM Inteligente'
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    fetchSettings();
    fetchDevices();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
  };

  const fetchSettings = async () => {
    try {
      const res = await api.get('/client/settings');
      if (res.data && res.data.settings) {
        const s = res.data.settings;
        setTelegramSettings({
          chat_id: s.telegram_chat_id || '',
          sound_registration: s.telegram_sound_registration ?? true,
          sound_points: s.telegram_sound_points ?? true,
          sound_reminders: s.telegram_sound_reminders ?? true
        });
        if (res.data.client) {
          setClientInfo(prev => ({
            ...prev,
            name: res.data.client.name || prev.name,
            email: res.data.client.email || prev.email,
            phone: res.data.client.phone || prev.phone
          }));
        }
      }
    } catch (err) { console.error(err); }
  };

  const fetchDevices = async () => {
    try {
      const res = await api.get('/client/devices?type=default');
      setDevices(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const handleUpdateTelegram = async () => {
    setIsLoading(true);
    try {
      await api.patch('/client/settings', {
        telegram_chat_id: telegramSettings.chat_id,
        telegram_sound_registration: telegramSettings.sound_registration,
        telegram_sound_points: telegramSettings.sound_points,
        telegram_sound_reminders: telegramSettings.sound_reminders
      });
      setModal({ isOpen: true, title: 'Sucesso!', message: 'Configurações de notificações atualizadas.', type: 'success' });
    } catch (err) {
      setModal({ isOpen: true, title: 'Erro!', message: 'Falha ao salvar configurações.', type: 'error' });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* Cabeçalho — mesmo padrão do LoyaltyTab */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Configurações</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium">Gerencie sua conta e as preferências do sistema CP Gestão.</p>
      </div>

      {/* ── CARD: Minha Conta ── */}
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
        {/* Header do card */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
            <ShieldCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Minha Conta</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Dados do estabelecimento e do plano contratado.</p>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dados principais */}
            <div className="lg:col-span-2 space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Nome do Estabelecimento</label>
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{clientInfo.name}</p>
              </div>
              <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Telefone</label>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{clientInfo.phone}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">E-mail</label>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{clientInfo.email}</p>
                </div>
              </div>
            </div>

            {/* Plano contratado */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers className="w-3 h-3" /> Plano Contratado
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase leading-tight">{clientInfo.plan_name}</p>
                </div>
              </div>
              <div className="w-full h-px bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Data de Emissão
                </label>
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">{clientInfo.plan_date}</p>
              </div>
              <div className="w-full h-px bg-slate-200 dark:bg-slate-700" />
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">{clientInfo.plan_details}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ── CARD: Notificações ── */}
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
        {/* Header do card */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Notificações</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Configure as notificações via bot no Telegram.</p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Bot Telegram */}
          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-4 max-w-xl">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Bot do Telegram</label>
                <p className="text-[10px] text-blue-500/70 font-medium mt-0.5">Vincule seu chat para receber alertas em tempo real.</p>
              </div>
              <a
                href="https://t.me/cpgestao_fidelidade_bot"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all text-[9px] font-black uppercase tracking-widest flex-shrink-0"
              >
                Vincular <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Identificador do Chat (Chat ID)</label>
              <Input
                placeholder="Ex: -1001234567890"
                value={telegramSettings.chat_id}
                onChange={e => setTelegramSettings({ ...telegramSettings, chat_id: e.target.value })}
                className="h-10 text-sm font-bold bg-white dark:bg-slate-900"
              />
              <p className="text-[9px] text-blue-600/60 dark:text-blue-400/50 font-bold leading-tight">
                💡 Informe o ID numérico gerado pelo bot no Telegram.
              </p>
            </div>
          </div>

          {/* Toggles de sons */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Alertas de Som</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: 'Novos Cadastros', key: 'sound_registration' },
                { label: 'Pontuação Realizada', key: 'sound_points' },
                { label: 'Lembretes de CRM', key: 'sound_reminders' }
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={(telegramSettings as any)[item.key]}
                      onChange={e => setTelegramSettings({ ...telegramSettings, [item.key]: e.target.checked })}
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleUpdateTelegram}
            isLoading={isLoading}
            className="w-full h-14 bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-white font-black uppercase text-xs tracking-[0.2em] rounded-xl shadow-xl shadow-blue-500/10 border-none"
          >
            Salvar Configurações
          </Button>
        </div>
      </Card>

      {/* ── CARD: Totens & Terminais ── */}
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
        {/* Header do card */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
            <Monitor className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Totens & Terminais</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Dispositivos vinculados a esta conta.</p>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {devices.length > 0 ? devices.map(device => (
              <div key={device.id} className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:border-primary-200 transition-colors">
                <div>
                  <p className="text-xs font-black text-slate-800 dark:text-white uppercase leading-none">{device.name}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {device.nfc_uid}</p>
                </div>
                <Badge color={device.active ? 'green' : 'red'} className="text-[8px] py-0.5">
                  {device.active ? 'ATIVO' : 'INATIVO'}
                </Badge>
              </div>
            )) : (
              <div className="col-span-full p-10 text-center border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                <p className="text-[11px] text-slate-400 font-bold uppercase italic tracking-widest">Nenhum totem vinculado a esta conta</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ── CARD: Aparência ── */}
      <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
        {/* Header do card */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-slate-600 dark:text-slate-400" /> : <Sun className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Aparência</h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Alternar entre modo claro e escuro.</p>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-none">
                Tema {theme === 'light' ? 'Claro' : 'Escuro'}
              </p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                Clique para alternar para o modo {theme === 'light' ? 'escuro' : 'claro'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-16 h-9 rounded-full transition-all flex items-center px-1 ${theme === 'dark' ? 'bg-primary-500 shadow-lg shadow-primary-500/20' : 'bg-slate-200'}`}
            >
              <div className={`w-7 h-7 rounded-full bg-white shadow-md transition-all transform ${theme === 'dark' ? 'translate-x-7' : 'translate-x-0'} flex items-center justify-center`}>
                {theme === 'dark' ? <Moon className="w-3 h-3 text-primary-500" /> : <Sun className="w-3 h-3 text-amber-500" />}
              </div>
            </button>
          </div>
        </div>
      </Card>

      {modal.isOpen && (
        <StatusModal
          isOpen={modal.isOpen}
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};
