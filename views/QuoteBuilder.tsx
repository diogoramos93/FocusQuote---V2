
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Quote, 
  QuoteStatus, 
  Client, 
  QuoteItem, 
  ServiceType, 
  PaymentMethod, 
  PhotographerProfile,
  ServiceTemplate
} from '../types';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  Briefcase,
  X,
  User,
  CreditCard,
  FileText,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface QuoteBuilderProps {
  profile: PhotographerProfile;
  clients: Client[];
  services: ServiceTemplate[];
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
  initialQuoteId: string | null;
  userId: string;
  onCancel: () => void;
  onSave: () => Promise<void>;
}

const QuoteBuilder: React.FC<QuoteBuilderProps> = ({ profile, clients, services, setQuotes, initialQuoteId, userId, onCancel, onSave }) => {
  const [showCatalog, setShowCatalog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Função para gerar o número baseado em data/hora: DDMMYYYYHHMM
  const generateDateTimeNumber = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}${month}${year}${hours}${minutes}`;
  };
  
  const [formData, setFormData] = useState<Partial<Quote>>({
    number: generateDateTimeNumber(),
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: QuoteStatus.DRAFT,
    items: [],
    discount: 0,
    extraFees: 0,
    paymentMethod: PaymentMethod.PIX,
    paymentConditions: profile.defaultTerms || '50% reserva + 50% entrega',
    total: 0
  });

  useEffect(() => {
    if (initialQuoteId) {
      const loadQuote = async () => {
        try {
          const { data, error } = await supabase
            .from('quotes')
            .select('*, items:quote_items(*)')
            .eq('id', initialQuoteId)
            .single();
          
          if (error) throw error;
          if (data) {
            setFormData({
              ...data,
              clientId: data.client_id,
              validUntil: data.valid_until,
              paymentMethod: data.payment_method,
              paymentConditions: data.payment_conditions,
              extraFees: data.extra_fees,
              items: data.items.map((i: any) => ({
                ...i,
                unitPrice: i.unit_price
              }))
            });
          }
        } catch (err: any) {
          setErrorMsg('Erro ao carregar orçamento: ' + err.message);
        }
      };
      loadQuote();
    }
  }, [initialQuoteId]);

  const totals = useMemo(() => {
    const subtotal = (formData.items || []).reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    const total = Math.max(0, subtotal - (formData.discount || 0) + (formData.extraFees || 0));
    return { subtotal, total };
  }, [formData.items, formData.discount, formData.extraFees]);

  const addItem = () => {
    const newItem: any = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      unitPrice: 0,
      quantity: 1,
      type: ServiceType.PACKAGE
    };
    setFormData(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
  };

  const addFromCatalog = (template: ServiceTemplate) => {
    const newItem: any = {
      id: crypto.randomUUID(),
      name: template.name,
      description: template.description,
      unitPrice: (template as any).default_price || template.defaultPrice,
      quantity: 1,
      type: template.type
    };
    setFormData(prev => ({ ...prev, items: [...(prev.items || []), newItem] }));
    setShowCatalog(false);
  };

  const removeItem = (id: string) => {
    setFormData(prev => ({ ...prev, items: (prev.items || []).filter(item => item.id !== id) }));
  };

  const updateItem = (id: string, field: keyof QuoteItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleFinalSave = async () => {
    if (!formData.clientId) return alert('Selecione um cliente!');
    if (!formData.items || formData.items.length === 0) return alert('Adicione pelo menos um serviço!');

    setSaving(true);
    setErrorMsg('');
    try {
      const quoteToSave = {
        number: formData.number,
        client_id: formData.clientId,
        date: formData.date,
        valid_until: formData.validUntil,
        status: formData.status,
        discount: formData.discount,
        extra_fees: formData.extraFees,
        payment_method: formData.paymentMethod,
        payment_conditions: formData.paymentConditions,
        total: totals.total,
        user_id: userId
      };

      let quoteId = initialQuoteId;

      if (initialQuoteId) {
        const { error } = await supabase.from('quotes').update(quoteToSave).eq('id', initialQuoteId);
        if (error) throw error;
        await supabase.from('quote_items').delete().eq('quote_id', initialQuoteId);
      } else {
        const { data, error } = await supabase.from('quotes').insert([quoteToSave]).select().single();
        if (error) throw error;
        quoteId = data.id;
      }

      const itemsToInsert = formData.items!.map(item => ({
        quote_id: quoteId,
        name: item.name,
        description: item.description,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        type: item.type
      }));

      const { error: itemsError } = await supabase.from('quote_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      await onSave();
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Erro ao salvar: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-5xl mx-auto pb-20 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <button onClick={onCancel} className="w-full sm:w-auto flex items-center justify-center text-slate-400 font-bold hover:text-slate-700 transition px-4 py-2">
          <ArrowLeft size={20} className="mr-2" /> Voltar
        </button>
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end space-x-4">
          <div className="text-right">
             <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Total Final</p>
             <p className="text-xl font-black text-indigo-600">{formatCurrency(totals.total)}</p>
          </div>
          <button 
            disabled={saving}
            onClick={handleFinalSave} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 sm:px-8 py-3 rounded-xl font-bold flex items-center shadow-lg transition active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
            <span>Salvar</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center space-x-2 text-sm font-medium mb-6">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-2 text-indigo-600 border-b border-slate-50 pb-4">
            <User size={18} />
            <h3 className="font-bold uppercase text-xs tracking-widest">Identificação</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Cliente</label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.clientId}
                onChange={e => setFormData({ ...formData, clientId: e.target.value })}
              >
                <option value="">Selecione o cliente...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Emissão</label>
              <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Vencimento</label>
              <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.validUntil} onChange={e => setFormData({ ...formData, validUntil: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-50 pb-4 gap-3">
            <div className="flex items-center space-x-2 text-indigo-600">
              <FileText size={18} />
              <h3 className="font-bold uppercase text-xs tracking-widest">Serviços</h3>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => setShowCatalog(true)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-100 transition">Puxar do Catálogo</button>
              <button onClick={addItem} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition">Adicionar Item</button>
            </div>
          </div>

          <div className="space-y-4">
            {(formData.items || []).map((item) => (
              <div key={item.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative group transition-all">
                <button onClick={() => removeItem(item.id)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition">
                  <Trash2 size={18} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  <div className="md:col-span-6">
                    <input className="w-full font-bold text-slate-800 bg-transparent border-none focus:ring-0 p-0" placeholder="Nome do Serviço" value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} />
                    <textarea className="w-full text-xs text-slate-500 bg-transparent border-none focus:ring-0 p-0 resize-none mt-1" rows={2} placeholder="Descrição" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                  </div>
                  <div className="md:col-span-3 flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-slate-400">QTD:</span>
                    <input type="number" min="1" className="w-12 text-center bg-white border border-slate-200 rounded-lg py-1 font-bold" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} />
                    <select className="bg-transparent text-[10px] font-bold text-slate-500" value={item.type} onChange={e => updateItem(item.id, 'type', e.target.value as ServiceType)}>
                      <option value={ServiceType.PACKAGE}>UN</option>
                      <option value={ServiceType.HOURLY}>HR</option>
                      <option value={ServiceType.DAILY}>DIA</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 flex flex-col items-end">
                    <p className="text-[10px] font-bold text-slate-400 mb-1">VALOR UNITÁRIO</p>
                    <div className="flex items-center bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 text-xs mr-1">R$</span>
                      <input type="number" className="text-right text-sm font-black text-indigo-600 bg-transparent border-none w-24 p-0" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-2 text-indigo-600 border-b border-slate-50 pb-4">
              <CreditCard size={18} />
              <h3 className="font-bold uppercase text-xs tracking-widest">Financeiro</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Desconto (R$)</label>
                <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.discount} onChange={e => setFormData({ ...formData, discount: Number(e.target.value) })} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Método</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" value={formData.paymentMethod} onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}>
                  {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm" rows={3} value={formData.paymentConditions} onChange={e => setFormData({ ...formData, paymentConditions: e.target.value })} />
          </div>

          <div className="bg-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col justify-between">
            <h3 className="text-lg font-bold mb-6 text-indigo-400 uppercase text-xs tracking-widest">Resumo Final</h3>
            <div className="space-y-4">
              <div className="flex justify-between text-slate-400"><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
              {formData.discount ? <div className="flex justify-between text-red-400"><span>Desconto</span><span>- {formatCurrency(formData.discount)}</span></div> : null}
              <div className="h-px bg-white/10 my-4"></div>
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold">Total</span>
                <span className="text-3xl font-black text-indigo-400">{formatCurrency(totals.total)}</span>
              </div>
            </div>
            <button disabled={saving} onClick={handleFinalSave} className="mt-8 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black text-lg transition shadow-lg flex items-center justify-center">
              {saving ? <Loader2 size={24} className="animate-spin" /> : <span>Gerar Orçamento</span>}
            </button>
          </div>
        </div>
      </div>

      {showCatalog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] sm:rounded-3xl w-full max-w-xl my-auto max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center">
               <h3 className="text-xl font-bold text-slate-800">Seu Catálogo</h3>
               <button onClick={() => setShowCatalog(false)} className="p-2"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              {services.map(s => (
                <button key={s.id} onClick={() => addFromCatalog(s)} className="w-full text-left p-4 bg-slate-50 border rounded-xl hover:bg-indigo-50 transition flex justify-between items-center">
                   <div>
                    <p className="font-bold text-slate-800">{s.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{s.type}</p>
                   </div>
                   <p className="text-sm font-black text-indigo-600">{formatCurrency((s as any).default_price || s.defaultPrice)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteBuilder;
