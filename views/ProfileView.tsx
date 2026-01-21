
import React, { useState, useEffect } from 'react';
import { PhotographerProfile } from '../types';
import { Save, Camera, Mail, Phone, MapPin, CreditCard, Target, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InputFieldProps {
  label: string;
  icon: any;
  value: string | number;
  placeholder?: string;
  type?: string;
  onChange: (value: any) => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, icon: Icon, value, placeholder, type = 'text', onChange }) => (
  <div className="space-y-1">
    <label className="text-xs font-bold text-slate-500 uppercase ml-1">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon size={18} />
      </div>
      <input 
        type={type}
        placeholder={placeholder}
        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none transition-all font-medium"
        value={value || ''}
        onChange={e => {
          const val = type === 'number' ? Number(e.target.value) : e.target.value;
          onChange(val);
        }}
      />
    </div>
  </div>
);

interface ProfileViewProps {
  profile: PhotographerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PhotographerProfile>>;
  userId: string;
  onRefresh: () => Promise<void>;
}

const ProfileView: React.FC<ProfileViewProps> = ({ profile, setProfile, userId, onRefresh }) => {
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Estado local para evitar que cada tecla digitada cause re-render no App.tsx (perda de foco)
  const [localProfile, setLocalProfile] = useState<PhotographerProfile>({...profile});

  useEffect(() => {
    setLocalProfile({...profile});
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrorMsg('');
    setShowSuccess(false);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          name: localProfile.name,
          studio_name: localProfile.studioName,
          tax_id: localProfile.taxId,
          phone: localProfile.phone,
          whatsapp: localProfile.whatsapp,
          email: localProfile.email,
          address: localProfile.address,
          website: localProfile.website,
          instagram: localProfile.instagram,
          default_terms: localProfile.defaultTerms,
          monthly_goal: localProfile.monthlyGoal
        });
      
      if (error) throw error;
      
      setShowSuccess(true);
      await onRefresh();
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      setErrorMsg(err.message || 'Erro de conexão com o banco.');
    } finally {
      setSaving(false);
    }
  };

  const updateLocal = (field: keyof PhotographerProfile, value: any) => {
    setLocalProfile(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 pb-20 animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Configurações do Perfil</h1>
        <p className="text-slate-500 font-medium">Os dados abaixo sairão no topo de todos os seus PDFs.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/3 space-y-6">
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 text-center">
              <div className="relative inline-block mb-6">
                <div className="h-32 w-32 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 border-2 border-dashed border-indigo-200">
                  <Camera size={48} />
                </div>
              </div>
              <h3 className="font-black text-slate-800 text-xl leading-tight">{localProfile.studioName || localProfile.name || 'Seu Estúdio'}</h3>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">Status: Ativo</p>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl space-y-6">
              <div className="flex items-center space-x-3 text-indigo-400">
                <Target size={24} />
                <h4 className="font-black uppercase text-xs tracking-[2px]">Meta Mensal</h4>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-indigo-400">R$</span>
                  <input 
                    type="number" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black text-indigo-400 text-xl"
                    value={localProfile.monthlyGoal}
                    onChange={e => updateLocal('monthlyGoal', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-6">
            {errorMsg && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-3xl flex items-start space-x-3 text-sm font-bold animate-in shake">
                <AlertCircle size={20} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 space-y-8">
              <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Informações Principais</h3>
                {showSuccess && (
                  <div className="flex items-center text-emerald-600 text-sm font-black animate-in slide-in-from-right">
                    <CheckCircle size={18} className="mr-2" /> Alterações Salvas!
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="Seu Nome" icon={Camera} value={localProfile.name} onChange={v => updateLocal('name', v)} />
                <InputField label="Nome do Estúdio" icon={Camera} value={localProfile.studioName || ''} onChange={v => updateLocal('studioName', v)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="CPF ou CNPJ" icon={CreditCard} value={localProfile.taxId} onChange={v => updateLocal('taxId', v)} />
                <InputField label="WhatsApp" icon={Phone} value={localProfile.whatsapp} onChange={v => updateLocal('whatsapp', v)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputField label="E-mail" icon={Mail} value={localProfile.email} type="email" onChange={v => updateLocal('email', v)} />
                <InputField label="Telefone Fixo" icon={Phone} value={localProfile.phone || ''} onChange={v => updateLocal('phone', v)} />
              </div>

              <InputField label="Endereço Profissional" icon={MapPin} value={localProfile.address} onChange={v => updateLocal('address', v)} />

              <div className="space-y-2 pt-4 border-t border-slate-50">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Termos e Condições Padrão</label>
                <textarea 
                  rows={4}
                  className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium text-slate-600"
                  value={localProfile.defaultTerms}
                  onChange={e => updateLocal('defaultTerms', e.target.value)}
                  placeholder="Ex: Reserva 30%..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                disabled={saving}
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-200 flex items-center transition-all active:scale-95 disabled:opacity-50"
              >
                {saving ? <Loader2 size={24} className="animate-spin mr-3" /> : <Save size={24} className="mr-3" />}
                {saving ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ProfileView;
