
import React, { useState } from 'react';
import { Quote, QuoteStatus, Client, PhotographerProfile, User } from '../types';
import { 
  Search, 
  Download, 
  Share2, 
  Edit3, 
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  X,
  Link as LinkIcon,
  ChevronDown
} from 'lucide-react';
import { generateQuotePDF } from '../services/pdfService';
import { supabase } from '../lib/supabase';

interface QuotesViewProps {
  quotes: Quote[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  clients: Client[];
  currentUser: User;
  onEditQuote: (id: string) => void;
  onNewQuote: () => void;
  profile?: PhotographerProfile;
}

const QuotesView: React.FC<QuotesViewProps> = ({ quotes, setQuotes, clients, currentUser, onEditQuote, onNewQuote, profile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);

  const getClientById = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const filteredQuotes = quotes.filter(q => {
    const client = getClientById(q.clientId);
    const clientName = client?.name || 'Cliente Desconhecido';
    const matchesSearch = q.number.includes(searchTerm) || clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este orçamento permanentemente?')) {
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      if (error) alert('Erro ao deletar: ' + error.message);
      else setQuotes(quotes.filter(q => q.id !== id));
    }
  };

  const handleStatusChange = async (quoteId: string, newStatus: QuoteStatus) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: newStatus })
        .eq('id', quoteId);

      if (error) throw error;

      setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, status: newStatus } : q));
    } catch (err: any) {
      console.error("Erro ao mudar status:", err);
      alert('Não foi possível atualizar o status: ' + err.message);
    }
  };

  const handleDownloadPDF = (quote: Quote) => {
    const client = getClientById(quote.clientId);
    const activeProfile = profile || {
      name: currentUser.name, taxId: '', phone: '', whatsapp: '', email: currentUser.username, address: '', defaultTerms: '', monthlyGoal: 5000
    };
    if (client) generateQuotePDF(quote, activeProfile, client);
  };

  const generatePublicLink = (quote: Quote) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?view=public&q=${quote.id}&u=${currentUser.id}`;
  };

  const handleShareWhatsApp = (quote: Quote) => {
    const client = getClientById(quote.clientId);
    if (!client?.phone) return alert('Cliente sem telefone cadastrado.');
    const publicLink = generatePublicLink(quote);
    const message = encodeURIComponent(
      `Olá ${client.name}! 📸\n\nSegue meu orçamento #${quote.number} no valor de ${formatCurrency(quote.total)}.\n\nVisualizar e aprovar:\n${publicLink}`
    );
    window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const copyToClipboard = (quote: Quote) => {
    const link = generatePublicLink(quote);
    navigator.clipboard.writeText(link);
    alert('Link do orçamento copiado!');
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const getStatusIcon = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.APPROVED: return <CheckCircle size={14} className="text-emerald-500" />;
      case QuoteStatus.DECLINED: return <AlertCircle size={14} className="text-red-500" />;
      case QuoteStatus.SENT: return <Clock size={14} className="text-indigo-500" />;
      default: return <FileText size={14} className="text-slate-400" />;
    }
  };

  const getStatusClass = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.APPROVED: return 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100';
      case QuoteStatus.DECLINED: return 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100';
      case QuoteStatus.SENT: return 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100';
      case QuoteStatus.VIEWED: return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100';
      default: return 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Número ou cliente..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-600"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Filtrar Status</option>
            {Object.values(QuoteStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button onClick={onNewQuote} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-md transition">
          Novo Orçamento
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-4">Número</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status (Clique para mudar)</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredQuotes.map(quote => (
                <tr key={quote.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-700">#{quote.number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{getClientById(quote.clientId)?.name || '---'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-500">{new Date(quote.date).toLocaleDateString('pt-BR')}</td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-indigo-600">{formatCurrency(quote.total)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative group/status">
                      <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer ${getStatusClass(quote.status)}`}>
                        {getStatusIcon(quote.status)}
                        <span className="uppercase tracking-wider">{quote.status}</span>
                        <ChevronDown size={12} className="opacity-40" />
                      </div>
                      <select 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        value={quote.status}
                        onChange={(e) => handleStatusChange(quote.id, e.target.value as QuoteStatus)}
                      >
                        {Object.values(QuoteStatus).map(status => (
                          <option key={status} value={status} className="bg-white text-slate-900 font-medium">
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-1">
                    <button onClick={() => setPreviewQuote(quote)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Ver Orçamento"><Eye size={18} /></button>
                    <button onClick={() => handleShareWhatsApp(quote)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="WhatsApp"><Share2 size={18} /></button>
                    <button onClick={() => copyToClipboard(quote)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition" title="Link"><LinkIcon size={18} /></button>
                    <button onClick={() => onEditQuote(quote.id)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Editar"><Edit3 size={18} /></button>
                    <button onClick={() => handleDelete(quote.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Excluir"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewQuote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-[2rem] sm:rounded-3xl w-full max-w-5xl my-auto shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-white p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
               <div className="flex items-center space-x-3">
                  <div className="bg-indigo-600 p-2 rounded-lg text-white"><Eye size={20} /></div>
                  <h3 className="font-bold text-slate-800">Visualização do Orçamento</h3>
               </div>
               <div className="flex items-center space-x-2">
                  <button onClick={() => handleDownloadPDF(previewQuote)} className="bg-indigo-600 text-white px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-2">
                    <Download size={16} /> <span className="hidden sm:inline">Baixar PDF</span>
                  </button>
                  <button onClick={() => setPreviewQuote(null)} className="text-slate-400 hover:bg-slate-50 p-2 rounded-lg"><X size={24} /></button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-12 bg-slate-200/50">
               <div className="bg-white mx-auto w-full max-w-[210mm] shadow-xl p-6 sm:p-12 md:p-20 min-h-[297mm] rounded-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6">
                    <div className="space-y-1">
                      <h1 className="text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight leading-none mb-4">{profile?.studioName || profile?.name || currentUser.name}</h1>
                      <div className="text-slate-500 text-[13px] leading-relaxed">
                        <p>{profile?.name || currentUser.name}</p>
                        <p>CNPJ/CPF: {profile?.taxId || '---'}</p>
                        <p>{profile?.phone}</p>
                        <p>{profile?.address}</p>
                      </div>
                    </div>
                    <div className="md:text-right w-full md:w-auto">
                      <h2 className="text-2xl font-bold text-slate-800 tracking-tight">ORÇAMENTO</h2>
                      <p className="font-black text-slate-600">#{previewQuote.number}</p>
                      <div className="text-[11px] text-slate-400 font-bold uppercase mt-6 space-y-1">
                        <p>Emissão: {new Date(previewQuote.date).toLocaleDateString('pt-BR')}</p>
                        <p>Vencimento: {new Date(previewQuote.validUntil).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-100 w-full mb-10"></div>

                  <div className="flex flex-col md:flex-row justify-between mb-12 gap-8">
                    <div className="space-y-4">
                      <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Cliente</h3>
                      <div className="space-y-0.5">
                        <p className="text-xl font-bold text-slate-800">{getClientById(previewQuote.clientId)?.name}</p>
                        <p className="text-[13px] text-slate-500">CPF/CNPJ: {getClientById(previewQuote.clientId)?.taxId || '---'}</p>
                        <p className="text-[13px] text-slate-500">{getClientById(previewQuote.clientId)?.address}</p>
                      </div>
                    </div>
                    <div className="md:text-right space-y-4">
                      <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Status</h3>
                      <span className="inline-block bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[11px] font-bold border border-indigo-100 uppercase tracking-wide">{previewQuote.status}</span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full mb-10 text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="py-4 px-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Serviço</th>
                          <th className="py-4 px-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">Qtd</th>
                          <th className="py-4 px-4 text-right text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {previewQuote.items.map(item => (
                          <tr key={item.id} className="text-sm">
                            <td className="py-5 px-4">
                              <p className="font-bold text-slate-800">{item.name}</p>
                              {item.description && <p className="text-xs text-slate-400 mt-1">{item.description}</p>}
                            </td>
                            <td className="py-5 px-4 text-center whitespace-nowrap">{item.quantity} {item.type}</td>
                            <td className="py-5 px-4 text-right font-black text-slate-900 whitespace-nowrap">{formatCurrency(item.unitPrice * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col items-end pt-6 border-t border-slate-50 mb-16">
                     <div className="flex justify-between w-full sm:w-64 text-sm text-slate-400 mb-2">
                        <span>Subtotal</span>
                        <span>{formatCurrency(previewQuote.total + (previewQuote.discount || 0))}</span>
                     </div>
                     <div className="flex justify-between items-center w-full sm:w-72 pt-4">
                        <span className="text-xl font-bold text-indigo-600">Total Final</span>
                        <span className="text-2xl font-black text-indigo-600 tracking-tight">{formatCurrency(previewQuote.total)}</span>
                     </div>
                  </div>

                  <div className="space-y-4 mb-12">
                    <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Pagamento</h3>
                    <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl text-[13px] text-slate-600">
                      <p><strong className="text-slate-800">Método:</strong> {previewQuote.paymentMethod}</p>
                      <p className="mt-1">{previewQuote.paymentConditions}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-10">
                    <div className="w-64 border-b border-slate-200 mb-2"></div>
                    <p className="text-sm font-bold text-slate-800">{profile?.name || currentUser.name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assinatura</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesView;
