
import React, { useState } from 'react';
import { ServiceTemplate, ServiceType } from '../types';
import { Search, Plus, Edit2, Trash2, Briefcase, X, Tag, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ServicesViewProps {
  services: ServiceTemplate[];
  onRefresh: () => Promise<void>;
  userId: string;
}

const ServicesView: React.FC<ServicesViewProps> = ({ services, onRefresh, userId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState<Partial<ServiceTemplate>>({
    name: '', description: '', defaultPrice: 0, type: ServiceType.PACKAGE
  });

  const filteredServices = (services || []).filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || saving) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const dataToSave = {
        name: formData.name,
        description: formData.description,
        default_price: formData.defaultPrice,
        type: formData.type,
        user_id: userId
      };

      if (editingService) {
        const { error } = await supabase.from('services').update(dataToSave).eq('id', editingService.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert([dataToSave]);
        if (error) throw error;
      }
      
      await onRefresh();
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Erro ao salvar serviço:", err);
      setErrorMsg(err.message || 'Erro ao salvar serviço no banco.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este modelo de serviço?')) {
      try {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) throw error;
        await onRefresh();
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  const handleEdit = (service: ServiceTemplate) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      defaultPrice: service.defaultPrice,
      type: service.type
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setErrorMsg('');
    setFormData({ name: '', description: '', defaultPrice: 0, type: ServiceType.PACKAGE });
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar serviços..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition shadow-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition active:scale-95"
        >
          <Plus size={20} />
          <span>Novo Modelo de Serviço</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map(service => (
          <div key={service.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-indigo-50 w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Briefcase size={28} />
              </div>
              <div className="flex space-x-1">
                <button onClick={() => handleEdit(service)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(service.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"><Trash2 size={18} /></button>
              </div>
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-2 leading-tight">{service.name}</h3>
            <p className="text-slate-500 text-sm mb-8 line-clamp-3 h-15 leading-relaxed">{service.description || 'Sem descrição.'}</p>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1 rounded-lg">
                <Tag size={14} className="text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{service.type}</span>
              </div>
              <p className="text-xl font-black text-slate-900">{formatCurrency(service.defaultPrice)}</p>
            </div>
          </div>
        ))}
        {filteredServices.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 text-slate-400 flex flex-col items-center">
            <Briefcase size={48} className="mb-4 opacity-20" />
            <p className="font-black uppercase tracking-widest text-xs">Seu catálogo de serviços está vazio</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[80] flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2rem] sm:rounded-[3rem] w-full max-w-lg shadow-2xl my-auto overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 sm:p-10 border-b border-slate-50 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{editingService ? 'Editar Modelo' : 'Novo Serviço'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 p-2 hover:bg-slate-50 rounded-full transition"><X size={28} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 sm:p-10 space-y-6">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center space-x-2 text-xs font-bold border border-red-100">
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Serviço</label>
                <input required type="text" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition font-medium" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Pacote</label>
                <textarea rows={3} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition resize-none" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Ex: Entrega de fotos digitais, álbum, etc..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Base (R$)</label>
                  <input type="number" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition" value={formData.defaultPrice} onChange={e => setFormData({ ...formData, defaultPrice: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Unidade</label>
                  <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition font-bold" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as ServiceType })}>
                    <option value={ServiceType.PACKAGE}>Pacote Fechado</option>
                    <option value={ServiceType.HOURLY}>Por Hora</option>
                    <option value={ServiceType.DAILY}>Por Diária</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="py-4 text-slate-600 font-bold border border-slate-200 rounded-2xl hover:bg-slate-50 transition">Cancelar</button>
                <button disabled={saving} type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition flex items-center justify-center space-x-3 disabled:opacity-50">
                  {saving ? <Loader2 size={24} className="animate-spin" /> : <span>Salvar no Catálogo</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesView;
