
import React, { useState, useEffect, useMemo } from 'react';
import { Quote, QuoteStatus, Transaction } from '../types';
import { 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar,
  X,
  Trash2,
  Loader2,
  AlertCircle,
  Receipt,
  Filter
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CashFlowViewProps {
  quotes: Quote[];
  userId: string;
}

const CashFlowView: React.FC<CashFlowViewProps> = ({ quotes, userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Estados de Filtro de Data
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Primeiro dia do mês atual
    return d.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [formData, setFormData] = useState<Partial<Transaction>>({
    description: '',
    amount: 0,
    type: 'expense',
    category: 'Geral',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao carregar financeiro.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [userId]);

  // Mesclar Orçamentos Aprovados como "Entradas" e aplicar filtros de data
  const allFinancialItems = useMemo(() => {
    const approvedQuotesAsIncomes = quotes
      .filter(q => q.status === QuoteStatus.APPROVED)
      .map(q => ({
        id: `quote-${q.id}`,
        description: `Orçamento #${q.number}`,
        amount: q.total,
        type: 'income' as const,
        category: 'Orçamento',
        date: q.date,
        created_at: q.date
      }));

    // Combina tudo e filtra pelo período selecionado
    return [...approvedQuotesAsIncomes, ...transactions]
      .filter(item => item.date >= startDate && item.date <= endDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [quotes, transactions, startDate, endDate]);

  const stats = useMemo(() => {
    const totalIncome = allFinancialItems
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = allFinancialItems
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense
    };
  }, [allFinancialItems]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || saving) return;
    
    setSaving(true);
    setErrorMsg('');
    try {
      const { error } = await supabase.from('transactions').insert([{
        user_id: userId,
        description: formData.description,
        amount: formData.amount,
        type: formData.type,
        category: formData.category,
        date: formData.date
      }]);

      if (error) throw error;
      
      await fetchTransactions();
      setIsModalOpen(false);
      setFormData({
        description: '',
        amount: 0,
        type: 'expense',
        category: 'Geral',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('quote-')) return; // Não deleta orçamentos por aqui
    if (window.confirm('Excluir este lançamento?')) {
      try {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) throw error;
        setTransactions(transactions.filter(t => t.id !== id));
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Fluxo de Caixa 💰</h1>
          <p className="text-slate-500 font-medium mt-3">Gestão de entradas e saídas do estúdio.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-black shadow-xl transition-all active:scale-95 flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Lançar Nova Saída</span>
        </button>
      </div>

      {/* Filtro de Período */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">De (Início)</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Até (Fim)</label>
          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="date" 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center space-x-3 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/50">
          <Filter className="text-indigo-600" size={20} />
          <div className="text-xs font-black text-indigo-900 uppercase tracking-tighter">
            {allFinancialItems.length} registros<br/>no período
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Entradas no Período</p>
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><ArrowUpCircle size={20} /></div>
          </div>
          <h3 className="text-3xl font-black text-emerald-600 tracking-tighter">{formatCurrency(stats.income)}</h3>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Saídas no Período</p>
            <div className="bg-red-50 p-2 rounded-xl text-red-600"><ArrowDownCircle size={20} /></div>
          </div>
          <h3 className="text-3xl font-black text-red-600 tracking-tighter">{formatCurrency(stats.expense)}</h3>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Lucro do Período</p>
            <div className="bg-white/10 p-2 rounded-xl text-white"><TrendingUp size={20} /></div>
          </div>
          <h3 className="text-3xl font-black tracking-tighter">{formatCurrency(stats.balance)}</h3>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-black text-xl text-slate-900 tracking-tight">Histórico Financeiro</h3>
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Filtrado por Data</div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-8 py-5">Data</th>
                <th className="px-8 py-5">Descrição</th>
                <th className="px-8 py-5">Categoria</th>
                <th className="px-8 py-5 text-right">Valor</th>
                <th className="px-8 py-5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {allFinancialItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition group">
                  <td className="px-8 py-5 text-sm font-medium text-slate-500 whitespace-nowrap">
                    {new Date(item.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                        {item.type === 'income' ? <ArrowUpCircle size={16} /> : <ArrowDownCircle size={16} />}
                      </div>
                      <span className="font-bold text-slate-800">{item.description}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-500 tracking-widest">
                      {item.category}
                    </span>
                  </td>
                  <td className={`px-8 py-5 text-right font-black ${item.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount)}
                  </td>
                  <td className="px-8 py-5 text-right">
                    {!item.id.toString().startsWith('quote-') && (
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {allFinancialItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-300 font-medium italic">
                    Nenhum lançamento financeiro neste período.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Lançar Despesa</h3>
                <p className="text-slate-400 text-sm font-medium">Cadastre saídas como combustível, luz, etc.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:bg-slate-50 p-2 rounded-full transition"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center space-x-2 text-xs font-bold border border-red-100">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label>
                <div className="relative">
                  <Receipt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input required type="text" placeholder="Ex: Combustível Ensaio X" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition font-medium" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                  <input required type="number" step="0.01" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition font-bold" value={formData.amount} onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input required type="date" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition font-bold" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition font-bold" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                  <option value="Operacional">Operacional (Combustível, Viagem)</option>
                  <option value="Equipamento">Equipamento (Câmeras, Lentes)</option>
                  <option value="Marketing">Marketing / Tráfego</option>
                  <option value="Assinatura">Assinaturas (Adobe, Cloud)</option>
                  <option value="Geral">Geral / Outros</option>
                </select>
              </div>

              <div className="pt-6 flex flex-col space-y-3">
                <button disabled={saving} type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-5 rounded-2xl font-black text-lg shadow-xl transition flex items-center justify-center space-x-3 disabled:opacity-50">
                  {saving ? <Loader2 size={24} className="animate-spin" /> : <span>Confirmar Saída</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlowView;
