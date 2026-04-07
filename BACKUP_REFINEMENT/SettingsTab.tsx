import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, StatusModal } from '../../components/ui';
import { 
  Monitor, 
  Smartphone, 
  Volume2, 
  Send,
  ShieldCheck,
  Zap,
  Check,
  ExternalLink
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

  useEffect(() => {
    fetchSettings();
    fetchDevices();
  }, []);

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

  const handleUpdateDeviceLocal = (id: string, field: string, value: any) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleSaveDevice = async (id: string, overrides: any = {}) => {
    const d = devices.find(x => x.id === id);
    if (!d) return;
    const payload = {
      telegram_chat_id: overrides.telegram_chat_id !== undefined ? overrides.telegram_chat_id : (d.telegram_chat_id || ''),
      responsible_name: overrides.responsible_name !== undefined ? overrides.responsible_name : (d.responsible_name || ''),
      nfc_uid: overrides.nfc_uid !== undefined ? overrides.nfc_uid : (d.nfc_uid || ''),
      telegram_sound_points: overrides.telegram_sound_points !== undefined ? overrides.telegram_sound_points : (d.telegram_sound_points ?? true),
      require_pin: overrides.require_pin !== undefined ? overrides.require_pin : (d.require_pin ?? false),
      active: overrides.active !== undefined ? overrides.active : (d.active ?? true),
    };
    try { await api.put(`/client/devices/${id}`, payload); } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">CONFIGURAÇÕES</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">Gerencie notificações e dispositivos de atendimento.</p>
        </div>
      </div>

      <div className="space-y-16">
        {/* TELEGRAM SECTION */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-4">
            <Send className="w-6 h-6 text-primary-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Alertas do Telegram</h3>
          </div>

          <Card className="p-8 border-none shadow-xl rounded-[32px] space-y-8 bg-white dark:bg-slate-900">
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-8 rounded-[24px] border border-blue-100 dark:border-blue-900/30 space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-black text-blue-700 dark:text-blue-400 uppercase tracking-tight leading-none">Vincular Conta do Telegram</p>
                  <p className="text-[11px] text-blue-600/70 dark:text-blue-400/60 font-medium">Receba avisos instantâneos de novos pontos e lembretes estratégicos.</p>
                </div>
                <a href="https://t.me/cpgestao_fidelidade_bot" target="_blank" rel="noreferrer" className="px-6 py-3 bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
                  <Check className="w-3.5 h-3.5" /> ATIVAR BOT <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end pt-6 border-t border-blue-100 dark:border-blue-900/30">
                 <Input 
                  label="Seu Chat ID"
                  placeholder="Ex: 123456789"
                  value={telegramSettings.chat_id}
                  onChange={e => setTelegramSettings({...telegramSettings, chat_id: e.target.value})}
                 />
                 <div className="p-5 bg-white dark:bg-slate-900/80 rounded-[20px] border border-blue-100 dark:border-blue-900/30 text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed">
                   💡 <b>INSTRUÇÃO:</b> No Telegram, abra o bot solicitado acima, clique em <b>INICIAR</b> e ele enviará seu ID numérico. Copie e cole aqui.
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Opções de Aviso Sonoro</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Novos Cadastros</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={telegramSettings.sound_registration} onChange={e => setTelegramSettings({...telegramSettings, sound_registration: e.target.checked})} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Lembretes de CRM</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={telegramSettings.sound_reminders} onChange={e => setTelegramSettings({...telegramSettings, sound_reminders: e.target.checked})} />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={handleUpdateTelegram}
                isLoading={isLoading}
                className="w-full h-15 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase text-sm tracking-widest rounded-[20px] shadow-xl shadow-primary-500/20"
              >
                Salvar Notificações
              </Button>
            </div>
          </Card>
        </section>

        {/* DEVICES SECTION */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 px-4">
            <Monitor className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Totens & Terminais</h3>
          </div>

          <div className="space-y-8">
            {devices.map((device) => (
              <Card key={device.id} className="p-8 border-none shadow-xl rounded-[32px] space-y-10 bg-white dark:bg-slate-900 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                
                {/* Device Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-gray-50 dark:border-gray-800 relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-3xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shadow-inner">
                      <Monitor className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{device.name}</h3>
                        <Badge color={device.active ? 'green' : 'red'}>{device.active ? 'SISTEMA ATIVO' : 'TEMPORARIAMENTE PAUSADO'}</Badge>
                      </div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Identificador: {device.nfc_uid}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                     <Button 
                      variant="secondary"
                      className="h-12 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest border-2"
                      onClick={() => {
                          const val = !device.active;
                          handleUpdateDeviceLocal(device.id, 'active', val);
                          handleSaveDevice(device.id, { active: val });
                      }}
                     >
                       {device.active ? 'Pausar Atendimento' : 'Ativar Atendimento'}
                     </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Chat ID do Operador (Telegram)</label>
                    <Input 
                      value={device.telegram_chat_id || ''}
                      placeholder="Ex: 987654321"
                      onChange={e => handleUpdateDeviceLocal(device.id, 'telegram_chat_id', e.target.value)}
                      onBlur={() => handleSaveDevice(device.id)}
                      className="h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 rounded-xl"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Responsável Local</label>
                    <Input 
                      value={device.responsible_name || ''}
                      placeholder="Ex: João / Caixa 01"
                      onChange={e => handleUpdateDeviceLocal(device.id, 'responsible_name', e.target.value)}
                      onBlur={() => handleSaveDevice(device.id)}
                      className="h-12 bg-gray-50/50 dark:bg-gray-800/50 border-gray-100 rounded-xl"
                    />
                  </div>
                  <div className="space-y-3">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notificação Local</label>
                     <div className="flex items-center justify-between h-12 px-5 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 shadow-inner">
                        <div className="flex items-center gap-2">
                          <Volume2 className={`w-4 h-4 ${device.telegram_sound_points !== false ? 'text-primary-500' : 'text-gray-300'}`} />
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Som no Dashboard</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={device.telegram_sound_points !== false} onChange={e => {
                            const v = e.target.checked;
                            handleUpdateDeviceLocal(device.id, 'telegram_sound_points', v);
                            handleSaveDevice(device.id, { telegram_sound_points: v });
                          }} />
                          <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-primary-500"></div>
                        </label>
                     </div>
                  </div>
                </div>

                {/* SECURITY / PIN / BRIGHT ALERT */}
                <div className="p-8 bg-amber-50 dark:bg-amber-900/10 rounded-[28px] border border-amber-100 dark:border-amber-900/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck className="w-20 h-20 text-amber-500 rotate-12" />
                  </div>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xl shadow-amber-500/20 shrink-0">
                        <Zap className="w-7 h-7" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-black text-amber-900 dark:text-amber-500 uppercase tracking-tight">Travamento de Segurança do Totem</p>
                        <p className="text-xs text-amber-800/70 dark:text-amber-500/60 font-bold leading-relaxed max-w-2xl">
                          Ative a SENHA DO DIA para evitar que clientes pontuem remotamente via foto do QR Code. 
                          O sistema exigirá um PIN randômico que deve ser solicitado ao operador do caixa.
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-125">
                      <input type="checkbox" className="sr-only peer" checked={device.require_pin === true} onChange={e => {
                        const v = e.target.checked;
                        handleUpdateDeviceLocal(device.id, 'require_pin', v);
                        handleSaveDevice(device.id, { require_pin: v });
                      }} />
                      <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
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
    </div>
  );
};
