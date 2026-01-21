
import React, { useEffect, useState } from 'react';
import { Quote, PhotographerProfile, Client, QuoteStatus, ServiceType, PaymentMethod } from '../types';
import { Download, CheckCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { generateQuotePDF } from '../services/pdfService';
import { supabase } from '../lib/supabase';

interface PublicQuoteViewProps {
  quoteId: string;
  userId: string;
}

const PublicQuoteView: React.FC<PublicQuoteViewProps> = ({ quoteId, userId }) => {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [profile, setProfile] = useState<PhotographerProfile | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Busca Perfil do Fotógrafo e mapeia tax_id -> taxId
        const { data: pData } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
        if (pData) {
          setProfile({
            name: pData.name || '',
            studioName: pData.studio_name || '',
            taxId: pData.tax_id || '', // Correção do mapeamento
            phone: pData.phone || '',
            whatsapp: pData.whatsapp || '',
            email: pData.email || '',
            address: pData.address || '',
            defaultTerms: pData.default_terms || '',
            monthlyGoal: Number(pData.monthly_goal) || 5000
          });
        }

        // 2. Busca Orçamento e itens
        const { data: quoteData, error: qError } = await supabase
          .from('quotes')
          .select('*, items:quote_items(*)')
          .eq('id', quoteId)
          .single();
        
        if (qError || !quoteData) throw new Error('Não encontrado');
        
        const formattedQuote: Quote = {
          ...quoteData,
          clientId: quoteData.client_id,
          validUntil: quoteData.valid_until,
          paymentMethod: quoteData.payment_method as PaymentMethod,
          paymentConditions: quoteData.payment_conditions,
          extraFees: Number(quoteData.extra_fees) || 0,
          discount: Number(quoteData.discount) || 0,
          total: Number(quoteData.total) || 0,
          items: (quoteData.items || []).map((i: any) => ({
            id: i.id,
            name: i.name,
            description: i.description || '',
            unitPrice: Number(i.unit_price) || 0,
            quantity: Number(i.quantity) || 1,
            type: i.type as ServiceType
          }))
        };

        setQuote(formattedQuote);

        // 3. Busca Dados do Cliente e mapeia tax_id -> taxId
        const { data: cData } = await supabase.from('clients').select('*').eq('id', quoteData.client_id).single();
        if (cData) {
          setClient({
            id: cData.id,
            name: cData.name,
            email: cData.email || '',
            phone: cData.phone || '',
            taxId: cData.tax_id || '', // Correção do mapeamento
            address: cData.address || '',
            type: cData.type as 'PF' | 'PJ',
            notes: cData.notes || ''
          });
        }

        // Marca como visualizado se estiver como enviado ou rascunho
        if (formattedQuote.status === QuoteStatus.SENT || formattedQuote.status === QuoteStatus.DRAFT) {
          await supabase.from('quotes').update({ status: QuoteStatus.VIEWED }).eq('id', quoteId);
        }

      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [quoteId, userId]);

  const handleApprove = async () => {
    if (!quote) return;
    setApproving(true);
    try {
      const { error } = await supabase.from('quotes').update({ status: QuoteStatus.APPROVED }).eq('id', quoteId);
      if (error) throw error;
      setQuote({ ...quote, status: QuoteStatus.APPROVED });
    } catch (err: any) {
      alert('Erro ao aprovar: ' + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (quote && profile && client) {
      generateQuotePDF(quote, profile, client);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading) return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="text-slate-500 font-medium animate-pulse">Carregando orçamento profissional...</p>
    </div>
  );

  if (error || !quote || !profile || !client) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white p-8 rounded-3xl shadow-lg border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Orçamento indisponível</h1>
        <p className="text-slate-500">Este link pode ter expirado, foi removido ou está temporariamente fora do ar.</p>
        <button onClick={() => window.location.reload()} className="mt-6 text-indigo-600 font-bold hover:underline">Tentar novamente</button>
      </div>
    </div>
  );

  const isApproved = quote.status === QuoteStatus.APPROVED;

  return (
    <div className="min-h-screen bg-slate-100 py-10 px-4 md:py-16 flex flex-col items-center selection:bg-indigo-100">
      <div className="w-full max-w-[210mm] space-y-6">
        
        <div className="flex justify-between items-center no-print px-4">
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 bg-white text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-bold border border-slate-200 shadow-sm transition active:scale-95"
          >
            <Download size={18} />
            <span>Baixar em PDF</span>
          </button>
          
          {isApproved && (
            <div className="flex items-center space-x-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100">
              <CheckCircle size={20} />
              <span>Aprovado em {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-xl p-8 md:p-20 overflow-hidden text-[#1e293b]">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-[#4f46e5] mb-2 leading-tight">
                {profile.studioName || profile.name}
              </h1>
              <div className="text-[14px] text-[#475569] space-y-0.5">
                <p className="font-semibold text-slate-800">{profile.name}</p>
                <p>CNPJ/CPF: {profile.taxId || '---'}</p>
                <p>{profile.address}</p>
                <p>{profile.phone}</p>
              </div>
            </div>
            <div className="text-left md:text-right w-full md:w-auto">
              <h2 className="text-2xl font-bold text-[#1e293b] leading-none mb-1">ORÇAMENTO</h2>
              <p className="font-black text-indigo-600 text-lg">#{quote.number}</p>
              <div className="text-[12px] text-[#475569] mt-4 leading-tight font-bold uppercase tracking-wider space-y-1">
                <p>Emissão: {new Date(quote.date).toLocaleDateString('pt-BR')}</p>
                <p>Vencimento: {new Date(quote.validUntil).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#e2e8f0] w-full my-10"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 justify-between gap-10 mb-12">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[2px] text-[#4f46e5] mb-4">Dados do Cliente</h3>
              <div className="space-y-1">
                <p className="text-[18px] font-bold text-[#1e293b] leading-tight">{client.name}</p>
                <p className="text-[14px] text-[#475569]">CPF/CNPJ: {client.taxId || '---'}</p>
                <p className="text-[14px] text-[#475569]">{client.email}</p>
                <p className="text-[14px] text-[#475569] max-w-sm leading-snug">{client.address}</p>
              </div>
            </div>
            <div className="md:text-right">
              <h3 className="text-[11px] font-black uppercase tracking-[2px] text-[#4f46e5] mb-4">Situação</h3>
              <span className={`inline-block px-5 py-2 rounded-full text-[13px] font-bold border uppercase tracking-widest ${
                quote.status === QuoteStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
              }`}>
                {quote.status}
              </span>
            </div>
          </div>

          <div className="mb-12 overflow-hidden border border-slate-100 rounded-2xl">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f8fafc]">
                  <th className="py-4 px-6 text-left text-[11px] font-black text-[#475569] uppercase tracking-wider">Descrição dos Serviços</th>
                  <th className="py-4 px-4 text-center text-[11px] font-black text-[#475569] uppercase tracking-wider">Qtd</th>
                  <th className="py-4 px-6 text-right text-[11px] font-black text-[#475569] uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {quote.items.map(item => (
                  <tr key={item.id} className="text-[#1e293b] hover:bg-slate-50 transition">
                    <td className="py-6 px-6 align-top">
                      <p className="font-bold text-lg">{item.name}</p>
                      {item.description && <p className="text-[13px] text-[#94a3b8] mt-1 leading-relaxed">{item.description}</p>}
                    </td>
                    <td className="py-6 px-4 text-center text-[14px] font-medium align-top whitespace-nowrap">{item.quantity} {item.type}</td>
                    <td className="py-6 px-6 text-right font-bold text-[16px] align-top text-slate-800 whitespace-nowrap">{formatCurrency(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col items-end space-y-3 mb-16">
            <div className="w-full max-w-[280px] flex justify-between text-[15px] text-[#475569]">
              <span className="font-medium">Subtotal</span>
              <span className="font-bold">{formatCurrency(quote.total + (quote.discount || 0))}</span>
            </div>
            {quote.discount > 0 && (
              <div className="w-full max-w-[280px] flex justify-between text-[15px] text-emerald-600 font-bold">
                <span>Desconto Aplicado</span>
                <span>- {formatCurrency(quote.discount)}</span>
              </div>
            )}
            <div className="h-px bg-indigo-600 w-full max-w-[280px] my-2"></div>
            <div className="w-full max-w-[280px] flex justify-between items-center pt-2">
              <span className="text-[18px] font-bold text-slate-800">Total</span>
              <span className="text-[28px] font-black text-[#4f46e5] tracking-tighter">{formatCurrency(quote.total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-slate-100">
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[2px] text-[#4f46e5] mb-4">Condições de Pagamento</h3>
              <div className="bg-[#f8fafc] border border-[#e2e8f0] p-6 rounded-2xl text-[14px] text-[#475569] leading-relaxed shadow-inner">
                <p className="mb-2"><strong className="text-[#1e293b]">Método preferencial:</strong> {quote.paymentMethod}</p>
                <p className="italic">"{quote.paymentConditions}"</p>
              </div>
            </div>

            <div className="flex flex-col justify-end items-start md:items-end">
              <div className="w-full max-w-xs border-t-2 border-[#1e293b] pt-4">
                <p className="text-[18px] font-black text-[#1e293b] leading-tight">{profile.name}</p>
                <p className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[2px] mt-1">Assinatura</p>
              </div>
            </div>
          </div>
        </div>

        {!isApproved && (
          <button 
            disabled={approving}
            onClick={handleApprove}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-200 transition-all active:scale-[0.98] flex items-center justify-center space-x-3 no-print disabled:opacity-50"
          >
            {approving ? <Loader2 size={32} className="animate-spin" /> : <ShieldCheck size={32} />}
            <span>{approving ? 'PROCESSANDO...' : 'ACEITAR E APROVAR ORÇAMENTO'}</span>
          </button>
        )}

        <footer className="text-center py-10 no-print flex flex-col items-center space-y-2">
          <div className="h-8 w-px bg-slate-300"></div>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[3px]">
            Documento Autêntico • FocusQuote Professional
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PublicQuoteView;
