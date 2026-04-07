import React, { useState } from 'react';
import { Card, Button, StatusModal, Badge } from '../../components/ui';
import {
  Database,
  Settings2,
  CheckSquare,
  Search,
  Calendar,
  FileSpreadsheet,
  FileCode,
  UserPlus,
  Smartphone,
  X
} from 'lucide-react';
import { Contact } from '../../types';
import { reportsService } from '../../services/api';

const EXPORT_OPTIONS = [
  { key: 'name', label: 'Nome Completo' },
  { key: 'phone', label: 'Telefone' },
  { key: 'email', label: 'E-mail' },
  { key: 'company_name', label: 'Nome da Empresa' },
  { key: 'postal_code', label: 'Código Postal' },
  { key: 'province', label: 'Província' },
  { key: 'city', label: 'Cidade' },
  { key: 'address', label: 'Endereço' },
  { key: 'source', label: 'Origem do Cadastro' },
  { key: 'notes', label: 'Notas' },
  { key: 'points_balance', label: 'Saldo de Pontos' },
  { key: 'attendance_count', label: 'Total de Visitas' },
  { key: 'average_ticket', label: 'Ticket Médio' },
  { key: 'loyalty_level_name', label: 'Nível de Fidelidade' },
];

const PREVIEW_LIMIT = 5;

interface ExportTabProps {
  contacts: Contact[];
  onExportSuccess?: (ids: string[]) => void;
}

export const ExportTab: React.FC<ExportTabProps> = ({ contacts: initialContacts }) => {
  const [exportData, setExportData] = useState<any[]>([]);
  const [loadingExport, setLoadingExport] = useState(false);

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'name', 'email', 'phone', 'city', 'points_balance', 'attendance_count'
  ]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'new'>('all');
  const [modalConfig, setModalConfig] = useState<{ isOpen: boolean, title: string, message: string, type: any }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });
  const [showMacTutorial, setShowMacTutorial] = useState(false);

  const setQuickFilterNew = () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
    setDateTo(new Date().toISOString().split('T')[0]);
    setFilterMode('new');
  };

  const clearFilters = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setFilterMode('all');
  };

  const filteredContacts = initialContacts.filter(c => {
    const matchesSearch = !search ||
      (c.name?.toLowerCase().includes(search.toLowerCase())) ||
      (c.email?.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone?.includes(search)) ||
      (c.city?.toLowerCase().includes(search.toLowerCase()));

    const createdAtStr = (c as any).created_at || (c as any).createdAt;
    const createdAt = new Date(createdAtStr);
    // Add 1 day to dateTo to include the whole day
    const matchesDateFrom = !dateFrom || createdAt >= new Date(dateFrom);
    const matchesDateTo = !dateTo || createdAt <= new Date(new Date(dateTo).setHours(23, 59, 59, 999));

    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const filteredCount = filteredContacts.length;
  const previewList = filteredContacts.slice(0, PREVIEW_LIMIT);

  const handleFetchExport = async () => {
    try {
      setLoadingExport(true);
      const params = {
        search: search.trim(),
        date_from: dateFrom,
        date_to: dateTo
      };
      const res = await reportsService.getExport(params);
      const data = res.data || [];

      if (data.length === 0) {
        setModalConfig({
          isOpen: true,
          title: 'Nenhum contato encontrado',
          message: 'Tente ajustar seus filtros. Não há dados para exportar com a seleção atual.',
          type: 'warning'
        });
        return [];
      }
      setExportData(data);
      return data;
    } catch (error) {
      console.error('Erro ao buscar dados para exportação:', error);
      setModalConfig({
        isOpen: true,
        title: 'Erro na Exportação',
        message: 'Ocorreu um erro ao processar os dados no servidor. Tente novamente.',
        type: 'error'
      });
      return [];
    } finally {
      setLoadingExport(false);
    }
  };

  const generateDownload = async (format: 'csv' | 'xls') => {
    if (selectedFields.length === 0) {
      setModalConfig({
        isOpen: true,
        title: 'Selecione os Campos',
        message: 'Por favor, selecione ao menos um campo para incluir no relatório.',
        type: 'info'
      });
      return;
    }

    const data = await handleFetchExport();
    if (!data || data.length === 0) return;

    const separator = format === 'xls' ? '\t' : ',';

    const header = EXPORT_OPTIONS
      .filter(o => selectedFields.includes(o.key))
      .map(o => o.label)
      .join(separator);

    const rows = data.map((c: any) =>
      EXPORT_OPTIONS
        .filter(o => selectedFields.includes(o.key))
        .map(o => {
          let v = c[o.key] ?? '';
          if (typeof v === 'string') {
            v = v.replace(/[\n\r\t,]/g, ' ');
          }
          return format === 'csv' ? `"${String(v).replace(/"/g, '""')}"` : String(v);
        })
        .join(separator)
    ).join('\n');

    const content = `\uFEFF${header}\n${rows}`;
    const blob = new Blob([content], { type: format === 'xls' ? 'application/vnd.ms-excel' : 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const extension = format === 'xls' ? 'xls' : 'csv';
    link.download = `relatorio_clientes_${new Date().toISOString().split('T')[0]}.${extension}`;
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 500);
    setShowSuccessModal(true);
  };

  return (
    <div className="space-y-12 animate-fade-in pb-20">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">Exportar Contatos</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium">Escolha os dados que deseja exportar</p>
      </div>

      <div className="space-y-8 max-w-4xl">
        {/* FILTROS */}
        <section>
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[28px] space-y-8">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
              <Settings2 className="w-5 h-5 text-slate-400" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">FILTROS</h2>
            </div>
            
            <div className="space-y-6">
            <div className="flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="filterMode"
                  className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 text-primary-500 focus:ring-primary-500 cursor-pointer"
                  checked={filterMode === 'all'}
                  onChange={clearFilters}
                />
                <span className={`text-sm font-bold transition-colors ${filterMode === 'all' ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  Todos os clientes
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="filterMode"
                  className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 text-primary-500 focus:ring-primary-500 cursor-pointer"
                  checked={filterMode === 'new'}
                  onChange={setQuickFilterNew}
                />
                <span className={`text-sm font-bold transition-colors ${filterMode === 'new' ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  Apenas clientes novos <span className="text-[10px] font-black text-primary-500 uppercase ml-1">(últimos 30 dias)</span>
                </span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Search className="w-3 h-3" /> Buscar cliente específico (opcional)
              </label>
              <input
                className="w-full h-12 px-5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-bold text-sm"
                placeholder="Nome, e-mail, telefone ou cidade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </Card>
      </section>


        {/* CAMPOS */}
        <section>
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[28px] space-y-8">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
              <CheckSquare className="w-5 h-5 text-slate-400" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">CAMPOS PARA O RELATÓRIO</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-2">
              {EXPORT_OPTIONS.map(opt => (
                <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 rounded text-primary-500 focus:ring-primary-500 cursor-pointer"
                      checked={selectedFields.includes(opt.key)}
                      onChange={() => {
                        if (selectedFields.includes(opt.key)) setSelectedFields(selectedFields.filter(f => f !== opt.key));
                        else setSelectedFields([...selectedFields, opt.key]);
                      }}
                    />
                  </div>
                  <span className={`text-[11px] font-bold transition-colors ${selectedFields.includes(opt.key) ? 'text-slate-900 dark:text-white' : 'text-slate-400 group-hover:text-slate-600'}`}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-4 mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedFields(EXPORT_OPTIONS.map(o => o.key))}
                className="text-[10px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 flex items-center gap-2 transition-colors"
              >
                [✓ SELECIONAR TUDO]
              </button>
              <button
                onClick={() => setSelectedFields([])}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
              >
                [LIMPAR]
              </button>
            </div>
          </Card>
        </section>


        {/* RESUMO E EXPORTAÇÃO */}
        <section>
          <Card className="p-8 border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900 rounded-[28px] space-y-8">
            <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800/50">
              <Database className="w-5 h-5 text-slate-400" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">RESUMO DA EXPORTAÇÃO</h2>
            </div>
            <div className="flex items-center gap-3 py-4 px-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">
                <span className="text-xl font-black">{filteredCount}</span> clientes serão exportados com os campos selecionados.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => generateDownload('csv')}
                isLoading={loadingExport}
                className="flex-1 h-14 bg-[#38B6FF] hover:bg-[#38B6FF]/90 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/10 flex items-center justify-center gap-3 transition-all border-none"
              >
                <FileCode className="w-5 h-5" /> EXPORTAR EM CSV
              </Button>
              <Button
                onClick={() => generateDownload('xls')}
                isLoading={loadingExport}
                className="flex-1 h-14 bg-slate-500 hover:bg-slate-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-500/10 flex items-center justify-center gap-3 transition-all border-none"
              >
                <FileSpreadsheet className="w-5 h-5" /> EXPORTAR EM EXCEL
              </Button>
            </div>
          </Card>
        </section>


        {/* DICA MAC */}
        <section className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[20px] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Smartphone className="w-8 h-8 text-primary-500" />
            <div className="text-left">
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">COMO IMPORTAR CONTATOS NO MAC?</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">SINCRONIZE OS CONTATOS COM IPHONE EM SEGUNDOS.</p>
            </div>
          </div>
          <button
            onClick={() => setShowMacTutorial(true)}
            className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black text-primary-500 uppercase tracking-widest hover:bg-primary-50 transition-all shadow-sm active:scale-95 shrink-0"
          >
            VER PASSO A PASSO
          </button>
        </section>
      </div>

      {/* Modal Tutorial Mac (unchanged logic) */}
      {showMacTutorial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <Card className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative border border-white/20">
            <button
              onClick={() => setShowMacTutorial(false)}
              className="absolute top-6 right-6 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-primary-50 dark:bg-primary-900/20 rounded-[2.5rem] flex items-center justify-center">
                <Smartphone className="w-10 h-10 text-primary-600" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">CSV → Contatos do Mac</h3>
                <p className="text-slate-500 text-sm mt-1 font-medium">Veja seus clientes salvos no Macbook e iPhone instantaneamente.</p>
              </div>

              <div className="w-full space-y-4 pt-4">
                {[
                  { step: 1, text: "Exporte seu relatório no formato CSV aqui no painel." },
                  { step: 2, text: "Abra o aplicativo 'Contatos' no seu Macbook." },
                  { step: 3, text: "Vá no menu 'Arquivo' -> 'Importar' (ou use ⌘+O)." },
                  { step: 4, text: "Selecione o arquivo CSV baixado e clique em Importar." },
                  { step: 5, text: "Mapeie os campos se o Mac solicitar (ex: Nome = First Name)." }
                ].map((item) => (
                  <div key={item.step} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-left hover:translate-x-1 transition-transform border border-slate-100 dark:border-slate-800/50">
                    <span className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center text-xs font-black text-primary-600 shadow-sm grow-0 shrink-0">
                      {item.step}
                    </span>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 leading-tight">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="pt-6 w-full">
                <Button
                  className="w-full h-14 bg-primary-600 hover:bg-primary-700 text-white font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary-500/20"
                  onClick={() => setShowMacTutorial(false)}
                >
                  Entendi, mãos à obra!
                </Button>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
                  💡 Os contatos serão sincronizados via iCloud.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <StatusModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Relatório Gerado!"
        message="Seu download foi iniciado. Verifique sua pasta de transferências."
        confirmLabel="OK"
        theme="accent"
      />

      <StatusModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmLabel="FECHAR"
        theme="neutral"
      />
    </div>
  );
};