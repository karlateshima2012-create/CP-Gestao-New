import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, StatusModal } from '../../components/ui';
import { Award, Zap } from 'lucide-react';
import api from '../../services/api';

interface LevelConfig {
  name: string;
  goal: number;
  reward: string;
  points_per_visit: number;
  days_to_downgrade: number;
  points_per_signup: number;
  active?: boolean;
}

const defaultLevels: LevelConfig[] = [
  { name: 'Bronze', goal: 10, reward: '', points_per_visit: 1, points_per_signup: 1, days_to_downgrade: 0, active: true },
  { name: 'Prata', goal: 24, reward: '', points_per_visit: 2, points_per_signup: 1, days_to_downgrade: 30, active: true },
  { name: 'Ouro', goal: 45, reward: '', points_per_visit: 3, points_per_signup: 1, days_to_downgrade: 30, active: true },
  { name: 'Diamante', goal: 80, reward: '', points_per_visit: 5, points_per_signup: 1, days_to_downgrade: 30, active: true }
];

export const LoyaltySystemTab: React.FC = () => {
  const [loyaltySettings, setLoyaltySettings] = useState({
    loyalty_active: true,
    points_goal: 10,
    signup_bonus_points: 1,
    levels_config: [] as LevelConfig[]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean; title: string; message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    fetchLoyaltySettings();
  }, []);

  const fetchLoyaltySettings = async () => {
    try {
      const res = await api.get('/client/loyalty/settings');
      if (res.data) {
        setLoyaltySettings(prev => ({
          ...prev,
          ...res.data,
          levels_config: res.data.levels_config?.length > 0 ? res.data.levels_config : defaultLevels
        }));
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateLoyalty = async () => {
    setIsLoading(true);
    try {
      await api.patch('/client/loyalty/settings', loyaltySettings);
      setModal({ isOpen: true, title: 'Sucesso!', message: 'Configurações de fidelidade atualizadas.', type: 'success' });
    } catch (err) {
      setModal({ isOpen: true, title: 'Erro!', message: 'Falha ao salvar regras.', type: 'error' });
    } finally { setIsLoading(false); }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Sistema de Pontos</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium">Defina como seus clientes ganham pontos e sobem de nível.</p>
      </div>

      <div className="space-y-8">
        <Card className="p-8 border-none shadow-sm rounded-[32px] space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
            <Award className="w-6 h-6 text-primary-500" />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Níveis do Programa</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loyaltySettings.levels_config.map((level, idx) => (
              <div key={idx} className={`p-6 bg-gray-50 dark:bg-gray-800/50 rounded-[24px] border-2 transition-all ${level.active === false ? 'opacity-40 grayscale border-transparent' : 'border-gray-100 dark:border-gray-700 hover:border-primary-100'}`}>
                <div className="flex justify-between items-center mb-6">
                  <Badge color={idx === 3 ? 'diamond' : idx === 2 ? 'gold' : idx === 1 ? 'silver' : 'bronze'} className="px-3 py-1 font-black uppercase text-[11px]">
                    {idx === 0 ? '🥉' : idx === 1 ? '🥈' : idx === 2 ? '🥇' : '💎'} {level.name}
                  </Badge>
                  {idx > 0 && (
                    <button 
                      onClick={() => {
                        const newLevels = [...loyaltySettings.levels_config];
                        newLevels[idx].active = !newLevels[idx].active;
                        setLoyaltySettings({ ...loyaltySettings, levels_config: newLevels });
                      }}
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all ${level.active === false ? 'bg-emerald-500 text-white border-none' : 'border-red-200 text-red-500 hover:bg-red-50'}`}
                    >
                      {level.active === false ? 'Ativar' : 'Desativar'}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Meta Acumulada</label>
                    <Input 
                      type="number"
                      value={level.goal}
                      disabled={level.active === false}
                      onChange={e => {
                        const newLevels = [...loyaltySettings.levels_config];
                        newLevels[idx].goal = parseInt(e.target.value) || 0;
                        setLoyaltySettings({ ...loyaltySettings, levels_config: newLevels });
                      }}
                      className="h-10 text-sm font-bold bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Pontos por Visita</label>
                    <Input 
                      type="number"
                      value={level.points_per_visit}
                      disabled={level.active === false}
                      onChange={e => {
                        const newLevels = [...loyaltySettings.levels_config];
                        newLevels[idx].points_per_visit = parseInt(e.target.value) || 1;
                        setLoyaltySettings({ ...loyaltySettings, levels_config: newLevels });
                      }}
                      className="h-10 text-sm font-bold bg-white dark:bg-gray-900"
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Prêmio deste Nível</label>
                    <Input 
                      placeholder="Ex: Corte Grátis"
                      value={level.reward}
                      disabled={level.active === false}
                      onChange={e => {
                        const newLevels = [...loyaltySettings.levels_config];
                        newLevels[idx].reward = e.target.value;
                        setLoyaltySettings({ ...loyaltySettings, levels_config: newLevels });
                      }}
                      className="h-10 text-sm font-bold bg-white dark:bg-gray-900"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Button 
              onClick={handleUpdateLoyalty}
              disabled={isLoading}
              className="w-full h-14 bg-primary-500 text-white font-black uppercase text-sm tracking-widest rounded-2xl shadow-xl shadow-primary-500/20"
            >
              {isLoading ? 'Salvando...' : 'Salvar Regras de Fidelidade'}
            </Button>
          </div>
        </Card>
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
