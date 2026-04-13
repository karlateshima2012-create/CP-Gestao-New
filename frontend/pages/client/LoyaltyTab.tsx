import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, StatusModal } from '../../components/ui';
import { Award, Upload, X, Image as ImageIcon, Layout } from 'lucide-react';
import { Contact, PlanType } from '../../types';
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
   { name: 'Prata', goal: 24, reward: '', points_per_visit: 2, points_per_signup: 0, days_to_downgrade: 30, active: true },
   { name: 'Ouro', goal: 45, reward: '', points_per_visit: 3, points_per_signup: 0, days_to_downgrade: 30, active: true },
   { name: 'Diamante', goal: 72, reward: '', points_per_visit: 4, points_per_signup: 0, days_to_downgrade: 30, active: true }
];

interface LoyaltyTabProps {
   tenantPlan?: PlanType;
   contacts?: Contact[];
}

export const LoyaltyTab: React.FC<LoyaltyTabProps> = ({ tenantPlan, contacts = [] }) => {
   const [loyaltySettings, setLoyaltySettings] = useState({
      loyalty_active: true,
      points_goal: 10,
      signup_bonus_points: 1,
      description: '',
      rules_text: '',
      logo_url: null as string | null,
      cover_url: null as string | null,
      levels_config: [] as LevelConfig[]
   });
   const [isLoading, setIsLoading] = useState(false);
   const [showTipsModal, setShowTipsModal] = useState(false);
   const [expandedLevels, setExpandedLevels] = useState<Record<number, boolean>>({});
   const [modal, setModal] = useState<{
      isOpen: boolean; title: string; message: string;
      type: 'success' | 'error' | 'info' | 'warning';
      onConfirm?: () => void; confirmLabel?: string;
   }>({ isOpen: false, title: '', message: '', type: 'info' });

   const fileInputRef = useRef<HTMLInputElement>(null);
   const fileInputCoverRef = useRef<HTMLInputElement>(null);

   useEffect(() => { fetchLoyaltySettings(); }, []);

   const fetchLoyaltySettings = async () => {
      try {
         const res = await api.get('/client/loyalty/settings');
         if (res.data) {
            setLoyaltySettings(prev => ({
               ...prev, ...res.data,
               levels_config: res.data.levels_config?.length > 0 ? res.data.levels_config : defaultLevels
            }));
         }
      } catch (error) { console.error('Error fetching loyalty settings:', error); }
   };

   const handleUpdateSettings = async () => {
      setIsLoading(true);
      try {
         await api.patch('/client/loyalty/settings', loyaltySettings);
         setModal({ isOpen: true, title: 'Sucesso!', message: 'Configurações de fidelidade atualizadas.', type: 'success' });
      } catch {
         setModal({ isOpen: true, title: 'Erro ao Salvar', message: 'Não foi possível atualizar as configurações.', type: 'error' });
      } finally { setIsLoading(false); }
   };

   const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setLoyaltySettings(s => ({ ...s, logo_url: ev.target?.result as string }));
      reader.readAsDataURL(file);
   };

   const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setLoyaltySettings(s => ({ ...s, cover_url: ev.target?.result as string }));
      reader.readAsDataURL(file);
   };

   const toggleExpanded = (idx: number) =>
      setExpandedLevels(prev => ({ ...prev, [idx]: !prev[idx] }));

   const updateLevel = (idx: number, field: keyof LevelConfig, value: any) => {
      const newLevels = [...loyaltySettings.levels_config];
      (newLevels[idx] as any)[field] = value;
      setLoyaltySettings(s => ({ ...s, levels_config: newLevels }));
   };

   return (
      <div className="space-y-6 animate-fade-in pb-12">

         <div className="hidden md:block">
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Programa de Fidelidade</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium">Organize suas regras e pontuações do seu programa.</p>
         </div>

         {/* ── CARD 1: Configuração da Página Pública ── */}
         <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
               <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                  <Layout className="w-4 h-4 text-slate-600 dark:text-slate-400" />
               </div>
               <div>
                  <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Configuração da página pública</h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Essas informações são visíveis para os seus clientes.</p>
               </div>
            </div>

            {/* Grid 2×2 plano — linha 1: Descrição | Logo · linha 2: Regras | Banner */}
            <div className="p-6">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">

                  {/* [1,1] Descrição */}
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Descrição do Programa</label>
                     <textarea
                        value={loyaltySettings.description || ''}
                        onChange={(e) => setLoyaltySettings(s => ({ ...s, description: e.target.value }))}
                        placeholder="Ex: Participe do nosso programa VIP e ganhe prêmios exclusivos..."
                        rows={4}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none shadow-inner"
                     />
                  </div>

                  {/* [1,2] Logotipo */}
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Logotipo da Loja</label>
                     <div className="flex items-center gap-4">
                        <div className="relative group w-20 h-20 flex-shrink-0">
                           <div className="w-full h-full rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 group-hover:border-primary-500 transition-all cursor-pointer shadow-sm">
                              {loyaltySettings.logo_url ? (
                                 <img src={loyaltySettings.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                              ) : (
                                 <ImageIcon className="w-6 h-6 text-gray-300" />
                              )}
                              <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white rounded-xl">
                                 <Upload className="w-4 h-4 mb-0.5" />
                                 <span className="text-[7px] font-black uppercase">Alterar</span>
                              </button>
                           </div>
                           {loyaltySettings.logo_url && (
                              <button onClick={() => setLoyaltySettings(s => ({ ...s, logo_url: null }))} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors">
                                 <X className="w-3 h-3" />
                              </button>
                           )}
                           <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                        </div>
                        <div>
                           <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Logotipo Principal</p>
                           <p className="text-[10px] text-gray-400 mt-0.5">Formato quadrado ou circular. Mín. 512×512px.</p>
                        </div>
                     </div>
                  </div>

                  {/* [2,1] Regras */}
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        Regras do Programa <span className="text-[10px] font-bold text-primary-500/60 lowercase tracking-normal">(cada linha = 1 tópico)</span>
                     </label>
                     <textarea
                        value={loyaltySettings.rules_text || ''}
                        onChange={(e) => setLoyaltySettings(s => ({ ...s, rules_text: e.target.value }))}
                        placeholder="Ex:&#10;Ganhe 1 ponto a cada ¥ 5.000 em compras.&#10;Resgate seus prêmios em qualquer dia da semana."
                        rows={4}
                        className="w-full p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-xl font-medium text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none leading-relaxed shadow-inner"
                     />
                  </div>

                  {/* [2,2] Banner */}
                  <div className="flex flex-col gap-2">
                     <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Imagem de Banner (Capa)</label>
                     <div className="relative group w-full min-h-[120px] flex-1">
                        <div className="w-full h-full min-h-[120px] rounded-xl bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 group-hover:border-primary-500 transition-all cursor-pointer shadow-sm">
                           {loyaltySettings.cover_url ? (
                              <img src={loyaltySettings.cover_url} alt="Banner" className="w-full h-full object-cover" />
                           ) : (
                              <ImageIcon className="w-8 h-8 text-gray-300" />
                           )}
                           <button onClick={() => fileInputCoverRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white rounded-xl">
                              <Upload className="w-4 h-4 mb-0.5" />
                              <span className="text-[7px] font-black uppercase">Alterar Capa</span>
                           </button>
                        </div>
                        {loyaltySettings.cover_url && (
                           <button onClick={() => setLoyaltySettings(s => ({ ...s, cover_url: null }))} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors">
                              <X className="w-3 h-3" />
                           </button>
                        )}
                        <input type="file" ref={fileInputCoverRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
                     </div>
                     <p className="text-[10px] text-gray-400 italic">Exibida no topo da página de pontuação do cliente.</p>
                  </div>

               </div>
            </div>
         </Card>

         {/* ── CARD 2: Níveis do Programa ── */}
         <Card className="border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
               <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                     <Award className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                     <h2 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">Níveis do Programa</h2>
                     <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Defina o prêmio de cada nível.</p>
                  </div>
               </div>
               <button
                  onClick={() => setShowTipsModal(true)}
                  className="text-[9px] font-black text-primary-500 uppercase tracking-[0.15em] hover:bg-primary-50 dark:hover:bg-primary-900/20 px-3 py-2 rounded-lg transition-all border border-primary-500/20 whitespace-nowrap"
               >
                  Ver Dicas
               </button>
            </div>

            {/* Grid 2×2 de níveis */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
               {loyaltySettings.levels_config.map((level, idx) => (
                  <div
                     key={idx}
                     className={`rounded-xl border overflow-hidden transition-all shadow-sm ${level.active === false ? 'opacity-40 grayscale border-gray-200 dark:border-gray-700' : 'border-gray-200 dark:border-gray-700'}`}
                  >
                     {/* Cabeçalho: nome à esquerda · visitas à direita */}
                     <div className={`flex items-center justify-between px-4 py-2.5 ${
                        level.active === false ? 'bg-gray-50 dark:bg-gray-800/20' :
                        idx === 0 ? 'bg-orange-50/60 dark:bg-orange-900/10' :
                        idx === 1 ? 'bg-slate-50 dark:bg-slate-800/30' :
                        idx === 2 ? 'bg-yellow-50/60 dark:bg-yellow-900/10' :
                        'bg-cyan-50/50 dark:bg-cyan-900/10'
                     }`}>
                        <div className="flex items-center gap-2">
                           <span className="text-base">{idx === 0 ? '🥉' : idx === 1 ? '🥈' : idx === 2 ? '🥇' : '💎'}</span>
                           <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{level.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium">
                           {idx === 0
                              ? `${Math.max(0, Math.ceil((level.goal - level.points_per_signup) / (level.points_per_visit || 1)))} visitas para o prêmio`
                              : `${Math.max(0, Math.ceil(level.goal / (level.points_per_visit || 1)))} visitas para o prêmio`
                           }
                        </span>
                     </div>

                     {/* Campo de prêmio */}
                     <div className="px-4 py-3 bg-white dark:bg-gray-900 space-y-1.5">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Prêmio deste Nível</label>
                        <input
                           id="onboarding-loyalty-reward"
                           type="text"
                           placeholder="Ex: Desconto, brinde..."
                           value={level.reward}
                           onChange={e => updateLevel(idx, 'reward', e.target.value.replace(/(?:^|\s)\S/g, a => a.toUpperCase()))}
                           className="w-full h-10 px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all placeholder:text-gray-300 placeholder:text-[9px] placeholder:font-medium"
                        />
                        <p className="text-[9px] text-gray-400 font-medium italic text-right">Visualizado pelo cliente no saldo</p>
                     </div>

                     {/* Accordion: Configuração Avançada */}
                     <div className="border-t border-gray-200 dark:border-gray-700">
                        <button
                           onClick={() => toggleExpanded(idx)}
                           className="w-full flex items-center justify-between px-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                           <span>Configuração Avançada (opcional)</span>
                           <span className={`text-xl font-bold text-slate-500 leading-none inline-block transition-transform duration-200 ${expandedLevels[idx] ? 'rotate-180' : ''}`}>▾</span>
                        </button>
                        {expandedLevels[idx] && (
                           <div className="px-4 pb-4 pt-1 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{idx === 0 ? 'Meta Geral' : 'Meta p/ Alcançar'}</label>
                                    <input type="number" value={level.goal}
                                       id={idx === 0 ? "onboarding-loyalty-goal" : undefined}
                                       onChange={e => updateLevel(idx, 'goal', parseInt(e.target.value) || 0)}
                                       className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pts / Visita</label>
                                    <input type="number" value={level.points_per_visit}
                                       onChange={e => updateLevel(idx, 'points_per_visit', parseInt(e.target.value) || 1)}
                                       className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                 </div>
                              </div>
                              {idx === 0 && (
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pts Cadastro</label>
                                    <input type="number" value={level.points_per_signup}
                                       onChange={e => updateLevel(idx, 'points_per_signup', parseInt(e.target.value) || 0)}
                                       className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                    <p className="text-[8px] text-gray-400 font-bold">Clientes novos iniciam sempre no Bronze.</p>
                                 </div>
                              )}
                              {idx > 0 && (
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                       Dias p/ Rebaixar <span className="cursor-help text-primary-500" title="Use 0 para desativar. O cliente é rebaixado se não visitar nesse período.">?</span>
                                    </label>
                                    <input type="number" min="0" value={level.days_to_downgrade}
                                       onChange={e => updateLevel(idx, 'days_to_downgrade', parseInt(e.target.value) || 0)}
                                       className="w-full h-9 px-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                                    />
                                 </div>
                              )}
                              {idx > 0 && (
                                 <div className="pt-2 flex justify-end border-t border-slate-200 dark:border-slate-700">
                                    <button
                                       onClick={() => updateLevel(idx, 'active', level.active === false ? true : false)}
                                       className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md transition-all ${level.active === false ? 'text-primary-500 bg-primary-50 hover:bg-primary-100' : 'text-red-400 bg-red-50/50 hover:bg-red-50'}`}
                                    >
                                       {level.active === false ? 'Ativar Nível' : 'Desativar Nível'}
                                    </button>
                                 </div>
                              )}
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
            {/* Observação Importante */}
            <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800">
               <p className="text-[9px] text-gray-400 font-medium italic uppercase tracking-wider">
                  OBSERVAÇÃO IMPORTANTE: Alterações de metas e níveis devem ser configuradas preferencialmente antes de iniciar o programa.
               </p>
            </div>
         </Card>

         {/* Botão Salvar */}
         <Button
            className="w-full h-14 bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-white shadow-xl shadow-blue-500/10 font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all border-none"
            onClick={handleUpdateSettings}
            disabled={isLoading}
         >
            {isLoading ? 'Salvando...' : 'Salvar Configurações'}
         </Button>

         <TipsModal isOpen={showTipsModal} onClose={() => setShowTipsModal(false)} />

         {modal.isOpen && (
            <StatusModal
               isOpen={modal.isOpen}
               title={modal.title}
               message={modal.message}
               type={modal.type}
               onConfirm={modal.onConfirm}
               confirmLabel={modal.confirmLabel}
               theme="accent"
               onClose={() => setModal(prev => ({ ...prev, isOpen: false, onConfirm: undefined }))}
            />
         )}
      </div>
   );
};

export const TipsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
   if (!isOpen) return null;
   return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
         <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10">
               <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-500" />
                  Dicas de Progressão de Níveis
               </h3>
               <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
               </button>
            </div>
            <div className="p-8 space-y-10 text-left">
               <div className="space-y-4">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">💎 Pilares para uma Progressão de Sucesso</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {[
                        { n: '01', color: 'bg-primary-500 shadow-primary-500/20', title: 'Dificuldade Gradual', text: 'Aumente o esforço em 20% a 30% a cada nível. Isso mantém o desafio constante sem desmotivar o cliente que acabou de começar.' },
                        { n: '02', color: 'bg-slate-800 dark:bg-white', title: 'Gatilhos de Recompensa', text: 'Ofereça prêmios de utilidade no Bronze/Prata e prêmios de desejo (premium) no Ouro/Diamante para criar aspiração.' },
                        { n: '03', color: 'bg-slate-800 dark:bg-white', title: 'Estimule a Recorrência', text: 'O prazo de rebaixamento garante que o cliente não esqueça sua marca. Configure dias compatíveis com a frequência de uso do seu produto.' },
                        { n: '04', color: 'bg-primary-500 shadow-primary-500/20', title: 'Percepção de Valor', text: 'O prêmio do nível Diamante precisa valer o esforço acumulado. É o momento de oferecer algo que o cliente normalmente não compraria.' },
                     ].map(item => (
                        <div key={item.n} className="bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                           <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center text-white dark:text-slate-900 font-black text-xs shadow-lg`}>{item.n}</div>
                           <h4 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest">{item.title}</h4>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{item.text}</p>
                        </div>
                     ))}
                  </div>
               </div>
               <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-5">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">🚀 Estratégias para Vender Mais</h4>
                  <div className="grid grid-cols-1 gap-4">
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800/50">
                        <h5 className="text-[10px] font-black text-primary-500 uppercase tracking-widest">E-commerce / Vendas Online</h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Use os pontos como cupons de desconto progressivos ou frete grátis liberado permanentemente para quem mantiver o nível Ouro ou Diamante ativo.</p>
                     </div>
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800/50">
                        <h5 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Negócios sem Recorrência (Imóveis / Carros)</h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Transforme o programa em um sistema de recompensas por indicações. Cada indicação que vira fechamento gera pontos para subir de nível e liberar prêmios premium.</p>
                     </div>
                  </div>
               </div>
            </div>
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end">
               <Button onClick={onClose} className="px-10 font-black uppercase text-xs tracking-[0.2em] h-14 rounded-xl bg-[#38B6FF] text-white border-none shadow-xl shadow-blue-500/10">OK</Button>
            </div>
         </div>
      </div>
   );
};
