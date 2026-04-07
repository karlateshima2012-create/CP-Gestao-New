import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, StatusModal } from '../../components/ui';
import { 
  Smartphone, 
  Globe, 
  Copy, 
  Monitor, 
  FileText, 
  ExternalLink,
  QrCode,
  Layout
} from 'lucide-react';
import api from '../../services/api';
import { copyToClipboard } from '../../utils/clipboard';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useRef } from 'react';

interface PublicPageTabProps {
  tenantSlug: string | null;
  onRefresh: () => void;
}

export const PublicPageTab: React.FC<PublicPageTabProps> = ({ tenantSlug, onRefresh }) => {
  const [loyaltySettings, setLoyaltySettings] = useState({
    description: '',
    rules_text: '',
    loyalty_active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
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
  const [logo, setLogo] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [logoChanged, setLogoChanged] = useState(false);
  const [coverChanged, setCoverChanged] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputCoverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/client/settings');
      if (res.data) {
        const { tenant, settings } = res.data;
        setLoyaltySettings({
          description: tenant.description || '',
          rules_text: tenant.rules_text || '',
          loyalty_active: tenant.loyalty_active ?? true
        });
        setLogo(tenant.logo_url || null);
        setCover(tenant.cover_url || null);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload: any = {
        description: loyaltySettings.description,
        rules_text: loyaltySettings.rules_text,
        loyalty_active: loyaltySettings.loyalty_active
      };
      
      if (logoChanged) payload.logo_url = logo;
      if (coverChanged) payload.cover_url = cover;

      await api.patch('/client/settings', payload);
      setModal({
        isOpen: true,
        title: 'Sucesso!',
        message: 'Configurações da página pública atualizadas com sucesso.',
        type: 'success'
      });
      setLogoChanged(false);
      setCoverChanged(false);
      onRefresh();
    } catch (error) {
      setModal({
        isOpen: true,
        title: 'Erro!',
        message: 'Falha ao salvar configurações.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setLogo(event.target?.result as string);
      setLogoChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCover(event.target?.result as string);
      setCoverChanged(true);
    };
    reader.readAsDataURL(file);
  };

  const onCopyLink = async () => {
    if (!tenantSlug) return;
    const url = `${window.location.origin}/p/${tenantSlug}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const dashboardUrl = `${window.location.origin}/p/${tenantSlug}`;

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Minha Página Pública</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-lg">Configure o que os seus clientes veem ao acessar seu programa.</p>
      </div>

      {/* DIVULGAÇÃO E QR CODE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LINK PARA BIO */}
        <Card className="p-8 border-2 border-dashed border-primary-100 dark:border-primary-900/30 bg-white dark:bg-slate-900 flex flex-col justify-between gap-6 rounded-[32px]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
              <Globe className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Link para Bio (Instagram)</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Acesso Digital / Ver Saldo</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-mono text-sm text-slate-600 dark:text-slate-400 break-all select-all">
              {dashboardUrl}
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={onCopyLink}
                className={`flex-1 h-14 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all shadow-xl ${copiedLink ? 'bg-emerald-500 text-white shadow-emerald-500/10' : 'bg-[#38B6FF] text-white hover:bg-[#38B6FF]/90 shadow-blue-500/10'}`}
              >
                {copiedLink ? 'COPIADO! ✅' : 'COPIAR LINK'}
              </Button>
              <Button 
                variant="secondary"
                onClick={() => window.open(dashboardUrl, '_blank')}
                className="h-12 w-12 rounded-2xl p-0 flex items-center justify-center"
              >
                <ExternalLink className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </Card>

        {/* PLACA DO CAIXA */}
        <Card className="p-8 border-none bg-slate-900 text-white flex flex-col justify-between gap-6 rounded-[32px] overflow-hidden relative">
          <QrCode className="absolute -right-8 -top-8 w-48 h-48 opacity-10 rotate-12" />
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
              <Monitor className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Placa do Caixa (Física)</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Uso presencial no estabelecimento</p>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <p className="text-sm text-slate-300 font-medium leading-relaxed">
              Esta é a única imagem que deve ser impressa e colada no balcão. Ela contém o link seguro para pontuação via terminal.
            </p>
            <Button 
              className="w-full h-14 bg-white text-slate-900 hover:bg-slate-100 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 transition-all"
              onClick={() => {
                window.open(`${window.location.origin}/terminal/${tenantSlug}`, '_blank');
              }}
            >
              🖨️ IMPRIMIR QR CODE
            </Button>
          </div>
        </Card>
      </div>

      {/* IDENTIDADE VISUAL */}
      <Card className="p-8 border-none shadow-sm rounded-[32px] space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
          <ImageIcon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Identidade Visual</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Logo Upload */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Logotipo da Loja</label>
            <div className="relative group">
              <div className="w-40 h-40 rounded-3xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 group-hover:border-primary-500 transition-all">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-contain p-4" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white"
                >
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-black uppercase">Alterar Logo</span>
                </button>
              </div>
              {logo && (
                <button
                  onClick={() => { setLogo(null); setLogoChanged(true); }}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
            </div>
          </div>

          {/* Banner/Cover Upload */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Imagem de Banner (Capa)</label>
            <div className="relative group">
              <div className="w-full h-40 rounded-3xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 group-hover:border-primary-500 transition-all">
                {cover ? (
                  <img src={cover} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-gray-300" />
                )}
                <button
                  onClick={() => fileInputCoverRef.current?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-white"
                >
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-[10px] font-black uppercase">Alterar Banner</span>
                </button>
              </div>
              {cover && (
                <button
                  onClick={() => { setCover(null); setCoverChanged(true); }}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <input type="file" ref={fileInputCoverRef} onChange={handleCoverUpload} className="hidden" accept="image/*" />
            </div>
          </div>
        </div>
      </Card>

      {/* CONFIGURAÇÃO DE TEXTOS */}
      <Card className="p-8 border-none shadow-sm rounded-[32px] space-y-8">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
          <Layout className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Conteúdo da Página</h3>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Descrição que aparece no topo</label>
            <textarea
              value={loyaltySettings.description}
              onChange={(e) => setLoyaltySettings({ ...loyaltySettings, description: e.target.value })}
              placeholder="Ex: Participe do nosso programa VIP e ganhe prêmios exclusivos..."
              className="w-full h-28 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[20px] font-medium text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Regras e Instruções (Tópicos)</label>
            <textarea
              value={loyaltySettings.rules_text}
              onChange={(e) => setLoyaltySettings({ ...loyaltySettings, rules_text: e.target.value })}
              placeholder="Digite cada regra em uma nova linha..."
              className="w-full h-40 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[20px] font-medium text-sm outline-none focus:ring-2 focus:ring-primary-500/20 transition-all resize-none shadow-inner leading-relaxed"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button 
            className="w-full h-14 bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-white font-black uppercase text-xs tracking-[0.2em] rounded-2xl shadow-xl shadow-blue-500/10 transition-all border-none"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar Alterações da Página'}
          </Button>
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
