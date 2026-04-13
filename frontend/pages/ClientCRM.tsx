
import React, { useState } from 'react';
import api from '../services/api';
import { Contact, PlanType } from '../types';
import { DashboardTab } from './client/DashboardTab';
import { ClientsTab } from './client/ClientsTab';
import { EditorTab } from './client/EditorTab';
import { ExportTab } from './client/ExportTab';
import { AccountTab } from './client/AccountTab';
import { LoyaltyTab } from './client/LoyaltyTab';
import { VisitRecordsTab } from './client/VisitRecordsTab';
import { StatusModal } from '../components/ui';
import { copyToClipboard } from '../utils/clipboard';
import { validatePhone } from '../utils/phoneValidation';

type ClientTab = 'dashboard' | 'clients' | 'loyalty' | 'devices' | 'visits' | 'new' | 'export' | 'account';

interface ClientCRMProps {
  tenantPlan?: PlanType;
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  selectedContact: Contact | null;
  setSelectedContact: (contact: Contact | null) => void;
  metrics: any;
  onRefresh: (params?: any) => void;
  activeTab: ClientTab;
  onChangeTab: (tab: ClientTab) => void;
  onTerminalMode: () => void;
  tenantSlug: string | null;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const ClientCRM: React.FC<ClientCRMProps> = ({ tenantPlan, contacts, setContacts, selectedContact, setSelectedContact, metrics, onRefresh, activeTab, onChangeTab, onTerminalMode, tenantSlug, darkMode, setDarkMode }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onConfirm?: () => void;
    confirmLabel?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const handleDelete = async (id: string) => {
    setModal({
      isOpen: true,
      title: 'Excluir Cliente?',
      message: 'Esta ação não pode ser desfeita. Todo o histórico de pontos deste cliente será removido.',
      type: 'warning',
      confirmLabel: 'SIM, EXCLUIR',
      onConfirm: async () => {
        try {
          await api.delete(`/client/contacts/${id}`);
          setContacts(contacts.filter(c => c.id !== id));
        } catch (error) {
          setModal({
            isOpen: true,
            title: 'Erro!',
            message: 'Não foi possível excluir o cliente.',
            type: 'error'
          });
        }
      }
    });
  };

  const handleSave = async (data: Partial<Contact>) => {
    if (!data.name) {
      setModal({
        isOpen: true,
        title: 'Campo Obrigatório',
        message: 'O nome é obrigatório para o cadastro.',
        type: 'info'
      });
      return;
    }

    const phoneValidation = validatePhone(data.phone || '');
    if (!phoneValidation.isValid) {
      setModal({
        isOpen: true,
        title: 'Telefone Inválido',
        message: phoneValidation.message || 'Verifique o número informado.',
        type: 'warning'
      });
      return;
    }

    try {
      const payload = {
        ...data,
        phone: phoneValidation.cleaned,
        is_premium: false,
        points_balance: data.pointsBalance,
        last_contacted: data.lastContacted,
        reminder_date: data.reminderDate,
        reminder_time: data.reminderTime,
        reminder_text: data.reminderText,
        postal_code: data.postalCode,
        address: data.address,
        company_name: data.company_name,
        photo: (data as any).photo
      };
      if (selectedContact) {
        const res = await api.patch(`/client/contacts/${selectedContact.id}`, payload);
        const data_res = res.data?.data || res.data;
        const mapped = {
          ...data_res,
          pointsBalance: data_res.points_balance ?? data_res.pointsBalance ?? 0,
          isPremium: false,
          loyaltyLevel: data_res.loyalty_level ?? 1,
          loyalty_level_name: data_res.loyalty_level_name,
          postalCode: data_res.postal_code,
          address: data_res.address,
          linkedCard: data_res.devices && data_res.devices.length > 0 ? (data_res.devices[0].uid_formatted || data_res.devices[0].uid) : null,
          totalSpent: data_res.total_spent ?? data_res.totalSpent ?? 0,
          averageTicket: data_res.average_ticket ?? data_res.averageTicket ?? 0,
          attendanceCount: data_res.attendance_count ?? data_res.attendanceCount ?? 0,
          visitas: data_res.attendance_count ?? data_res.attendanceCount ?? 0,
          reminderTime: data_res.reminder_time,
          company_name: data_res.company_name,
          photo_url: data_res.photo_url,
          photo_url_full: data_res.photo_url_full
        };
        setContacts(contacts.map(c => c.id === selectedContact.id ? mapped : c));
        onRefresh();
      } else {
        const res = await api.post('/client/contacts', payload);
        const data_res = res.data?.data || res.data;
        const mapped = {
          ...data_res,
          pointsBalance: data_res.points_balance ?? data_res.pointsBalance ?? 0,
          isPremium: false,
          loyaltyLevel: data_res.loyalty_level ?? 1,
          loyalty_level_name: data_res.loyalty_level_name,
          postalCode: data_res.postal_code,
          address: data_res.address,
          linkedCard: data_res.devices && data_res.devices.length > 0 ? (data_res.devices[0].uid_formatted || data_res.devices[0].uid) : null,
          totalSpent: data_res.total_spent ?? data_res.totalSpent ?? 0,
          averageTicket: data_res.average_ticket ?? data_res.averageTicket ?? 0,
          attendanceCount: data_res.attendance_count ?? data_res.attendanceCount ?? 0,
          visitas: data_res.attendance_count ?? data_res.attendanceCount ?? 0,
          reminderTime: data_res.reminder_time,
          company_name: data_res.company_name,
          photo_url: data_res.photo_url,
          photo_url_full: data_res.photo_url_full
        };
        setContacts([mapped, ...contacts]);
        onRefresh();
      }

      setModal({
        isOpen: true,
        title: 'Sucesso!',
        message: selectedContact ? 'Dados do cliente atualizados com sucesso.' : 'Novo cliente cadastrado com sucesso.',
        type: 'success',
        onConfirm: () => {
          setSelectedContact(null);
          onChangeTab('clients');
        }
      });

    } catch (error: any) {
      const msg = error.response?.status === 403
        ? (error.response?.data?.error || 'Você atingiu o limite de contatos do seu plano. Realize o upgrade para continuar cadastrando.')
        : (error.response?.data?.message ||
          (error.response?.data?.code === 'DUPLICATE_PHONE' || error.response?.data?.error === 'DUPLICATE_PHONE'
            ? 'Este número de telefone já pertence a outro cliente cadastrado.'
            : 'Não foi possível salvar os dados do cliente.'));

      setModal({
        isOpen: true,
        title: error.response?.status === 403 ? 'Limite Atingido' : 'Erro ao Salvar',
        message: msg,
        type: 'error'
      });
    }
  };

  const handleExportSuccess = (ids: string[]) => {
    setContacts(contacts.map(c => ids.includes(c.id) ? { ...c, exported: true } : c));
  };

  const onCopyLink = async () => {
    if (!tenantSlug) return;
    const url = `${window.location.origin}/p/${tenantSlug}`;
    const success = await copyToClipboard(url);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setModal({
        isOpen: true,
        title: 'Erro ao Copiar',
        message: 'Não foi possível copiar o link. Por favor, copie manualmente.',
        type: 'error'
      });
    }
  };

  return (
    <div className="w-full h-full">
      {activeTab === 'dashboard' && (
        <DashboardTab
          contacts={contacts}
          metrics={metrics}
          unexportedCount={contacts.filter(c => !c.exported).length}
          onChangeTab={onChangeTab}
          onCopyLink={onCopyLink}
          copiedLink={copiedLink}
          onTerminalMode={onTerminalMode}
          onRefresh={onRefresh}
          tenantSlug={tenantSlug}
          tenantPlan={tenantPlan}
          setSelectedContact={setSelectedContact}
        />
      )}
      {activeTab === 'loyalty' && <LoyaltyTab contacts={contacts} tenantPlan={tenantPlan} />}
      {activeTab === 'visits' && <VisitRecordsTab tenantPlan={tenantPlan} />}
      {activeTab === 'clients' && (
        <ClientsTab contacts={contacts} onEdit={(c) => { setSelectedContact(c); onChangeTab('new'); }} onDelete={handleDelete} onNew={() => { setSelectedContact(null); onChangeTab('new'); }} onRefresh={onRefresh} />
      )}
      {activeTab === 'new' && (
        <EditorTab selectedContact={selectedContact} onSave={handleSave} onCancel={() => { setSelectedContact(null); onChangeTab('clients'); }} onRefresh={onRefresh} />
      )}
      {activeTab === 'export' && <ExportTab contacts={contacts} onExportSuccess={handleExportSuccess} />}
      {activeTab === 'account' && <AccountTab darkMode={darkMode} setDarkMode={setDarkMode} />}
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
