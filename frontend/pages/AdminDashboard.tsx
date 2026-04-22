import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, StatusModal } from '../components/ui';
import { Users, AlertTriangle, Plus, Search, Edit2, Lock, Trash2, X, CheckCircle, CheckCircle2, Check, Copy, Calendar, RefreshCw, Save, ArrowUpCircle, Tag as TagIcon, Shield, Download, Crown, Smartphone, Monitor, HelpCircle, ExternalLink, Activity, Settings, Building2, Link, Globe } from 'lucide-react';
import { Tenant, PlanType } from '../types';
import { tenantsService } from '../services/api';
import { copyToClipboard } from '../utils/clipboard';

const PLAN_LIMITS: Record<PlanType, number> = {
  [PlanType.PRO]: 4000,
  [PlanType.UNLIMITED]: 6000,
};

export const AdminDashboard: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'near_limit' | 'expired'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTenantData, setNewTenantData] = useState({
    name: '',
    email: '',
    owner_name: '',
    phone: '',
    plan: PlanType.PRO,
    extra_contacts_quota: 0,
    totems_count: 2,
    plan_expires_at: ''
  });
  const [tenantForDevices, setTenantForDevices] = useState<Tenant | null>(null);
  const [storeDevices, setStoreDevices] = useState<any[]>([]);
  const [newDeviceData, setNewDeviceData] = useState({ name: '', mode: 'approval' });
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string; name: string; url: string; landingUrl: string } | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    tenant: Tenant | null;
  }>({
    isOpen: false,
    tenant: null
  });

  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [manualPin, setManualPin] = useState('');
  const [tempPin, setTempPin] = useState<string | null>(null);
  const [globalMetrics, setGlobalMetrics] = useState<{ total_tenants: number; expiring_soon: number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);


  const handleCopyPublicLink = async (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    const success = await copyToClipboard(url);
    if (success) {
      setStatusModal({
        isOpen: true,
        title: 'Link Copiado!',
        message: `O link público da loja foi copiado: ${url}`,
        type: 'success'
      });
    } else {
      setStatusModal({
        isOpen: true,
        title: 'Erro ao Copiar',
        message: 'Não foi possível copiar o link automatically. Por favor, copie manualmente.',
        type: 'error'
      });
    }
  };


  useEffect(() => {
    fetchTenants();
    fetchGlobalMetrics();
  }, []);

  const fetchTenants = async () => {
    try {
      const res = await tenantsService.getAll();
      setTenants(res.data);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    }
  };

  const fetchGlobalMetrics = async () => {
    try {
      const res = await tenantsService.getGlobalMetrics();
      setGlobalMetrics(res.data);
    } catch (error) {
      console.error('Error fetching global metrics:', error);
    }
  };

  useEffect(() => {
    if (editingTenant) {
      setTenantForDevices(editingTenant);
      fetchStoreDevices(editingTenant.id);
    } else {
      setManualPin('');
    }
  }, [editingTenant]);

  const formatJapanesePhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  };

  const getWhatsAppLink = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    let formatted = digits;
    if (digits.startsWith('0')) {
      formatted = `81${digits.substring(1)}`;
    }
    return `https://api.whatsapp.com/send?phone=${formatted}`;
  };

  const addMonths = (dateStr: string, months: number) => {
    let date: Date;

    if (dateStr) {
      // Safely parse YYYY-MM-DD to avoid timezone shifts
      const parts = dateStr.split(/[T ]/)[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // 0-indexed
        const day = parseInt(parts[2]);
        date = new Date(year, month, day);
      } else {
        date = new Date();
      }
    } else {
      date = new Date();
    }

    if (isNaN(date.getTime())) {
      date = new Date();
    }

    date.setMonth(date.getMonth() + months);

    const y = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  const formatDateDisplay = (dateStr: string | null | undefined) => {
    if (!dateStr) return '--';
    const parts = dateStr.split(/[T ]/)[0].split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase());

    if (filterType === 'near_limit') {
      const limit = t.total_contact_limit || PLAN_LIMITS[t.plan] || 2000;
      return matchesSearch && (t.customers_count || 0) / limit > 0.8;
    }

    if (filterType === 'expired') {
      return matchesSearch && t.plan_expires_at && new Date(t.plan_expires_at) < new Date();
    }

    return matchesSearch;
  });

  const capitalizeWords = (str: string) => {
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleCreateTenant = async () => {
    if (!newTenantData.name || !newTenantData.email) return;
    setIsLoading(true);
    try {
      const res = await tenantsService.create(newTenantData);
      setCreatedCredentials({
        email: res.data.credentials.email,
        password: res.data.credentials.password,
        name: newTenantData.owner_name || newTenantData.name,
        url: res.data.credentials.system_url || window.location.origin,
        landingUrl: 'https://saibamaiscpgestao.creativeprintjp.com/'
      });
      fetchTenants();
      setNewTenantData({
        name: '',
        email: '',
        owner_name: '',
        phone: '',
        plan: PlanType.PRO,
        extra_contacts_quota: 0,
        totems_count: 2,
        plan_expires_at: ''
      });
    } catch (error: any) {
      console.error('Tenant creation error:', error);
      setStatusModal({
        isOpen: true,
        title: 'Erro',
        message: error.response?.data?.message || 'Não foi possível criar a loja. Verifique os dados e tente novamente.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyWhatsAppMessage = async () => {
    if (!createdCredentials) return;
    const msg = `Olá *${createdCredentials.name}*! 👋\n\nSeu acesso ao sistema CPgestão Fidelidade foi configurado com sucesso.\n\n🌐 *Site Oficial:*\n${createdCredentials.landingUrl}\n(Basta clicar em 'Login' para acessar seu painel)\n\n🔗 *Link Direto do Sistema:*\n${createdCredentials.url}\n\n📧 *E-mail:*\n${createdCredentials.email}\n\n🔑 *Senha Provisória:*\n${createdCredentials.password}\n\nNo primeiro acesso, o sistema irá redirecionar automaticamente para a alteração de senha, que é obrigatória para sua segurança.`;
    const success = await copyToClipboard(msg);
    if (success) {
      setStatusModal({
        isOpen: true,
        title: 'Copiado!',
        message: 'A mensagem de boas-vindas foi copiada para sua área de transferência.',
        type: 'success'
      });
    } else {
      setStatusModal({
        isOpen: true,
        title: 'Erro ao Copiar',
        message: 'Não foi possível copiar a mensagem. Por favor, copie manualmente.',
        type: 'error'
      });
    }
  };


  const handleResetPin = async (tenantId: string) => {
    try {
      const res = await tenantsService.resetPin(tenantId, manualPin ? { pin: manualPin } : undefined);
      setTempPin(res.data.temp_pin);
      setManualPin('');
    } catch (error) {
      setStatusModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao resetar PIN.',
        type: 'error'
      });
    }
  };

  const fetchStoreDevices = async (tenantId: string) => {
    try {
      const res = await tenantsService.getDevices(tenantId);
      setStoreDevices(res.data);
    } catch (error) {
      console.error('Error fetching devices', error);
    }
  };

  const handleCreateDevice = async () => {
    if (!tenantForDevices || !newDeviceData.name) return;
    setIsLoading(true);
    try {
      await tenantsService.createDevice(tenantForDevices.id, newDeviceData);
      fetchStoreDevices(tenantForDevices.id);
      setNewDeviceData({
        name: '',
        mode: tenantForDevices.plan === PlanType.UNLIMITED ? 'auto_checkin' : 'approval'
      });
    } catch (error) {
      setStatusModal({
        isOpen: true,
        title: 'Erro',
        message: 'Não foi possível registrar o terminal. Verifique o limite do plano.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId: string) => {
    if (!tenantForDevices) return;
    if (!window.confirm('Deseja realmente excluir este totem? O QR deixará de funcionar.')) return;
    try {
      await tenantsService.deleteDevice(tenantForDevices.id, deviceId);
      fetchStoreDevices(tenantForDevices.id);
    } catch (error) {
      console.error('Error deleting totem', error);
    }
  };

  const handleUpdateDeviceLocal = (deviceId: string, field: string, value: string) => {
    setStoreDevices(prev => prev.map(d => d.id === deviceId ? { ...d, [field]: value } : d));
  };

  const handleSaveDevice = async (deviceId: string) => {
    if (!tenantForDevices) return;
    const device = storeDevices.find(d => d.id === deviceId);
    if (!device) return;

    try {
      await tenantsService.updateDevice(tenantForDevices.id, deviceId, {
        name: device.name,
        nfc_uid: device.nfc_uid,
      });
    } catch (error) {
      console.error('Error updating totem', error);
      setStatusModal({
        isOpen: true,
        title: 'Erro',
        message: 'Não foi possível atualizar o totem.',
        type: 'error'
      });
    }
  };

  const handleOpenEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setTempPin(null);
    if (tenant) {
      setTenantForDevices(tenant);
      fetchStoreDevices(tenant.id);
    }
    setTenantForDevices(tenant);
    fetchStoreDevices(tenant.id);
  };

  const handleCloseEditModal = () => {
    setEditingTenant(null);
    setTempPin(null);
    setTenantForDevices(null);
    setStoreDevices([]);
  };

  const handleUpdateTenant = async () => {
    if (!editingTenant) return;
    setIsLoading(true);
    try {
      // Send only the fields that the backend expects and can update
      const updateData = {
        name: editingTenant.name,
        email: editingTenant.email,
        owner_name: editingTenant.owner_name,
        phone: editingTenant.phone,
        plan: editingTenant.plan,
        plan_expires_at: editingTenant.plan_expires_at,
        status: editingTenant.status,
        extra_contacts_quota: editingTenant.extra_contacts_quota,
      };

      await tenantsService.update(editingTenant.id, updateData);
      handleCloseEditModal();
      fetchTenants();
      setStatusModal({
        isOpen: true,
        title: 'Sucesso',
        message: 'Loja atualizada com sucesso!',
        type: 'success'
      });
    } catch (error) {
      setStatusModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao atualizar loja.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleDeleteTenant = (tenant: Tenant) => {
    setDeleteConfirmModal({
      isOpen: true,
      tenant
    });
  };

  const handleConfirmActionDelete = async () => {
    const tenant = deleteConfirmModal.tenant;
    if (!tenant) return;

    setIsLoading(true);
    try {
      await tenantsService.delete(tenant.id);
      fetchTenants();
      setStatusModal({
        isOpen: true,
        title: 'Excluído',
        message: 'Loja e todos os dados associados foram removidos com sucesso.',
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting tenant:', error);
      setStatusModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao excluir loja do sistema. Verifique a conexão.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
      setDeleteConfirmModal({ isOpen: false, tenant: null });
    }
  };

  const handleToggleBlock = async (tenant: Tenant) => {
    const isBlocked = tenant.status === 'blocked';
    const newStatus = isBlocked ? 'active' : 'blocked';

    setIsLoading(true);
    try {
      await tenantsService.update(tenant.id, { status: newStatus as any });
      fetchTenants();
      setStatusModal({
        isOpen: true,
        title: isBlocked ? 'Loja Desbloqueada' : 'Loja Bloqueada',
        message: `O acesso da loja ${tenant.name} foi ${isBlocked ? 'restaurado' : 'suspenso'} com sucesso.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error toggling block:', error);
      setStatusModal({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao alterar status da loja.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <>
      <div className="space-y-10 animate-fade-in relative pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Visão Geral Admin</h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium">Gestão de lojas e métricas globais da plataforma.</p>
          </div>
          <Button size="lg" className="shadow-xl bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-white rounded-2xl font-black uppercase tracking-widest text-xs h-14" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-5 h-5 mr-2" /> Criar Novo CRM
          </Button>
        </div>

        {/* Global Metrics Sections */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-900 bg-opacity-10 dark:bg-opacity-20 shadow-sm ring-1 ring-inset ring-slate-900/20">
              <Activity className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white capitalize">Saúde da Rede</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-8 border-none shadow-sm bg-white dark:bg-gray-900 overflow-visible relative group rounded-2xl">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-[#38B6FF] rounded-l-2xl`} />
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform shadow-md shadow-blue-500/10">
                  <Users className="w-8 h-8" />
                </div>
                <Badge color="blue" className="px-3 py-1">Contratos Ativos</Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{globalMetrics?.total_tenants ?? '...'}</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Total de Empresas</p>
              </div>
            </Card>

            <Card className="p-8 border-none shadow-sm bg-white dark:bg-gray-900 overflow-visible relative group rounded-2xl">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500 rounded-l-2xl`} />
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl group-hover:scale-110 transition-transform shadow-md shadow-rose-500/10">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <Badge color="red" className="px-3 py-1">Ação Requerida</Badge>
              </div>
              <div className="space-y-1">
                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{globalMetrics?.expiring_soon ?? '...'}</h3>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Vencimentos Próximos (10 dias)</p>
              </div>
            </Card>

            {[
              {
                label: 'Próximas do Limite',
                value: tenants.filter(t => {
                  const limit = t.total_contact_limit || PLAN_LIMITS[t.plan] || 2000;
                  return (t.customers_count || 0) / limit > 0.8;
                }).length.toString(),
                icon: Crown,
                sub: 'Uso de Banco > 80%',
                type: 'near_limit' as const,
                accentColor: 'bg-orange-500',
                bgColor: 'bg-orange-50',
                textColor: 'text-orange-600'
              },
              {
                label: 'Planos Expirados',
                value: tenants.filter(t => t.plan_expires_at && new Date(t.plan_expires_at) < new Date()).length.toString(),
                icon: Shield,
                sub: 'Requer Renovação',
                type: 'expired' as const,
                accentColor: 'bg-rose-500',
                bgColor: 'bg-rose-50',
                textColor: 'text-rose-600'
              },
            ].map((stat, i) => (
              <Card
                key={i}
                className={`p-8 border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 group relative rounded-2xl cursor-pointer ${
                  filterType === stat.type ? `ring-2 ring-offset-2 ${stat.type === 'near_limit' ? 'ring-orange-500 shadow-xl' : 'ring-rose-500 shadow-xl'}` : 'hover:shadow-md'
                }`}
                onClick={() => setFilterType(filterType === stat.type ? 'all' : stat.type)}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${stat.accentColor} rounded-l-2xl`} />
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-xl ${stat.bgColor} border border-slate-50 relative group-hover:scale-110 transition-transform`}>
                    <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                  <Badge color={stat.type === 'near_limit' ? 'orange' : 'red'} className="px-3 py-1 font-black">{stat.sub}</Badge>
                </div>
                <div className="space-y-1">
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                </div>
                {filterType === stat.type && (
                  <div className="absolute bottom-4 right-4 animate-bounce">
                    <div className={`text-[9px] font-black uppercase px-2 py-1 rounded-full text-white ${stat.accentColor}`}>Filtro Ativo</div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6 pt-4">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-slate-900 bg-opacity-10 dark:bg-opacity-20 shadow-sm ring-1 ring-inset ring-slate-900/20">
                <Shield className="w-5 h-5 text-slate-600" />
             </div>
             <div>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white capitalize">Gerenciamento de empresas</h2>
             </div>
          </div>

          <Card className="overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm rounded-2xl">
            <div className="p-8 border-b border-slate-50 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900">
              <div className="flex flex-col gap-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">CRM e Fidelidade</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Cadastro e monitoramento</p>
                {filterType !== 'all' && (
                  <Badge color="orange" className="cursor-pointer hover:bg-orange-200 py-1.5 mt-2 self-start" onClick={() => setFilterType('all')}>
                    {filterType === 'near_limit' ? 'Filtro: Próximas do Limite' : 'Filtro: Expirados'} <X className="w-3 h-3 ml-1" />
                  </Badge>
                )}
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary-500" />
                <Input placeholder="Buscar lojas por nome ou e-mail..." className="pl-12 h-14 bg-slate-50/50 border-slate-100 rounded-2xl text-sm font-bold" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50/50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-8 py-5">Empresas</th>
                    <th className="px-8 py-5">Gestor / Contato</th>
                    <th className="px-8 py-5 text-center">Uso do Plano</th>
                    <th className="px-8 py-5">Vencimento</th>
                    <th className="px-8 py-5 text-right">Ações de Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-gray-800">
                  {filteredTenants.map((tenant) => {
                    const limit = tenant.total_contact_limit || PLAN_LIMITS[tenant.plan] || 2000;
                    const usage = (tenant.customers_count || 0) / limit;
                    
                    // Cálculo de vencimento
                    const now = new Date();
                    const expiryDate = tenant.plan_expires_at ? new Date(tenant.plan_expires_at) : null;
                    const isExpired = expiryDate && expiryDate < now;
                    const diffDays = expiryDate ? Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
                    const isNearExpiration = diffDays !== null && diffDays >= 0 && diffDays <= 10;

                    return (
                      <tr key={tenant.id} className={`odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-800/20 hover:bg-[#38B6FF]/5 transition-colors group relative border-l-4 ${isExpired ? 'border-l-rose-500 bg-rose-50/10' : isNearExpiration ? 'border-l-amber-500 bg-amber-50/5' : usage > 0.9 ? 'border-l-orange-500' : 'border-l-transparent'}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-3 h-3 rounded-full shadow-sm ring-4 ring-offset-2 ring-offset-white ring-transparent ${isExpired ? 'bg-rose-500 animate-pulse ring-red-100' : isNearExpiration ? 'bg-amber-500 ring-amber-100' : usage > 0.9 ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                            <div className="flex flex-col">
                              <div className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">{tenant.name}</div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[150px]">{tenant.slug}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-8 py-6">
                          <div className="flex flex-col space-y-1">
                            <span className="text-slate-900 dark:text-slate-200 font-bold text-xs">{tenant.email}</span>
                            {tenant.phone && (
                              <a
                                href={getWhatsAppLink(tenant.phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-1 transition-all"
                              >
                                WhatsApp <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </td>

                        <td className="px-8 py-6">
                          <div className="flex flex-col items-center min-w-[140px] space-y-2">
                            <div className="flex justify-between w-full text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">
                                {tenant.plan === PlanType.UNLIMITED ? 'ELITE' : 'PRO'}
                                {tenant.extra_contacts_quota ? <Badge color="orange" className="ml-2 text-[8px] px-1 py-0 shadow-sm">+{(tenant.extra_contacts_quota / 1000).toFixed(0)}K</Badge> : null}
                              </span>
                              <span className={tenant.extra_contacts_quota ? 'text-[#38B6FF] font-black' : usage > 0.95 ? 'text-rose-600 font-extrabold' : usage > 0.8 ? 'text-amber-500' : 'text-slate-900'}>
                                {usage > 1 ? 'ESGOTADO' : usage > 0.95 ? 'CRÍTICO' : `${Math.round(usage * 100)}%`}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden border border-slate-200/50 shadow-inner">
                              <div
                                className={`h-full transition-all duration-700 ${usage > 0.95 ? 'bg-rose-600' : usage > 0.8 ? 'bg-amber-500' : 'bg-[#38B6FF]'}`}
                                style={{ width: `${Math.min(100, usage * 100)}%` }}
                              />
                            </div>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">{(tenant.customers_count || 0).toLocaleString()} / {(tenant.total_contact_limit || limit).toLocaleString()}</p>
                          </div>
                        </td>

                        <td className="px-8 py-6 whitespace-nowrap">
                          {tenant.plan_expires_at ? (
                            <div className="flex flex-col">
                               <div className="flex items-center gap-2">
                                  <Calendar className={`w-3.5 h-3.5 ${isExpired ? 'text-rose-500' : isNearExpiration ? 'text-amber-500' : 'text-slate-400'}`} />
                                  <span className={`text-[11px] font-black uppercase tracking-tight ${isExpired ? 'text-rose-600' : isNearExpiration ? 'text-amber-600' : 'text-slate-600'}`}>
                                    {formatDateDisplay(tenant.plan_expires_at)}
                                  </span>
                               </div>
                               {isExpired ? (
                                 <span className="bg-rose-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest mt-1 text-center">Expirado</span>
                               ) : isNearExpiration ? (
                                 <span className="bg-amber-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest mt-1 text-center animate-pulse">Renovar Agora</span>
                               ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 font-bold uppercase tracking-widest">Vitalício</span>
                          )}
                        </td>

                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700 gap-1">
                               <button 
                                 onClick={() => {
                                   const link = `${window.location.protocol}//${window.location.host}/p/${tenant.slug}`;
                                   copyToClipboard(link);
                                   setStatusModal({ isOpen: true, title: 'Copiado', message: 'Link Público copiado.', type: 'success' });
                                 }}
                                 className="p-2 text-slate-400 hover:text-[#38B6FF] hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                                 title="Copiar Link Público"
                               >
                                 <Smartphone className="w-4 h-4" />
                               </button>
                               <button 
                                 onClick={() => {
                                   const link = `${window.location.protocol}//${window.location.host}/terminal/${tenant.slug}`;
                                   copyToClipboard(link);
                                   setStatusModal({ isOpen: true, title: 'Copiado', message: 'Link do Totem copiado.', type: 'success' });
                                 }}
                                 className="p-2 text-slate-400 hover:text-[#38B6FF] hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all"
                                 title="Copiar Link do Totem"
                               >
                                 <Globe className="w-4 h-4" />
                               </button>
                               <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
                               <button 
                                 onClick={() => handleOpenEditModal(tenant)} 
                                 className="px-4 py-2 bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-sm"
                               >
                                 EDITAR
                               </button>
                               <button
                                 onClick={() => handleToggleBlock(tenant)}
                                 className={`p-2 rounded-lg transition-all ${tenant.status === 'blocked' ? 'text-rose-500 bg-rose-50' : 'text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700'}`}
                                 title={tenant.status === 'blocked' ? 'Desbloquear' : 'Suspender'}
                               >
                                 <Lock className="w-4 h-4" />
                               </button>
                            </div>
                            <button
                               onClick={() => handleDeleteTenant(tenant)}
                               className="p-2.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all ml-1"
                               title="Excluir Definitivamente"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        {/* Modal Edit - Dados da Empresa */}
        {editingTenant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <Card className="w-full max-w-4xl p-0 shadow-2xl overflow-hidden max-h-[95vh] flex flex-col rounded-2xl border-none">
              <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 flex-none px-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
                    <Building2 className="w-6 h-6 text-[#38B6FF]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-2xl text-slate-900 dark:text-white tracking-tight">Dados da Empresa</h3>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Painel de controle e faturamento</p>
                  </div>
                </div>
                <button onClick={handleCloseEditModal} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="p-10 space-y-10 overflow-y-auto flex-1 bg-slate-50/50 dark:bg-slate-950/20 custom-scrollbar">
                
                {/* CARD 1: PLANO E ASSINATURA */}
                {/* CARD 1: INFORMAÇÕES GERAIS (NOVO POSICIONAMENTO) */}
                <Card className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#38B6FF]" /> Informações Gerais
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Input label="Nome da Empresa" value={editingTenant.name} onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })} />
                    <Input label="E-mail Administrativo" value={editingTenant.email} onChange={(e) => setEditingTenant({ ...editingTenant, email: e.target.value })} />
                    <Input label="Responsável" value={editingTenant.owner_name || ''} onChange={(e) => setEditingTenant({ ...editingTenant, owner_name: e.target.value })} />
                    <Input label="Telefone de Suporte" placeholder="090-0000-0000" value={editingTenant.phone || ''} onChange={(e) => setEditingTenant({ ...editingTenant, phone: formatJapanesePhone(e.target.value) })} />
                  </div>
                </Card>

                {/* CARD 2: PLANO E ASSINATURA */}
                <div className="space-y-8">
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform">
                      <Crown className="w-32 h-32 text-blue-500" />
                    </div>
                    <h4 className="text-xs font-black text-[#38B6FF] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <Crown className="w-4 h-4" /> Plano e Assinatura
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Tipo de Plano</label>
                          <select
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#38B6FF] transition-all outline-none shadow-inner"
                            value={editingTenant.plan}
                            onChange={(e) => setEditingTenant({ ...editingTenant, plan: e.target.value as PlanType })}
                          >
                            <option value={PlanType.PRO}>🔵 Plano Pro (4k Contatos)</option>
                            <option value={PlanType.UNLIMITED}>🟣 Plano Elite (6k Contatos)</option>
                          </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Data de Início</label>
                            <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#38B6FF]" />
                              <input
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#38B6FF] transition-all outline-none"
                                value={editingTenant.plan_started_at ? editingTenant.plan_started_at.split(/[T ]/)[0] : ''}
                                onChange={(e) => setEditingTenant({ ...editingTenant, plan_started_at: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Data de Vencimento</label>
                            <div className="relative">
                              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                              <input
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#38B6FF] transition-all outline-none"
                                value={editingTenant.plan_expires_at ? editingTenant.plan_expires_at.split(/[T ]/)[0] : ''}
                                onChange={(e) => setEditingTenant({ ...editingTenant, plan_expires_at: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                         <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Limite Total do Banco</label>
                          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                              {editingTenant.extra_contacts_quota === -1 ? '∞' : (PLAN_LIMITS[editingTenant.plan] + (editingTenant.extra_contacts_quota || 0)).toLocaleString()}
                            </span>
                            <Badge color="blue" className="px-3 py-1 uppercase text-[9px] font-black">Capacity</Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                           <button
                              onClick={() => setEditingTenant({ ...editingTenant, plan_expires_at: addMonths(editingTenant.plan_expires_at!, 6) })}
                              className="flex-1 py-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 rounded-xl text-[10px] font-black text-[#38B6FF] transition-all uppercase tracking-widest border border-blue-100 dark:border-blue-900/50"
                            >
                              +6 Meses
                            </button>
                            <button
                              onClick={() => setEditingTenant({ ...editingTenant, plan_expires_at: addMonths(editingTenant.plan_expires_at!, 12) })}
                              className="flex-1 py-3 bg-[#38B6FF] hover:bg-blue-600 rounded-xl text-[10px] font-black text-white transition-all uppercase tracking-widest shadow-md"
                            >
                              +1 Ano
                            </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* COTAS DE EXPANSÃO */}
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm grow">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4 text-orange-500" /> Cotas de Expansão (Upgrade)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {[
                        { label: 'Nenhum', value: 0 },
                        { label: 'Bronze', sub: '+1k', value: 1000 },
                        { label: 'Prata', sub: '+2k', value: 2000 },
                        { label: 'Ouro', sub: '+4k', value: 4000 },
                        { label: 'Infinity', sub: '∞', value: -1 },
                      ].map((pack) => (
                        <button
                          key={pack.label}
                          onClick={() => setEditingTenant({ ...editingTenant, extra_contacts_quota: pack.value })}
                          className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-tight transition-all flex flex-col items-center gap-1
                            ${editingTenant.extra_contacts_quota === pack.value
                              ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700 hover:bg-slate-100'
                            }`}
                        >
                          <span>{pack.label}</span>
                          {pack.sub && <span className={`text-[8px] opacity-70 ${editingTenant.extra_contacts_quota === pack.value ? 'text-white' : 'text-orange-500'}`}>{pack.sub}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CARD 3: GERENCIAR TOTENS */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border-2 border-amber-400/50 dark:border-amber-500/30 shadow-lg shadow-amber-500/5 overflow-hidden">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] flex items-center gap-2">
                        <Smartphone className="w-5 h-5 text-amber-500" /> Gerenciar Terminais (Totens)
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-7">Controle de acesso físico e vinculação de dispositivos</p>
                    </div>
                    <div className="flex w-full md:w-auto gap-2">
                      <Input
                        className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl h-12 text-sm"
                        placeholder="Nome do Novo Totem..."
                        value={newDeviceData.name}
                        onChange={(e) => setNewDeviceData({ ...newDeviceData, name: e.target.value })}
                      />
                      <Button
                        className="bg-[#38B6FF] hover:bg-blue-600 text-white h-12 px-6 rounded-xl font-black uppercase text-[10px] tracking-widest whitespace-nowrap"
                        onClick={() => {
                          const data = { ...newDeviceData, mode: 'approval' };
                          tenantsService.createDevice(tenantForDevices!.id, { ...data, responsible_name: data.name })
                            .then(() => {
                              fetchStoreDevices(tenantForDevices!.id);
                              setNewDeviceData({ name: '', mode: 'approval' });
                            })
                            .catch((err) => {
                              setStatusModal({
                                isOpen: true,
                                title: 'Erro',
                                message: err.response?.data?.message || 'Não foi possível registrar o terminal.',
                                type: 'error'
                              });
                            });
                        }}
                        disabled={isLoading || !newDeviceData.name}
                      >
                        [+ REGISTRAR]
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-3xl">
                    {storeDevices.length === 0 ? (
                      <div className="text-center py-10 text-slate-300 italic bg-slate-50/50 dark:bg-slate-800/20 font-medium">
                        Nenhum terminal ativado para esta empresa.
                      </div>
                    ) : (
                      <div className="space-y-4">
                         {storeDevices.map((device) => (
                           <div key={device.id} className="p-6 bg-slate-50/30 dark:bg-slate-800/20 flex flex-col items-stretch gap-6 group hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-all rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                             <div className="flex items-center gap-4 w-full md:w-auto">
                               <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-[#38B6FF]">
                                 <Monitor className="w-5 h-5" />
                               </div>
                               <div>
                                 <input
                                   className="font-black text-slate-900 dark:text-white uppercase tracking-tight bg-transparent border-none p-0 focus:ring-0 text-sm"
                                   value={device.name}
                                   onChange={(e) => handleUpdateDeviceLocal(device.id, 'name', e.target.value)}
                                   onBlur={() => handleSaveDevice(device.id)}
                                 />
                                 <div className="flex items-center gap-2 mt-1">
                                   <span className="text-[10px] text-slate-400 font-mono uppercase">UID:</span>
                                   <input
                                     className="text-xs text-[#38B6FF] font-mono bg-transparent border-none p-0 focus:ring-0 w-32 font-bold"
                                     value={device.nfc_uid}
                                     onChange={(e) => handleUpdateDeviceLocal(device.id, 'nfc_uid', e.target.value)}
                                     onBlur={() => handleSaveDevice(device.id)}
                                   />
                                 </div>
                               </div>
                             </div>

                             <div className="w-full relative">
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white dark:bg-slate-900 p-2 sm:pl-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-inner overflow-hidden">
                                   <code className="flex-1 text-[10px] sm:text-[11px] font-mono font-bold text-slate-500 truncate p-2 sm:p-0">
                                     {window.location.origin}/terminal/{editingTenant.slug}/{device.nfc_uid}
                                   </code>
                                   <div className="flex items-center gap-2 px-2 pb-2 sm:p-0">
                                     <button
                                       onClick={() => {
                                         const text = `${window.location.origin}/terminal/${editingTenant.slug}/${device.nfc_uid}`;
                                         copyToClipboard(text);
                                         setCopiedId(device.id);
                                         setTimeout(() => setCopiedId(null), 2000);
                                       }}
                                       className="flex-1 sm:flex-none px-4 py-2.5 bg-[#38B6FF] text-white rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md active:scale-95 whitespace-nowrap"
                                     >
                                       COPIAR LINK
                                     </button>
                                     <button
                                       onClick={() => handleDeleteDevice(device.id)}
                                       className="p-2.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   </div>
                                 </div>
                                {copiedId === device.id && <p className="absolute -top-6 right-2 sm:right-24 text-[8px] font-black text-emerald-500 uppercase animate-bounce">Copiado!</p>}                             </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 4: LINK DE DIVULGAÇÃO (PADRONIZADO) */}
                <Card className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                  <div className="absolute -bottom-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform">
                    <ExternalLink className="w-64 h-64 text-blue-500" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex-1">
                      <h4 className="text-xs font-black text-[#38B6FF] uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                        <Link className="w-4 h-4" /> Divulgação e Link Público
                      </h4>
                      <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest max-w-md">Use este link para enviar aos clientes via WhatsApp ou publicar em suas redes sociais para o registro do fidelidade.</p>
                      
                      <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-slate-50 dark:bg-slate-800 p-4 sm:p-2 sm:pl-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner overflow-hidden">
                        <code className="text-[11px] sm:text-sm font-bold text-slate-700 dark:text-slate-200 truncate flex-1 mb-2 sm:mb-0">{window.location.origin}/p/{editingTenant.slug}</code>
                        <button
                          onClick={() => {
                            const link = `${window.location.origin}/p/${editingTenant.slug}`;
                            copyToClipboard(link);
                          }}
                          className="px-6 py-4 sm:py-3 bg-[#38B6FF] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 whitespace-nowrap"
                        >
                          Copiar Link da Loja
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>

              </div>
              
              <div className="p-8 border-t dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900 flex-none px-10">
                <Button variant="ghost" className="font-bold text-slate-500 px-8" onClick={handleCloseEditModal}>Descartar</Button>
                <Button className="bg-[#38B6FF] hover:bg-blue-600 text-white px-10 rounded-2xl font-black uppercase tracking-widest text-xs h-14 shadow-lg shadow-blue-500/20" onClick={handleUpdateTenant} disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Atualizar Dados'}
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Modal Criar Novo CRM */}
        {
          isCreateModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
              <Card className="w-full max-w-2xl p-0 shadow-2xl overflow-hidden rounded-3xl">
                <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#38B6FF]/10 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-[#38B6FF]" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-slate-900 tracking-tighter uppercase">Novo CRM SaaS</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuração de Unidade e Plano</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setIsCreateModalOpen(false); setCreatedCredentials(null); }}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-8 max-h-[calc(100vh-10rem)] overflow-y-auto bg-white">

                {createdCredentials ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col items-center text-center space-y-1">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-1">
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      </div>
                      <h4 className="text-lg font-bold text-gray-900 leading-tight">Configuração Concluída!</h4>
                      <p className="text-xs text-gray-500">O acesso para {createdCredentials.name} foi gerado.</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                        <span>Mensagem de Boas-vindas</span>
                        <Badge color="green">Pronta para envio</Badge>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200 text-[11px] font-mono whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                        {`Olá *${createdCredentials.name}*! 👋\n\nSeu acesso ao sistema CPgestão Fidelidade foi configurado com sucesso.\n\n🌐 Site Oficial:\n${createdCredentials.landingUrl}\n(Basta clicar em 'Login' para acessar seu painel)\n\n🔗 Link Direto do Sistema:\n${createdCredentials.url}\n\n📧 E-mail:\n${createdCredentials.email}\n\n🔑 Senha Provisória:\n${createdCredentials.password}\n\nNo primeiro acesso, o sistema irá redirecionar automaticamente para a alteração de senha, que é obrigatória para sua segurança.`}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button
                        className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
                        onClick={copyWhatsAppMessage}
                      >
                        <Copy className="w-5 h-5" /> Copiar para WhatsApp
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full py-3"
                        onClick={() => { setIsCreateModalOpen(false); setCreatedCredentials(null); }}
                      >
                        Fechar e Continuar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Seção 1: Informações da Unidade */}
                    <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                        <Building2 className="w-4 h-4 text-[#38B6FF]" /> Informações da Unidade
                      </h4>
                      <Input 
                        label="Nome Fantasia da Loja" 
                        placeholder="Ex: Barber Shop Premium" 
                        value={newTenantData.name} 
                        onChange={(e) => setNewTenantData({ ...newTenantData, name: capitalizeWords(e.target.value) })} 
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input 
                          label="Proprietário / Gestor" 
                          placeholder="Nome completo" 
                          value={newTenantData.owner_name} 
                          onChange={(e) => setNewTenantData({ ...newTenantData, owner_name: capitalizeWords(e.target.value) })} 
                        />
                        <Input 
                          label="Telefone (WhatsApp)" 
                          placeholder="090-0000-0000" 
                          value={newTenantData.phone} 
                          onChange={(e) => setNewTenantData({ ...newTenantData, phone: formatJapanesePhone(e.target.value) })} 
                        />
                      </div>
                      <Input 
                        label="E-mail Administrativo (Login)" 
                        placeholder="dono@loja.com" 
                        value={newTenantData.email} 
                        onChange={(e) => setNewTenantData({ ...newTenantData, email: e.target.value })} 
                      />
                    </div>

                    {/* Seção 2: Plano e Vigência */}
                    <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                        <Crown className="w-4 h-4 text-amber-500" /> Plano e Assinatura
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5 ml-0.5">Selecione o Plano</label>
                          <select
                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-[#38B6FF] transition-all outline-none font-medium"
                            value={newTenantData.plan}
                            onChange={(e) => {
                              const p = e.target.value as PlanType;
                              setNewTenantData({ ...newTenantData, plan: p });
                            }}
                          >
                            <option value={PlanType.PRO}>🔵 Plano Pro (4.000 contatos)</option>
                            <option value={PlanType.UNLIMITED}>🟣 Plano Elite (6.000 contatos)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Input 
                            label="Data de Vencimento" 
                            type="date" 
                            value={newTenantData.plan_expires_at} 
                            onChange={(e) => setNewTenantData({ ...newTenantData, plan_expires_at: e.target.value })} 
                          />
                          <div className="flex items-center justify-between gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => setNewTenantData({ ...newTenantData, plan_expires_at: addMonths(newTenantData.plan_expires_at, 1) })}
                              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 transition-all flex items-center gap-2 shadow-sm"
                            >
                              <Plus className="w-3 h-3 text-[#38B6FF]" /> + 1 MÊS
                            </button>
                            <div className="text-right">
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Expira em:</p>
                               <p className="text-xs font-black text-[#38B6FF]">{formatDateDisplay(newTenantData.plan_expires_at)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Seção 3: Hardware e Cotas */}
                    <div className="bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                        <Settings className="w-4 h-4 text-slate-400" /> Expansão e Hardware
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-0.5">Pacote de Contatos</label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { label: 'Off', value: 0 },
                              { label: 'Bronze', value: 1000 },
                              { label: 'Prata', value: 2000 },
                              { label: 'Ouro', value: 4000 },
                              { label: 'Elite', value: 6000 },
                              { label: 'Infinity', value: -1 },
                            ].map((pack) => (
                              <button
                                key={pack.label}
                                type="button"
                                onClick={() => setNewTenantData({ ...newTenantData, extra_contacts_quota: pack.value })}
                                className={`py-2 rounded-lg border text-[9px] font-black uppercase transition-all
                                  ${newTenantData.extra_contacts_quota === pack.value
                                    ? 'bg-[#38B6FF] text-white border-[#38B6FF] shadow-lg shadow-[#38B6FF]/20'
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-[#38B6FF]/40 hover:text-[#38B6FF]'
                                  }`}
                              >
                                {pack.label}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Input
                            label="Quantidade de Totens"
                            type="number"
                            min={0}
                            max={20}
                            value={newTenantData.totems_count}
                            onChange={(e) => setNewTenantData({ ...newTenantData, totems_count: parseInt(e.target.value) })}
                          />
                          <div className="p-3 bg-white border border-slate-200 rounded-lg">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Capacidade Total:</p>
                            <p className="text-sm font-black text-slate-900">
                              {newTenantData.extra_contacts_quota === -1 ? 'CONTATOS ILIMITADOS' : (PLAN_LIMITS[newTenantData.plan] + (newTenantData.extra_contacts_quota || 0)).toLocaleString() + ' Contatos'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-8">
                      <Button 
                        className="w-full bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-[#38B6FF]/20" 
                        onClick={handleCreateTenant} 
                        disabled={isLoading}
                      >
                        {isLoading ? 'Configurando Unidade...' : 'Finalizar Setup e Gerar Acesso'}
                      </Button>
                      <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
                        Ao finalizar, as credenciais serão geradas e enviadas por e-mail.
                      </p>
                    </div>
                  </div>
                )}
                </div>
              </Card>
            </div>
          )
        }

        {
          statusModal.isOpen && (
            <StatusModal
              isOpen={statusModal.isOpen}
              title={statusModal.title}
              message={statusModal.message}
              type={statusModal.type}
              theme="accent"
              onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
            />
          )
        }

        {
          deleteConfirmModal.isOpen && deleteConfirmModal.tenant && (
            <StatusModal
              isOpen={deleteConfirmModal.isOpen}
              title="Atenção: Exclusão"
              message={`Você tem certeza que deseja excluir a loja "${deleteConfirmModal.tenant.name}"? Esta ação é PERMANENTE e apagará todos os dados, clientes e dispositivos vinculados.`}
              type="error"
              theme="accent"
              confirmLabel="EXCLUIR DEFINITIVAMENTE"
              cancelLabel="CANCELAR"
              onConfirm={handleConfirmActionDelete}
              onClose={() => setDeleteConfirmModal({ isOpen: false, tenant: null })}
            />
          )
        }

      </div>
    </>
  );
};
