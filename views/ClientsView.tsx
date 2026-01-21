
import React, { useState } from 'react';
import { Client } from '../types';
import { Search, UserPlus, Edit2, Trash2, Mail, Phone, MapPin, X, Loader2, AlertCircle, Users, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ClientsViewProps {
  clients: Client[];
  onRefresh: () => Promise<void>;
  userId: string;
}

const ClientsView: React.FC<ClientsViewProps> = ({ clients, onRefresh, userId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '', email: '', phone: '', taxId: '', address: '', type: 'PF', notes: ''
  });

  const filteredClients = (clients || []).filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || saving) return;
    
    setSaving(true);
    setErrorMsg('');
    
    try {
      const dataToSave = {
        user_id: userId,
        name: formData.name.trim(),
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        tax_id: formData.taxId?.trim() || null,
        address: formData.address?.trim() || null,
        type: formData.type || 'PF',
        notes: formData.notes?.trim() || null
      };

      let result;
      if (editingClient) {
        result = await supabase.from('clients').update(dataToSave).eq('id', editingClient.id);
      } else {
        result = await supabase.from('clients').insert([dataToSave]);
      }

      if (result.error) throw result.error;
      
      try {
        await onRefresh();
      } catch (refreshErr) {
        console.warn("Cliente salvo, mas erro ao atualizar lista:", refreshErr);
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Erro crítico ao salvar cliente:", err);
      setErrorMsg(err.message || 'Erro de comunicação com o banco de dados.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
        await onRefresh();
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({ ...client });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingClient(null);
    setErrorMsg('');
    setFormData({ name: '', email: '', phone: '', taxId: '', address: '', type: 'PF', notes: '' });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Filtrar clientes por nome..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition active:scale-95"
        >
          <UserPlus size={20} />
          <span>Cadastrar Novo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <div className="h-14 w-14 bg-indigo-50 rounded-[1.25rem] flex items-center justify-center text-indigo-600 border border-indigo-100 font-black text-xl uppercase">
                  {(client.name || 'C').charAt(0)}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 leading-none text-lg">{client.name}</h3>
                  <span className={`inline-block mt-2 text-[10px] font-black uppercase px-2.5 py-1 rounded-lg border ${client.type === 'PF' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                    {client.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-1">
                <button onClick={() => handleEdit(client)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(client.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"><Trash2 size={18} /></button>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-500">
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100 overflow-hidden">
                <Mail size={18} className="text-slate-400 shrink-0" />
                <span className="truncate font-bold">{client.email || 'E-mail não informado'}</span>
              </div>
              <div className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Phone size={18} className="text-slate-400 shrink-0" />
                <span className="font-bold">{client.phone || 'Sem telefone'}</span>
              </div>
              {client.address && (
                <div className="flex items-start space-x-3 p-1">
                  <MapPin size={18} className="text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-xs font-medium leading-relaxed">{client.address}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400 flex flex-col items-center">
            <Users size={48} className="mb-4 opacity-20" />
            <p className="font-black uppercase tracking-widest text-xs">Nenhum cliente encontrado</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-2xl shadow-2xl my-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-10 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                <p className="text-slate-500 text-sm font-medium">Cadastre os dados completos para emissão do contrato.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 sm:p-10 space-y-6">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center space-x-2 text-xs font-bold border border-red-100 animate-in shake">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input required type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition font-medium" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Cliente</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition font-bold" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as 'PF' | 'PJ' })}>
                    <option value="PF">Pessoa Física (CPF)</option>
                    <option value="PJ">Pessoa Jurídica (CNPJ)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                  <input type="email" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                  <input type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">CPF ou CNPJ</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition" value={formData.taxId || ''} onChange={e => setFormData({ ...formData, taxId: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Endereço Completo</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Observações Privadas</label>
                <textarea rows={3} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition resize-none" value={formData.notes || ''} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Alguma observação sobre este cliente?" />
              </div>

              <div className="pt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="py-4 text-slate-600 font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 transition">Cancelar</button>
                <button disabled={saving} type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition flex items-center justify-center space-x-3 disabled:opacity-50">
                  {saving ? <Loader2 size={24} className="animate-spin" /> : <span>Confirmar Cadastro</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsView;
