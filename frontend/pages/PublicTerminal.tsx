import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, StatusModal } from '../components/ui';
import { validatePhone } from '../utils/phoneValidation';

const animationStyles = `
@keyframes starBurst {
  0% { transform: rotate(var(--star-angle)) translateY(0) scale(0.8); opacity: 1; }
  100% { transform: rotate(var(--star-angle)) translateY(calc(-1 * var(--star-dist))) scale(1.2); opacity: 0; }
}
.animate-star-burst {
  animation: starBurst 0.8s ease-out forwards;
  animation-delay: var(--star-delay);
}
button:focus, a:focus, input:focus {
  outline: none !important;
}
.focus-ring-gray {
  box-shadow: 0 0 0 4px rgba(209, 213, 219, 0.5) !important;
}
`;
import {
  Smartphone,
  CheckCircle2,
  Check,
  XCircle,
  ArrowRight,
  Gift,
  Search,
  ChevronLeft,
  UserPlus,
  UserCheck,
  Trophy,
  X,
  AlertCircle,
  Star,
  Camera,
  Upload
} from 'lucide-react';
import { terminalService, contactsService } from '../services/api';

type TerminalMode =
  | 'START'
  | 'CONSULT'
  | 'RESULT_CLIENT'
  | 'LOJISTA_ACTIONS'
  | 'LOJISTA_QUICK_REGISTER'
  | 'SUCCESS'
  | 'AUTO_SUCCESS'
  | 'ERROR'
  | 'LOADING'
  | 'INVALID_DEVICE'
  | 'REGISTER'
  | 'PONTUAR'
  | 'LEVEL_UP'
  | 'VISIT_NOT_FOUND'
  | 'WAITING_APPROVAL';

interface PublicTerminalProps {
  slug?: string;
  uid?: string | null;
  contacts?: any[];
  onUpdatePoints?: (phone: string, points: number) => void;
  onQuickRegister?: (customer: any) => void;
  forceShowOwnerActions?: boolean;
}

const DefaultLogo: React.FC<{ className?: string }> = ({ className = "w-32 h-32" }) => (
  <div className={`grid grid-cols-4 grid-rows-4 gap-[8%] bg-white dark:bg-gray-800 p-6 rounded-[15px] shadow-inner ${className}`}>
    <div className="col-span-2 row-span-2 bg-gray-200 dark:bg-gray-700 rounded-[15%]"></div>
    <div className="col-start-3 row-start-1 col-span-1 row-span-1 bg-gray-300 dark:bg-gray-600 rounded-[15%]"></div>
    <div className="col-start-3 row-start-2 col-span-1 row-span-1 bg-gray-400 dark:bg-gray-500 rounded-[15%]"></div>
    <div className="col-start-4 row-start-2 col-span-1 row-span-1 bg-gray-200 dark:bg-gray-700 rounded-[15%]"></div>
    <div className="col-span-2 row-span-2 bg-gray-400 dark:bg-gray-500 rounded-[15%]"></div>
    <div className="col-span-2 row-span-2 bg-gray-300 dark:bg-gray-600 rounded-[15%]"></div>
  </div>
);

export const PublicTerminal: React.FC<PublicTerminalProps> = ({
  slug: propSlug,
  uid: propUid
}) => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = animationStyles;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [mode, setMode] = useState<TerminalMode>('LOADING');
  const [phone, setPhone] = useState('');
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    city: '',
    province: '',
    postalCode: '',
    address: '',
    companyName: '',
    photo: undefined as string | undefined
  });


  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [deviceUid, setDeviceUid] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [tenantSlug, setTenantSlug] = useState('');
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [approvedData, setApprovedData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [rewardModal, setRewardModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    points: 0,
    goal: 10
  });

  useEffect(() => {
    console.log("CP Gestao Version: 2.7.2 - Digital Ready");
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) setQrToken(token);
  }, []);

  // Polling for Approval & Balance Updates
  useEffect(() => {
    let interval: any;

    // 1. Polling for a SPECIFIC request approval
    if (mode === 'WAITING_APPROVAL' && requestId && tenantSlug && deviceUid) {
      interval = setInterval(async () => {
        try {
          const res = await terminalService.getRequestStatus(tenantSlug, deviceUid, requestId);
          if (res.data.status === 'approved') {
            setApprovedData(res.data);
            setMode('SUCCESS');
            clearInterval(interval);
          } else if (res.data.status === 'rejected') {
            setModal({
              isOpen: true,
              title: 'Solicitação Recusada',
              message: 'Sua solicitação não foi aprovada pelo gerente.',
              type: 'error'
            });
            setMode('RESULT_CLIENT');
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Polling error (Approval):', error);
        }
      }, 3000);
    }
    // 2. Polling for GENERAL balance updates (Real-time feeling when merchant approves via Telegram/Admin)
    else if (mode === 'RESULT_CLIENT' && foundCustomer && tenantSlug && phone) {
      interval = setInterval(async () => {
        try {
          const res = await terminalService.lookup(tenantSlug, deviceUid, phone, qrToken, sessionToken);
          if (res.data && res.data.points_balance !== foundCustomer.points_balance) {
            console.log("Real-time balance update detected!");
            setFoundCustomer(res.data);
          }
        } catch (error) {
          // Silent fail for background polling
        }
      }, 5000); // Check every 5s for balance changes
    }

    return () => clearInterval(interval);
  }, [mode, requestId, tenantSlug, deviceUid, foundCustomer, phone, qrToken, sessionToken]);

  const formatJapanesePhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 15);
    if (digits.length !== 11) return digits;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const normalizeText = (text: string) => {
    return text.toLowerCase().replace(/(^\w|\s\w)/g, m => m.toUpperCase());
  };

  useEffect(() => {
    if (propSlug) {
      setTenantSlug(propSlug);
      setDeviceUid(propUid || null);
      resolveTerminal(propSlug, propUid || undefined);
    } else {
      const path = window.location.pathname;
      const parts = path.split('/').filter(p => p);

      const pIdx = parts.indexOf('p');
      const tIdx = parts.indexOf('terminal');

      if (tIdx !== -1 && parts[tIdx + 1]) {
        const s = parts[tIdx + 1];
        const params = new URLSearchParams(window.location.search);
        const u = parts[tIdx + 2] || params.get('device') || params.get('uid');
        setTenantSlug(s);
        setDeviceUid(u);
        resolveTerminal(s, u);
      } else if (pIdx !== -1 && parts[pIdx + 1]) {
        const s = parts[pIdx + 1];
        const params = new URLSearchParams(window.location.search);
        const uidParam = params.get('device') || params.get('uid');
        setTenantSlug(s);
        setDeviceUid(uidParam);
        resolveTerminal(s, uidParam || undefined);
      } else {
        const params = new URLSearchParams(window.location.search);
        const s = params.get('slug') || 'loja-teste';
        const u = params.get('device') || params.get('uid');
        setTenantSlug(s);
        setDeviceUid(u);
        resolveTerminal(s, u || undefined);
      }
    }
  }, [propSlug, propUid]);

  const resolveTerminal = async (slug: string, uid?: string | null) => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');

      console.log(`Resolving Terminal: Slug=${slug}, UID=${uid}, Token=${token}`);
      const res = await terminalService.getInfo(slug, uid, token);
      console.log("Terminal Resolved:", res.data);
      setStoreInfo(res.data);
      const newSessionToken = res.data.session_token;
      if (newSessionToken) setSessionToken(newSessionToken);

      if (token && res.data.token_valid === false) {
        setModal({
          isOpen: true,
          title: 'QR Inválido',
          message: 'Este QR Code já foi utilizado ou é inválido.',
          type: 'error'
        });
      }

      setMode('START');

      const actionParam = urlParams.get('acao');
      const phoneParam = urlParams.get('phone');

      if (phoneParam) {
        setPhone(formatJapanesePhone(phoneParam));
        setTimeout(() => {
          handleLookup(phoneParam, slug, uid, token, newSessionToken);
        }, 100);
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message;
      setErrorMsg(msg);
      setMode('INVALID_DEVICE');
    }
  };


  const handleLookup = async (overridePhone?: string, overrideSlug?: string, overrideUid?: string | null, overrideToken?: string | null, overrideSession?: string | null) => {
    const targetPhone = overridePhone || phone;
    const targetSlug = overrideSlug || tenantSlug;
    const targetUid = overrideUid === undefined ? deviceUid : overrideUid;
    const targetToken = overrideToken || qrToken;
    const targetSession = overrideSession || sessionToken;

    if (!targetPhone || !targetSlug) return;
    if (overridePhone) setPhone(overridePhone);
    setLoading(true);
    try {
      const res = await terminalService.lookup(targetSlug, targetUid, targetPhone, targetToken, targetSession);
      if (res.data && res.data.customer_exists === false) {
        setMode('VISIT_NOT_FOUND');
      } else {
        setFoundCustomer(res.data);
        const isAdmin = !!localStorage.getItem('auth_token');

        if (isTerminalMode) {
          handleEarn(undefined, targetPhone);
        } else if (res.data.show_level_up) {
          setMode('LEVEL_UP');
        } else {
          setMode('RESULT_CLIENT');
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setMode('VISIT_NOT_FOUND');
      } else {
        setModal({
          isOpen: true,
          title: 'Erro',
          message: error.response?.data?.message || 'Erro ao buscar cliente',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConsult = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const validation = validatePhone(phone);
    if (!validation.isValid) {
      setModal({
        isOpen: true,
        title: 'Número Inválido',
        message: validation.message || 'Por favor, verifique o número informado.',
        type: 'warning'
      });
      return;
    }
    
    // Use the cleaned number for lookup
    const cleanedPhone = validation.cleaned;
    setPhone(formatJapanesePhone(cleanedPhone)); // Keep visual format but use cleaned digits
    handleLookup(cleanedPhone);
  };


  const handleEarn = async (e?: React.FormEvent, overridePhone?: string) => {
    if (e) e.preventDefault();
    const targetPhone = overridePhone || phone;
    if (!targetPhone || targetPhone.length < 8) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(30);
    }

    setLoading(true);
    try {
      const lookupRes = await terminalService.lookup(tenantSlug, deviceUid, targetPhone, qrToken, sessionToken);

      if (lookupRes.data.customer_exists) {
        setFoundCustomer(lookupRes.data);
        const earnRes = await terminalService.earn(tenantSlug, deviceUid, targetPhone, undefined, qrToken, sessionToken);
        
        if (earnRes.data.is_reward_ready) {
             setModal({
                 isOpen: true,
                 title: '🏆 RESGATE PENDENTE!',
                 message: earnRes.data.message || 'Seu prêmio está liberado! Dirija-se ao caixa para resgatar.',
                 type: 'warning'
             });
             setMode('START');
             if (qrToken) setQrToken(null);
             return;
        }

        const isAuto = earnRes.data.auto_approved;
        const reachedGoal = earnRes.data.is_reward_ready;
        const backendMsg = earnRes.data.message;

        setRewardModal({
          isOpen: true,
          title: reachedGoal ? 'Meta Atingida! 🎉' : 'Ponto registrado com sucesso!',
          message: backendMsg || (reachedGoal
            ? 'Parabéns! Você acaba de atingir sua meta.\nResgate seu prêmio na próxima visita.'
            : (isAuto
              ? 'Você pode consultar seu saldo clicando no botão abaixo:'
              : 'Assim que aprovado, ele entrará no seu saldo.')),
          points: earnRes.data.new_balance,
          goal: earnRes.data.points_goal
        });

        if (isAuto) {
          setApprovedData({
            points_balance: earnRes.data.new_balance,
            points_goal: earnRes.data.points_goal,
            auto_approved: true
          });
          setFoundCustomer(prev => ({
            ...prev,
            ...earnRes.data,
            points_balance: earnRes.data.new_balance,
            points_goal: earnRes.data.points_goal,
            remaining: Math.max(0, (earnRes.data.points_goal || (prev?.points_goal ?? 10)) - earnRes.data.new_balance)
          }));
        } else {
          setApprovedData({
            points_balance: earnRes.data.new_balance,
            points_goal: earnRes.data.points_goal,
            auto_approved: false
          });
        }

        setMode(isAuto ? 'AUTO_SUCCESS' : 'WAITING_APPROVAL');
        setShowStars(true);
        setTimeout(() => setShowStars(false), 1500);
        if (qrToken) setQrToken(null);
      } else {
        setMode('VISIT_NOT_FOUND');
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ocorreu um erro. Tente novamente.';
      const status = error.response?.status;

      if (status === 429 || status === 403 || status === 409) {
        setModal({ isOpen: true, title: 'Atenção', message: msg, type: 'warning' });
      } else if (status >= 500) {
        setModal({ isOpen: true, title: 'Erro de Comunicação', message: 'Houve uma instabilidade momentânea no processamento do seu ponto.', type: 'error' });
      } else {
        setMode('VISIT_NOT_FOUND');
      }
    } finally {
      setLoading(false);
    }
  };


  const handleRedeem = async (confirmed = false) => {
    const isAdmin = !!localStorage.getItem('auth_token');
    if (isAdmin && !confirmed) {
      setModal({
        isOpen: true,
        title: 'Confirmar Entrega',
        message: 'Deseja confirmar a entrega do prêmio agora? O ciclo do cliente será reiniciado.',
        type: 'warning',
        onConfirm: () => handleRedeem(true)
      });
      return;
    }

    setLoading(true);
    try {
      const res = await terminalService.redeem(tenantSlug, deviceUid, phone, undefined, qrToken, sessionToken);
      const isAuto = res.data.auto_approved;
      setRequestId(res.data.request_id);

      if (isAdmin && isAuto) {
        setFoundCustomer((prev: any) => {
          if (!prev) return prev;
          return {
            ...prev,
            points_balance: res.data.new_balance,
            loyalty_level: res.data.loyalty_level ?? prev.loyalty_level,
            loyalty_level_name: res.data.loyalty_level_name || prev.loyalty_level_name,
            points_goal: res.data.points_goal || prev.points_goal
          };
        });

        setModal({
          isOpen: true,
          title: 'Prêmio Entregue!',
          message: res.data.message || `Resgate processado com sucesso.`,
          type: 'success'
        });
      } else if (isAuto) {
        setApprovedData({
          customer_name: res.data.customer_name || foundCustomer?.name,
          points_balance: res.data.new_balance,
          loyalty_level_name: res.data.loyalty_level_name || foundCustomer?.loyalty_level_name,
          points_goal: res.data.points_goal || storeInfo?.points_goal,
          tenant_name: storeInfo?.name,
          is_redemption: true
        });
        setMode('AUTO_SUCCESS');
      } else {
        setMode('WAITING_APPROVAL');
      }
    } catch (error: any) {
      setModal({ isOpen: true, title: 'Erro ao Resgatar', message: error.response?.data?.message || 'Erro ao processar resgate.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: 'earn' | 'redeem') => {
    if (action === 'earn') handleEarn();
    if (action === 'redeem') handleRedeem(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !foundCustomer) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('phone', phone);
    if (qrToken) formData.append('token', qrToken);

    try {
      const res = await terminalService.updatePhoto(tenantSlug, deviceUid, formData);
      setFoundCustomer((prev: any) => ({
        ...prev,
        foto_perfil_url: res.data.foto_perfil_url,
        foto_perfil_thumb_url: res.data.foto_perfil_thumb_url
      }));
      setModal({ isOpen: true, title: 'Sucesso', message: 'Foto de perfil atualizada!', type: 'success' });
    } catch (error: any) {
      setModal({ isOpen: true, title: 'Erro no Upload', message: 'Não foi possível atualizar a foto agora.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerData.name) return;
    setLoading(true);
    try {
      const res = await terminalService.register(tenantSlug, deviceUid, {
        name: customerData.name,
        phone: phone,
        email: customerData.email,
        city: customerData.city,
        province: customerData.province,
        postal_code: customerData.postalCode,
        address: customerData.address,
        company_name: customerData.companyName,
        photo: customerData.photo
      });
      const isAdmin = !!localStorage.getItem('auth_token');

      setFoundCustomer(res.data);
      setApprovedData({
        customer_name: res.data.name,
        points_balance: res.data.points_balance,
        points_goal: res.data.points_goal,
        tenant_name: storeInfo?.name,
        is_registration: true,
        auto_approved: true
      });
      setQrToken(null);
      setMode('AUTO_SUCCESS');
    } catch (error: any) {
      setModal({ isOpen: true, title: 'Erro no Cadastro', message: error.response?.data?.message || 'Erro ao cadastrar.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewBalance = () => {
    if (window.location.pathname.includes('/terminal') && tenantSlug) {
      // Força um redirecionamento físico para a URL pública para "queimar" o link do terminal no histórico do cliente
      window.location.href = `/p/${tenantSlug}`;
    } else {
      setMode('RESULT_CLIENT');
    }
  };

  const reset = () => {
    setMode('START');
    setPhone('');
    setCustomerData({ name: '', email: '', city: '', province: '', postalCode: '', address: '', companyName: '', photo: undefined });
    setFoundCustomer(null);
    setLoading(false);
    setQrToken(null);
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  };

  if (mode === 'LOADING') return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 font-sans"><p className="text-gray-400 font-bold animate-pulse">CARREGANDO TERMINAL...</p></div>;
  if (mode === 'INVALID_DEVICE') return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 font-sans"><p className="text-gray-400 font-bold">{errorMsg || 'DISPOSITIVO INVÁLIDO'}</p></div>;

  const isTerminalMode = window.location.pathname.includes('/terminal') || !!(deviceUid || qrToken);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-sans selection:bg-slate-900 selection:text-white pb-20 overflow-x-hidden flex flex-col items-center">
      <div className="w-full md:w-[85%] max-w-4xl bg-white dark:bg-slate-900 md:rounded-t-none md:rounded-b-[50px] shadow-2xl relative z-20 flex flex-col overflow-hidden animate-fade-in border-none">
        
        {/* Header Section */}
        <div className="h-80 md:h-[500px] w-full bg-slate-200 dark:bg-slate-800 relative shrink-0 overflow-hidden">
          {storeInfo?.cover_url ? (
            <img src={storeInfo?.cover_url} alt="Cover" className="w-full h-full object-cover block absolute inset-0" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-700 to-gray-900" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/40 to-black/30"></div>

          <div className="absolute inset-0 flex flex-col items-start justify-start pt-8 pb-12 px-8 md:px-12 text-white">
            <div className="flex flex-col items-start gap-4 md:gap-6 w-full">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-[24px] shadow-2xl flex shrink-0 items-center justify-center overflow-hidden ring-4 ring-white/20 backdrop-blur-xl bg-white/5 animate-scale-in">
                {storeInfo?.logo_url ? (
                  <img src={storeInfo?.logo_url} alt={storeInfo?.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center">
                    <DefaultLogo className="w-full h-full p-8" />
                  </div>
                )}
              </div>

              <div className="flex flex-col drop-shadow-2xl max-w-3xl text-left" style={{ textShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white leading-tight drop-shadow-xl uppercase">
                  {storeInfo?.name || 'Carregando...'}
                </h1>
                <p className="mt-2 text-sm md:text-xl text-white/90 font-bold leading-relaxed drop-shadow-lg">
                  {storeInfo?.description || 'Obrigado por nos visitar!'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Start Mode - Single Entry Point */}
        {mode === 'START' && (
          <div className="p-4 md:p-8 animate-fade-in w-full space-y-8 bg-white dark:bg-gray-950 flex flex-col items-center">
            
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl p-6 md:p-10 shadow-[0_35px_80px_-20px_rgba(0,0,0,0.12)] border border-gray-100 dark:border-slate-800 flex flex-col items-center text-center space-y-8 group hover:shadow-[0_45px_100px_-15px_rgba(0,0,0,0.18)] transition-all duration-500 relative overflow-hidden">
              
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-bl-[80px] -mr-8 -mt-8 group-hover:scale-110 transition-transform duration-500 blur-2xl opacity-40"></div>

              <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-700 relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {isTerminalMode ? (
                  <Star className="w-10 h-10 text-slate-900 dark:text-white relative z-10" />
                ) : (
                  <Smartphone className="w-10 h-10 text-slate-900 dark:text-white relative z-10" />
                )}
              </div>

              <div className="space-y-4 pt-2 relative z-10">
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-[0.9]">
                  {isTerminalMode ? (
                    <>
                      SOLICITAR
                      <span className="text-slate-400 block mt-1">PONTO</span>
                    </>
                  ) : (
                    <>
                      PORTAL DO
                      <span className="text-slate-400 block mt-1">CLIENTE</span>
                    </>
                  )}
                </h3>
                <div className="h-1 w-8 bg-slate-200 dark:bg-slate-800 mx-auto rounded-full"></div>
                
                <div className="space-y-1">
                  <h4 className="text-sm md:text-base font-black text-slate-700 dark:text-slate-200 tracking-tighter leading-[0.9]">
                    Digite seu telefone
                  </h4>
                  <p className="text-sm md:text-base font-medium text-slate-500 dark:text-slate-400">
                    {isTerminalMode ? 'Solicite seu ponto ou cadastre-se' : 'Verifique seu saldo ou cadastre-se em segundos.'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleConsult} className="w-full space-y-6 relative z-10">
                <div className="relative group/input">
                  <Smartphone className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-200 group-focus-within/input:text-slate-900 transition-colors" />
                  <input
                    type="tel"
                    placeholder="090-0000-0000"
                    className="w-full h-14 pl-14 pr-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-800 focus:border-slate-900 dark:focus:border-white rounded-lg text-2xl font-black tracking-widest text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-200 dark:placeholder:text-slate-700 shadow-inner"
                    value={phone}
                    onChange={e => setPhone(formatJapanesePhone(e.target.value))}
                    autoFocus
                  />
                </div>

                <div className="relative pt-2">
                  <Button
                    type="submit"
                    isLoading={loading}
                    className="w-full h-14 text-lg font-black uppercase tracking-[0.1em] bg-[#64748B] hover:bg-[#475569] text-white rounded-lg shadow-lg transition-all active:scale-[0.98] border-none"
                  >
                    {isTerminalMode ? 'SOLICITAR PONTO' : 'ENTRAR'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Visit Not Found - Suggest Registration */}
        {mode === 'VISIT_NOT_FOUND' && (
          <div className="p-6 md:p-12 text-center animate-fade-in space-y-8 w-full min-h-[400px] flex flex-col justify-center items-center bg-white dark:bg-gray-950">
            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-900 dark:text-white">
              <UserPlus className="w-12 h-12" />
            </div>
            <div className="space-y-4 max-w-md">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">PRIMEIRA VEZ AQUI?</h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                Cadastre-se em segundos para começar a ganhar pontos!
              </p>
            </div>
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <Button onClick={() => setMode('REGISTER')} className="w-full h-20 bg-[#64748B] hover:bg-[#475569] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl text-sm">
                CADASTRAR AGORA
              </Button>
              <button onClick={() => setMode('START')} className="text-gray-400 hover:text-gray-600 font-bold uppercase text-[10px] tracking-widest py-2 transition-colors">
                Tentar outro número
              </button>
            </div>
          </div>
        )}

        {/* Level Up Mode */}
        {mode === 'LEVEL_UP' && foundCustomer && (
          <div className="p-8 md:p-12 text-center relative overflow-hidden animate-fade-in space-y-10 w-full max-w-lg mx-auto bg-white dark:bg-gray-950 flex flex-col items-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping bg-amber-400/20 rounded-full scale-150"></div>
              <div className="w-32 h-32 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-white shadow-2xl relative z-10 border-4 border-white">
                <Trophy className="w-16 h-16 animate-bounce" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-tight">
                Parabéns, {foundCustomer.name.split(' ')[0]}!
              </h2>
              <p className="text-xl font-bold text-slate-600 dark:text-slate-400">Você conquistou o nível:</p>
              <div className="inline-flex items-center gap-3 px-8 py-4 rounded-3xl bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                <span className="text-3xl font-black uppercase tracking-tighter">{foundCustomer.loyalty_level_name}</span>
              </div>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
              Seus benefícios foram atualizados! Agora você ganha pontos mais rápido.
            </p>
            <Button
              onClick={() => setMode('RESULT_CLIENT')}
              className="w-full h-20 bg-[#64748B] hover:bg-[#475569] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl text-lg flex items-center justify-center gap-3 group"
            >
              Ver Meus Pontos <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {/* Result Client Mode */}
        {mode === 'RESULT_CLIENT' && foundCustomer && (
          <div className="p-6 md:p-12 relative overflow-hidden animate-fade-in space-y-10 w-full max-w-lg mx-auto flex flex-col items-center bg-white dark:bg-gray-950">
            <button onClick={reset} className="absolute top-6 right-6 p-2.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-500 hover:text-slate-900 rounded-full z-20 border border-slate-200/50 shadow-sm"><X className="w-5 h-5" /></button>
            
            <div className="relative w-32 h-32 md:w-40 md:h-40 group mt-4">
              <label className="cursor-pointer block w-full h-full">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                  {foundCustomer.foto_perfil_url ? (
                    <img 
                      src={foundCustomer.foto_perfil_url} 
                      alt={foundCustomer.name} 
                      className="w-full h-full object-cover"
                      key={foundCustomer.foto_perfil_url}
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white font-black text-4xl">
                      {foundCustomer.name ? foundCustomer.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all border-4 border-slate-50 dark:border-slate-800 z-20">
                  <Camera className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <input 
                  type="file" 
                  accept="image/jpeg,image/png,image/webp,image/heic" 
                  className="hidden" 
                  onChange={handlePhotoUpload} 
                  disabled={uploading} 
                />
              </label>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Portal do cliente</h3>
              <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{foundCustomer?.name || 'Cliente'}</p>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <span className="text-[12px] font-black uppercase tracking-widest">{foundCustomer.loyalty_level_name || 'Bronze'}</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-[30px] p-8 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 shadow-xl relative overflow-hidden w-full">
              <div className="text-center space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Saldo Disponível</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-7xl font-black tracking-tighter tabular-nums text-slate-900 dark:text-white">{foundCustomer?.points_balance}</span>
                    <span className="text-2xl font-black text-slate-300 dark:text-slate-600">/ {foundCustomer?.points_goal || storeInfo?.points_goal}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-50 dark:border-slate-700/50">
                  <p className="text-sm font-bold text-slate-600 dark:text-slate-400 italic text-center">
                    {foundCustomer.remaining <= 0 
                      ? "Meta Atingida! 🎁" 
                      : `Faltam ${foundCustomer.remaining} pontos para: ${foundCustomer.reward_name || 'o prêmio'}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full px-4 -mt-2 mb-2">
              <Button
                onClick={reset}
                className="w-full h-14 text-lg font-black uppercase tracking-[0.1em] bg-[#64748B] hover:bg-[#475569] text-white rounded-lg shadow-lg transition-all active:scale-[0.98] border-none"
              >
                FECHAR E SAIR
              </Button>
            </div>
          </div>
        )}

        {/* Lojista Actions Mode */}
        {mode === 'LOJISTA_ACTIONS' && foundCustomer && (() => {
          const balance = Number(foundCustomer.points_balance || 0);
          const goal = Number(foundCustomer.points_goal || storeInfo?.points_goal || 10);
          const canRedeem = balance >= goal;
          return (
            <div className="p-6 md:p-10 relative overflow-hidden animate-fade-in space-y-8 w-full max-w-lg mx-auto flex flex-col items-center bg-white dark:bg-gray-950">
              <button onClick={reset} className="absolute top-6 right-6 p-2.5 bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-500 hover:text-slate-900 rounded-full z-20 shadow-sm"><X className="w-5 h-5" /></button>
              
              <div className="relative w-32 h-32 md:w-40 md:h-40 group mt-4">
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                  {foundCustomer.foto_perfil_url ? (
                    <img src={foundCustomer.foto_perfil_url} alt={foundCustomer.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white font-black text-4xl">
                      {foundCustomer.name[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Atendimento</h3>
                <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">{foundCustomer?.name}</p>
                <p className="text-[11px] font-bold text-slate-400">{foundCustomer?.phone}</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-[30px] p-8 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 shadow-xl w-full">
                <div className="text-center space-y-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Saldo Atual</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-7xl font-black tracking-tighter text-slate-900 dark:text-white">{balance}</span>
                      <span className="text-2xl font-black text-slate-300 dark:text-slate-600">/ {goal}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 w-full">
                <Button
                  onClick={() => handleAction(canRedeem ? 'redeem' : 'earn')}
                  isLoading={loading}
                  className={`w-full h-20 ${canRedeem ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#64748B] hover:bg-[#475569]'} text-white rounded-[25px] font-black uppercase text-xl shadow-2xl`}
                >
                  {canRedeem ? 'RESGATAR PRÊMIO' : 'LANÇAR PONTO'}
                </Button>
                <button onClick={reset} className="text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">CANCELAR</button>
              </div>
            </div>
          );
        })()}

        {/* Register Mode */}
        {mode === 'REGISTER' && (
          <div className="p-6 md:p-8 relative overflow-hidden animate-fade-in space-y-6 w-full max-w-lg mx-auto bg-white dark:bg-gray-950">
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="flex items-center justify-start">
                <button type="button" onClick={() => setMode('START')} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:bg-slate-200"><ChevronLeft className="w-5 h-5" /></button>
              </div>
              <div className="text-center space-y-4">
                <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Criar Cadastro</h2>
                <p className="text-sm text-slate-500 font-medium">Preencha seus dados para ganhar seu primeiro ponto!</p>
              </div>
              <div className="space-y-4">
                <Input label="Nome Completo *" value={customerData.name} placeholder="Digite seu nome completo" onChange={e => setCustomerData({ ...customerData, name: normalizeText(e.target.value) })} required />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Seu Telefone *" value={phone} disabled />
                  <Input label="Cidade *" value={customerData.city} placeholder="Cidade" onChange={e => setCustomerData({ ...customerData, city: normalizeText(e.target.value) })} required />
                </div>
                <Input label="Província *" value={customerData.province} placeholder="Estado" onChange={e => setCustomerData({ ...customerData, province: normalizeText(e.target.value) })} required />
              </div>
              <Button type="submit" isLoading={loading} className="w-full h-20 bg-[#64748B] hover:bg-[#475569] text-white rounded-[25px] font-black uppercase shadow-xl">
                CADASTRAR E GANHAR PONTO
              </Button>
            </form>
          </div>
        )}

        {/* Waiting Approval Mode */}
        {mode === 'WAITING_APPROVAL' && (
          <div className="p-6 md:p-8 text-center py-12 animate-fade-in space-y-8 w-full bg-white dark:bg-gray-950 border-none">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center bg-slate-50 dark:bg-slate-800 rounded-full border-4 border-slate-100 dark:border-slate-700">
              <Smartphone className="w-10 h-10 text-slate-500 animate-bounce" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Ponto registrado com sucesso!</h2>
              <p className="text-base text-slate-600 dark:text-slate-400 font-bold max-w-[320px] mx-auto leading-relaxed">Assim que aprovado, ele entrará no seu saldo.</p>
            </div>
            <Button onClick={handleViewBalance} className="w-full h-20 bg-[#64748B] hover:bg-[#475569] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Ver meu saldo</Button>
          </div>
        )}

        {/* Success / Auto Success Mode */}
        {(mode === 'SUCCESS' || mode === 'AUTO_SUCCESS') && approvedData && (
          <div className="p-6 md:p-8 text-center py-10 animate-fade-in w-full bg-white dark:bg-gray-950">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-50 border-4 border-green-100"><CheckCircle2 className="w-12 h-12 text-green-500" /></div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
              {approvedData.is_registration ? "Cadastro realizado com sucesso!" : "Ponto registrado com sucesso!"}
            </h2>
            <p className="text-sm text-slate-500 font-medium mb-4">
              {approvedData.is_registration 
                ? "Você recebeu 1 ponto de bônus, consulte seu saldo clicando no botão abaixo:" 
                : (approvedData.auto_approved 
                   ? "Você pode consultar seu saldo clicando no botão abaixo:" 
                   : "Assim que aprovado, ele entrará no seu saldo.")
              }
            </p>
            
            {/* O card de saldo só aparece se NÃO for um novo cadastro, para manter a tela limpa conforme solicitado */}
            {!approvedData.is_registration && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-8 mb-8 mt-2 border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                <p className="text-[10px] font-black uppercase text-slate-300 dark:text-slate-600 mb-1">Novo Saldo</p>
                <p className="text-8xl font-black text-slate-900 dark:text-white tracking-tighter">{approvedData.points_balance} <span className="text-3xl text-slate-300 dark:text-slate-700">/ {approvedData.points_goal}</span></p>
              </div>
            )}

            <Button onClick={handleViewBalance} className="w-full h-20 bg-[#64748B] hover:bg-[#475569] text-white rounded-2xl font-black uppercase gap-3"><Gift className="w-5 h-5" /> VER MEU SALDO</Button>
          </div>
        )}
      </div>

      <div className="w-full md:w-[80%] max-w-4xl flex flex-col items-center pb-12 p-6 space-y-8">
        {storeInfo?.rules_text && (
          <div className="w-full bg-white dark:bg-slate-900/50 p-8 rounded-[30px] border border-gray-100 dark:border-slate-800 shadow-sm">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 mb-4 text-center">Regras do Programa</h4>
            <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line text-justify">{storeInfo.rules_text}</div>
          </div>
        )}
        <p className="text-[10px] font-black text-gray-400 tracking-widest text-center">&copy; {new Date().getFullYear()} Creative Print. Todos os direitos reservados.</p>
      </div>

      {modal.isOpen && <StatusModal isOpen={modal.isOpen} title={modal.title} message={modal.message} type={modal.type} theme="neutral" confirmLabel="OK" onClose={() => setModal(prev => ({ ...prev, isOpen: false }))} />}
      <RewardSuccessModal {...rewardModal} onClose={() => { setRewardModal(prev => ({ ...prev, isOpen: false })); setMode('RESULT_CLIENT'); }} />
    </div>
  );
};

const RewardSuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  points: number;
  goal: number;
}> = ({ isOpen, onClose, title, message, points, goal }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in transition-all">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-[40px] shadow-2xl text-center space-y-7 max-w-sm w-full animate-scale-in border border-gray-100 dark:border-gray-800 relative">
        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-700">
          <CheckCircle2 className="w-12 h-12 text-slate-800 dark:text-white" />
        </div>
        <div className="space-y-3">
          <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{title}</h3>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed px-4">{message}</p>
        </div>
        <Button className="w-full bg-[#64748B] hover:bg-[#475569] text-white rounded-[24px] font-black uppercase h-16 shadow-xl" onClick={onClose}><Gift className="w-5 h-5" /> VER MEU SALDO</Button>
      </div>
    </div>
  );
};

export default PublicTerminal;
