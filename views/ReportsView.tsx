
import React, { useState, useMemo } from 'react';
import { Quote, QuoteStatus, Client } from '../types';
import { 
  Calendar, 
  Filter, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  FileText,
  Download,
  Search,
  BarChart3
} from 'lucide-react';

interface ReportsViewProps {
  quotes: Quote[];
  clients: Client[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ quotes, clients }) => {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Primeiro dia do mês atual
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');

  const getClientName = (id: string) => clients.find(c => c.id === id)?.name || '---';

  const filteredData = useMemo(() => {
    return quotes.filter(q => {
      const qDate = q.date;
      const matchesDate = qDate >= startDate && qDate <= endDate;
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesDate && matchesStatus;
    });
  }, [quotes, startDate, endDate, statusFilter]);

  const stats = useMemo(() => {
    const approved = filteredData.filter(q => q.status === QuoteStatus.APPROVED);
    const totalRevenue = approved.reduce((sum, q) => sum + q.total, 0);
    const pending = filteredData.filter(q => q.status !== QuoteStatus.APPROVED && q.status !== QuoteStatus.DECLINED);
    
    return {
      count: filteredData.length,
      revenue: totalRevenue,
      approvedCount: approved.length,
      pendingCount: pending.length
    };
  }, [filteredData]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Relatórios Financeiros</h1>
          <p className="text-slate-500 font-medium">Análise de desempenho e conversão de orçamentos.</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Inicial</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Final</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-3.5 rounded-xl text-white shadow-lg shadow-indigo-100">
            <BarChart3 size={20} />
          </div>
          <div className="text-xs font-black text-slate-400 uppercase tracking-tighter">
            {filteredData.length} registros<br/>encontrados
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex items-center justify-between">
          <div>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Faturamento (Aprovados)</p>
            <h3 className="text-3xl font-black">{formatCurrency(stats.revenue)}</h3>
          </div>
          <div className="bg-indigo-500/20 p-4 rounded-2xl text-indigo-400">
            <TrendingUp size={32} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Taxa de Aprovação</p>
            <h3 className="text-3xl font-black text-slate-800">
              {stats.count > 0 ? Math.round((stats.approvedCount / stats.count) * 100) : 0}%
            </h3>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
            <CheckCircle size={32} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Pendentes / Rascunhos</p>
            <h3 className="text-3xl font-black text-slate-800">{stats.pendingCount}</h3>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl text-amber-600">
            <FileText size={32} />
          </div>
        </div>
      </div>

      {/* Tabela de Resultados */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-black text-xl text-slate-900 tracking-tight">Detalhamento do Período</h3>
          <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center hover:underline">
            <Download size={14} className="mr-2" /> Exportar Planilha
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Nº Orç.</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map(quote => (
                <tr key={quote.id} className="hover:bg-slate-50/50 transition">
                  <td className="px-8 py-5 text-sm font-medium text-slate-600">
                    {new Date(quote.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-800">
                    {getClientName(quote.clientId)}
                  </td>
                  <td className="px-8 py-5 text-sm font-mono text-slate-400">
                    #{quote.number}
                  </td>
                  <td className="px-8 py-5">
                    <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                      quote.status === QuoteStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      quote.status === QuoteStatus.DECLINED ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right font-black text-slate-900">
                    {formatCurrency(quote.total)}
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-400 font-medium italic">
                    Nenhum orçamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredData.length > 0 && (
              <tfoot className="bg-slate-900 text-white">
                <tr>
                  <td colSpan={4} className="px-8 py-6 font-black uppercase text-xs tracking-[2px]">Total do Período Selecionado</td>
                  <td className="px-8 py-6 text-right font-black text-xl">
                    {formatCurrency(filteredData.reduce((s, q) => s + q.total, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
