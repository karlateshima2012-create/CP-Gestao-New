import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Badge, StatusModal } from '../../components/ui';
import {
    Smartphone, Monitor, Copy,
    MessageCircle, HelpCircle, Volume2,
    Download, QrCode
} from 'lucide-react';
import { Device, Contact, PlanType } from '../../types';
import api from '../../services/api';

interface DevicesTabProps {
    tenantPlan?: PlanType;
    tenantSlug?: string | null;
}

export const DevicesTab: React.FC<DevicesTabProps> = ({ tenantSlug }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [devices, setDevices] = useState<any[]>([]);
    const [modal, setModal] = useState<{
        isOpen: boolean; title: string; message: string;
        type: 'success' | 'error' | 'info' | 'warning';
        onConfirm?: () => void;
    }>({ isOpen: false, title: '', message: '', type: 'info' });

    useEffect(() => {
        fetchDevices();
    }, []);

    const fetchDevices = async () => {
        try {
            const res = await api.get('/client/devices?type=default');
            setDevices(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching devices', error);
        }
    };

    const handleUpdateLocal = (id: string, field: string, value: any) => {
        setDevices(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const handleSaveDevice = async (id: string, overrides: any = {}) => {
        const d = devices.find(x => x.id === id);
        if (!d) return;

        const payload = {
            name: overrides.name !== undefined ? overrides.name : (d.name || ''),
            telegram_chat_id: overrides.telegram_chat_id !== undefined ? overrides.telegram_chat_id : (d.telegram_chat_id || ''),
            responsible_name: overrides.responsible_name !== undefined ? overrides.responsible_name : (d.responsible_name || ''),
            telegram_sound_points: overrides.telegram_sound_points !== undefined ? overrides.telegram_sound_points : (d.telegram_sound_points !== false),
            active: overrides.active !== undefined ? overrides.active : d.active
        };

        try {
            await api.put(`/client/devices/${id}`, payload);
        } catch (error) {
            console.error('Error saving device', error);
        }
    };

    const handlePrint = (device: any) => {
        const qrUrl = `${window.location.origin}/terminal/${tenantSlug}?device=${device.nfc_uid}`;
        const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=450x450&data=${encodeURIComponent(qrUrl)}`;
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                    <head>
                        <title>Imprimir QR Code - ${device.name}</title>
                        <style>
                            body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; text-align: center; }
                            .container { padding: 40px; border: 2px solid #38B6FF; border-radius: 40px; background: white; }
                            h1 { color: #0f172a; margin-bottom: 30px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.05em; font-size: 24px; }
                            img { width: 350px; height: 350px; }
                            p { margin-top: 20px; font-weight: bold; color: #64748b; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>${device.name}</h1>
                            <img src="${qrImg}" />
                            <p>ESCANEIE PARA GANHAR PONTOS</p>
                        </div>
                        <script>
                            window.onload = () => {
                                window.print();
                                setTimeout(() => window.close(), 500);
                            };
                        </script>
                    </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    const handleDownload = async (device: any) => {
        const qrUrl = `${window.location.origin}/terminal/${tenantSlug}?device=${device.nfc_uid}`;
        const qrImg = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(qrUrl)}`;
        
        try {
            const response = await fetch(qrImg);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `QR_CODE_${device.name.replace(/\s+/g, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erro ao baixar QR code:', error);
        }
    };

    return (
        <div className="animate-fade-in pb-12 w-full max-w-5xl mx-auto">
            <div className="space-y-6">
                {devices.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 italic bg-gray-50/50 dark:bg-gray-800/20 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
                        Nenhum Totem registrado para esta loja.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {devices.map((device) => {
                            const qrUrl = `${window.location.origin}/terminal/${tenantSlug}?device=${device.nfc_uid}`;
                            const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}`;

                            return (
                                <div key={device.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-xl shadow-sm space-y-8 hover:shadow-md transition-all relative overflow-hidden group">
                                    
                                    <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
                                        
                                        {/* Coluna da Esquerda: Configurações */}
                                        <div className="flex-1 flex flex-col justify-between space-y-4 w-full">
                                            <div className="space-y-4">
                                                {/* Header com Nome e Status */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">{device.name}</h3>
                                                        <Badge color={device.active ? 'green' : 'red'} className="text-[10px] py-1 px-2 font-black rounded-md">{device.active ? 'ATIVO' : 'PAUSADO'}</Badge>
                                                    </div>
                                                </div>

                                                {/* Card Unificado de Configuração Totem */}
                                                <div className="p-4 sm:p-5 bg-slate-50/30 dark:bg-slate-800/20 rounded-lg border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
                                                    {/* Row 1: Notificação */}
                                                    <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-700/30">
                                                        <div className="space-y-0.5 max-w-[70%]">
                                                            <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                                                                NOTIFICAÇÃO NO CELULAR VIA TELEGRAM
                                                            </h4>
                                                            <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase leading-relaxed opacity-80 mt-1">
                                                                AVISAR NO TELEGRAM NOVOS CADASTROS E SOLICITAÇÕES. O CELULAR QUE PEGAR O CHAT ID É O QUE RECEBERÁ AS NOTIFICAÇÕES.
                                                            </p>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                className="sr-only peer" 
                                                                checked={device.telegram_sound_points !== false} 
                                                                onChange={e => {
                                                                    const val = e.target.checked;
                                                                    handleUpdateLocal(device.id, 'telegram_sound_points', val);
                                                                    handleSaveDevice(device.id, { telegram_sound_points: val });
                                                                }} 
                                                            />
                                                            <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-primary-500"></div>
                                                        </label>
                                                    </div>

                                                    {/* Row 2: REORGANIZADO EM UMA LINHA SÓ (Responsável + Chat ID + Botão Compacto) */}
                                                    <div className="flex flex-col sm:flex-row items-center gap-3">
                                                        {/* Campo Responsável (Agora maior) */}
                                                        <div className="w-full sm:flex-1">
                                                            <Input 
                                                                placeholder="RESPONSÁVEL"
                                                                value={device.responsible_name || ''}
                                                                onChange={e => handleUpdateLocal(device.id, 'responsible_name', e.target.value)}
                                                                onBlur={e => handleSaveDevice(device.id, { responsible_name: e.target.value })}
                                                                className="h-8 w-full bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-lg px-3 text-[10px] font-black text-slate-700 dark:text-slate-200 shadow-sm placeholder:text-slate-300 focus:ring-1 focus:ring-primary-500/20"
                                                            />
                                                        </div>
                                                        
                                                        {/* Campo Chat ID (Agora menor) */}
                                                        <div className="w-full sm:w-32">
                                                            <Input 
                                                                placeholder="CHAT ID"
                                                                value={device.telegram_chat_id || ''}
                                                                onChange={e => handleUpdateLocal(device.id, 'telegram_chat_id', e.target.value)}
                                                                onBlur={e => handleSaveDevice(device.id, { telegram_chat_id: e.target.value })}
                                                                className="h-8 w-full bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-lg px-3 text-[10px] font-bold text-slate-700 dark:text-slate-200 shadow-sm placeholder:text-center placeholder:text-slate-300 focus:ring-1 focus:ring-primary-500/10"
                                                            />
                                                        </div>

                                                        {/* Botão Compacto do Passo 1 */}
                                                        <a 
                                                            href="https://t.me/cpgestao_fidelidade_bot" 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="h-8 px-3 bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-white flex items-center justify-center rounded-lg font-black text-[8px] uppercase tracking-widest transition-all shadow-sm active:scale-95 whitespace-nowrap"
                                                        >
                                                            PEGAR CHAT ID
                                                        </a>
                                                    </div>
                                                </div>

                                                {/* Card Novo: BLOQUEIO DE SEGURANÇA */}
                                                <div className="p-4 sm:p-5 bg-white dark:bg-slate-800/10 rounded-lg border border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm">
                                                    <div className="space-y-0.5">
                                                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                                                            BLOQUEIO DE SEGURANÇA
                                                        </h4>
                                                        <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 uppercase leading-none opacity-80">
                                                            PAUSE O QR CODE PARA EVITAR PONTUAÇÕES NÃO AUTORIZADAS.
                                                        </p>
                                                    </div>
                                                    
                                                    <button 
                                                        className={`h-8 px-4 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all border ${
                                                            device.active 
                                                            ? 'border-rose-100 text-rose-500 hover:bg-rose-50 dark:border-rose-900/30' 
                                                            : 'border-emerald-100 text-emerald-500 hover:bg-emerald-50 dark:border-emerald-900/30'
                                                        }`}
                                                        onClick={() => {
                                                            const newActive = !device.active;
                                                            handleUpdateLocal(device.id, 'active', newActive);
                                                            handleSaveDevice(device.id, { active: newActive });
                                                        }}
                                                    >
                                                        {device.active ? 'PAUSAR QR CODE' : 'RETOMAR QR CODE'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Coluna da Direita: QR Code Preview */}
                                        <div className="shrink-0 flex flex-col items-center gap-3 bg-slate-50 dark:bg-slate-800/20 p-6 rounded-xl border border-slate-100 dark:border-slate-800 self-stretch justify-center min-w-[210px]">
                                            <div className="p-4 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-800">
                                                <div className="p-2 bg-white rounded-lg">
                                                    <img 
                                                        src={qrImageUrl}
                                                        alt="QR Code Totem"
                                                        className="w-28 h-28 sm:w-32 sm:h-32"
                                                    />
                                                </div>
                                            </div>
                                            
                                            <div className="w-full space-y-2">
                                                <Button 
                                                    onClick={() => handlePrint(device)}
                                                    className="w-full h-10 bg-[#38B6FF] hover:bg-blue-600 text-white rounded-lg font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-blue-500/10 flex items-center justify-center gap-3 border-none transition-all active:scale-95"
                                                >
                                                    🖨️ IMPRIMIR QR CODE
                                                </Button>
                                                <Button 
                                                    onClick={() => handleDownload(device)}
                                                    className="w-full h-10 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 border-none transition-all active:scale-95"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    BAIXAR IMAGEM
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
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
