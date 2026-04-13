import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Star, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  Info,
  ChevronRight,
  ChevronLeft,
  Settings,
  LayoutDashboard,
  Users,
  Activity,
  Zap,
  Rocket
} from 'lucide-react';
import { Button } from './ui';

interface ProfessionalOnboardingProps {
  onComplete: () => void;
  onChangeTab: (tab: string) => void;
  activeTab: string;
}

type OnboardingPhase = 'setup' | 'tour' | 'success';

const onboardingSteps = [
  // PHASE 0: INTRO
  {
    id: 'intro',
    phase: 'setup',
    title: "Seja bem-vindo!",
    subtitle: "Vamos decolar seu negócio? 🚀",
    description: "Preparamos um guia rápido de 3 passos para você configurar seu programa de fidelidade e começar a ver seus clientes voltarem mais vezes.",
    target: 'body',
    tab: 'dashboard'
  },
  // PHASE 1: SETUP
  {
    id: 'setup-telegram',
    phase: 'setup',
    title: "PASSO 1/3 • Notificações",
    subtitle: "Robô de Alerta Sonoro",
    description: "Configure seu Chat ID aqui para receber um aviso no celular (Telegram) toda vez que alguém ganhar pontos ou se cadastrar.",
    target: '#onboarding-telegram-chatid',
    tab: 'account',
    tip: "O Chat ID é como o 'endereço' para o robô saber para qual celular mandar a mensagem."
  },
  {
    id: 'setup-loyalty-reward',
    phase: 'setup',
    title: "PASSO 2/3 • O Grande Prêmio",
    subtitle: "O que o cliente ganha?",
    description: "Defina aqui o prêmio que o cliente vai receber ao completar a meta (ex: um Sushi Especial, ¥1000 de desconto, etc).",
    target: '#onboarding-loyalty-reward',
    tab: 'loyalty',
    tip: "Um prêmio atraente é o maior motivo para o seu cliente ser fiel à sua loja!"
  },
  {
    id: 'setup-loyalty-goal',
    phase: 'setup',
    title: "PASSO 2/3 • Meta de Pontos",
    subtitle: "Esforço vs Recompensa",
    description: "Quantas visitas ou pontos o cliente precisa acumular para ganhar o prêmio? No plano VIP, ele já começa com 1 ponto de bônus!",
    target: '#onboarding-loyalty-goal',
    tab: 'loyalty'
  },
  {
    id: 'setup-public',
    phase: 'setup',
    title: "PASSO 3/3 • Link da Bio",
    subtitle: "Sua Vitrine Digital",
    description: "Este é o seu link exclusivo. Copie e cole na Bio do seu Instagram ou no seu Status do WhatsApp agora mesmo!",
    target: '#side-tab-account',
    tab: 'account',
    tip: "Transforme seguidores em clientes fiéis com esse link."
  },
  // PHASE 2: TOUR
  {
    id: 'tour-dashboard',
    phase: 'tour',
    title: "Operação • Dashboard",
    subtitle: "O pulso da sua loja",
    description: "Aqui você verá o gráfico de crescimento, quantos pontos foram dados hoje e o total de clientes cadastrados.",
    target: '#side-tab-dashboard',
    tab: 'dashboard'
  },
  {
    id: 'tour-visits',
    phase: 'tour',
    title: "Operação • Aprovar Pontos",
    subtitle: "Painel de Controle",
    description: "Nesta aba ficam os pedidos de pontos que chegam do seu Totem. Você aprova e o cliente recebe a notificação na hora!",
    target: '#side-tab-visits',
    tab: 'visits'
  },
  {
    id: 'tour-clients',
    phase: 'tour',
    title: "Operação • CRM",
    subtitle: "Sua Lista de Ouro",
    description: "Veja o histórico de cada cliente, quem não aparece faz tempo e quem são os seus clientes VIP (que mais gastam).",
    target: '#side-tab-clients',
    tab: 'clients'
  }
];

export const ProfessionalOnboarding: React.FC<ProfessionalOnboardingProps> = ({ 
  onComplete, 
  onChangeTab,
  activeTab
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [phase, setPhase] = useState<OnboardingPhase>('setup');
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const step = onboardingSteps[currentStep];

  // Update spotlight position when step or tab changes
  useEffect(() => {
    const updatePosition = () => {
      if (step.target === 'body') {
        setHighlightRect(null);
        return;
      }
      
      const el = document.querySelector(step.target);
      if (el) {
        setHighlightRect(el.getBoundingClientRect());
      } else {
        // Fallback to tab sidebar if specific target not found yet
        const sidebarTab = document.querySelector(`#side-tab-${step.tab}`);
        if (sidebarTab) setHighlightRect(sidebarTab.getBoundingClientRect());
      }
    };

    // Small delay to allow tab content to render
    const timeout = setTimeout(updatePosition, 300);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePosition);
    };
  }, [currentStep, activeTab]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onChangeTab(onboardingSteps[nextStep].tab);
      
      if (onboardingSteps[nextStep].phase !== phase) {
        setPhase(onboardingSteps[nextStep].phase as OnboardingPhase);
      }
    } else {
      setPhase('success');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onChangeTab(onboardingSteps[prevStep].tab);
      setPhase(onboardingSteps[prevStep].phase as OnboardingPhase);
    }
  };

  if (phase === 'success') {
    return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md animate-fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] shadow-2xl p-10 text-center space-y-8 animate-scale-in border border-slate-100 dark:border-slate-800">
          <div className="w-24 h-24 bg-[#38B6FF] rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30">
            <Rocket className="w-12 h-12 text-white animate-pulse" />
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">PARABÉNS! 🏆</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Seu sistema está pronto para decolar e seus clientes vão amar o programa!</p>
          </div>
          <Button 
            onClick={onComplete}
            className="w-full h-20 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-xl shadow-2xl transition-all hover:scale-[1.02] active:scale-95 border-none uppercase tracking-widest"
          >
            Começar Agora 🚀
          </Button>
        </div>
      </div>
    );
  }

  const isIntro = step.id === 'intro';

  return (
    <div className="fixed inset-0 z-[150] pointer-events-none overflow-hidden font-sans">
      {/* Dark Overlay with Spotlight Hole */}
      <div className="absolute inset-0 bg-slate-950/60 dark:bg-black/80 pointer-events-auto transition-all duration-500" style={{
        clipPath: highlightRect ? `polygon(
          0% 0%, 0% 100%, 
          ${highlightRect.left - 10}px 100%, 
          ${highlightRect.left - 10}px ${highlightRect.top - 10}px, 
          ${highlightRect.right + 10}px ${highlightRect.top - 10}px, 
          ${highlightRect.right + 10}px ${highlightRect.bottom + 10}px, 
          ${highlightRect.left - 10}px ${highlightRect.bottom + 10}px, 
          ${highlightRect.left - 10}px 100%, 
          100% 100%, 100% 0%
        )` : 'none'
      }} onClick={(e) => e.stopPropagation()} />

      {/* Floating UI Card */}
      <div className={`absolute pointer-events-auto transition-all duration-700 ease-out ${isIntro ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' : ''}`} style={{
        top: !isIntro && highlightRect ? Math.max(20, Math.min(window.innerHeight - 480, highlightRect.top - 100)) : (isIntro ? '' : '50%'),
        left: !isIntro && highlightRect ? (highlightRect.right + 40 > window.innerWidth - 420 ? highlightRect.left - 420 : highlightRect.right + 40) : (isIntro ? '' : '50%'),
        visibility: isIntro || highlightRect ? 'visible' : 'hidden'
      }}>
        <div className="w-[calc(100vw-32px)] sm:w-[380px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="p-6 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#38B6FF] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Zap className="w-5 h-5 text-white fill-current" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{step.title}</span>
                <span className="text-[10px] font-bold text-[#38B6FF] uppercase tracking-widest mt-0.5">Setup Profissional</span>
              </div>
            </div>
            {isIntro && (
               <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center animate-bounce">
                 <Rocket className="w-4 h-4 text-slate-400" />
               </div>
            )}
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-[0.9]">
                {step.subtitle}
              </h3>
              <p className="text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {step.description}
              </p>
            </div>

            {step.tip && (
              <div className="p-5 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-4 animate-fade-in-up">
                <div className="p-2 bg-amber-400 rounded-lg h-fit">
                   <Info className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-400 font-bold leading-snug">
                  {step.tip}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex flex-col space-y-5 pt-2">
              <Button 
                onClick={handleNext}
                className="w-full h-16 bg-[#38B6FF] hover:bg-[#1a9ad2] text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 group transition-all hover:shadow-2xl hover:shadow-blue-500/30 active:scale-95 border-none uppercase tracking-widest"
              >
                {currentStep === onboardingSteps.length - 1 ? 'FINALIZAR GUIA' : 'Seguir para o próximo'} 
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Button>
              
              <div className="flex items-center justify-between px-2">
                <button 
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="text-xs font-bold text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-0 transition-all flex items-center gap-1.5 uppercase tracking-widest"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
                
                <div className="flex gap-2">
                  {onboardingSteps.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-8 bg-[#38B6FF]' : 'w-2 bg-slate-200 dark:bg-slate-800'}`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
