
import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  ShieldCheck, 
  Search, 
  Shield,
  Clock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Info,
  UserCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const AdminView: React.FC = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  const fetchProfiles = async () => {
    setLoading(true);
    setError('');
    try {
      // Busca todos os perfis. 
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*');
      
      if (fetchError) throw fetchError;

      const sortedData = (data || []).sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setProfiles(sortedData);
    } catch (err: any) {
      console.error("Erro AdminView:", err);
      setError(err.message || 'Erro de conexão ou permissão negada (500).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const toggleRole = async (profileId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'photographer' : 'admin';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);
      
      if (error) throw error;
      fetchProfiles();
    } catch (err: any) {
      alert('Erro ao alterar cargo: ' + err.message);
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (window.confirm('Deseja remover este perfil? O usuário continuará existindo no sistema de login, mas seus dados de estúdio serão apagados.')) {
      try {
        const { error } = await supabase.from('profiles').delete().eq('id', profileId);
        if (error) throw error;
        fetchProfiles();
      } catch (err: any) {
        alert('Erro ao deletar: ' + err.message);
      }
    }
  };

  const filteredProfiles = profiles.filter(p => 
    (p.name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (p.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.studio_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Data N/D';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Data Inválida' : date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start space-x-3 text-blue-800 shadow-sm">
        <Info className="shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-bold">Painel de Controle Master:</p>
          <p className="opacity-90 leading-relaxed">
            Aqui você gerencia todos os fotógrafos da plataforma. Se algum usuário não aparecer, peça para ele realizar o <strong>primeiro login</strong>.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou estúdio..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={fetchProfiles}
            className="flex items-center space-x-2 bg-white px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-indigo-600 transition shadow-sm"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="text-sm font-bold uppercase tracking-widest">Sincronizar</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-6 rounded-3xl flex flex-col space-y-3 border border-red-100 shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle size={24} />
            <span className="font-bold">Atenção Admin</span>
          </div>
          <p className="text-sm opacity-90">Erro: {error}. Certifique-se de que rodou o SQL de reconstrução do banco para consertar as permissões de rede.</p>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        {loading && profiles.length === 0 ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 size={40} className="animate-spin text-indigo-600" />
            <p className="text-slate-500 font-medium tracking-wide">Acessando banco de dados...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Usuário</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">E-mail</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Cargo</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px]">Cadastro em</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[2px] text-right">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProfiles.map(profile => (
                  <tr key={profile.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center font-bold border transition ${
                          profile.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700 border-purple-200' 
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          {profile.name?.charAt(0) || <UserCheck size={18} />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{profile.name || 'Pendente...'}</p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{profile.studio_name || 'Sem Estúdio'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                      {profile.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                        profile.role === 'admin' 
                          ? 'bg-purple-50 text-purple-700 border-purple-100' 
                          : 'bg-blue-50 text-blue-700 border-blue-100'
                      }`}>
                        {profile.role === 'admin' ? 'Master Admin' : 'Fotógrafo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div className="flex items-center space-x-1 font-medium">
                        <Clock size={14} className="text-slate-300" />
                        <span>{formatDate(profile.created_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <button 
                        onClick={() => toggleRole(profile.id, profile.role || 'photographer')}
                        className="p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition shadow-sm border border-indigo-100"
                        title="Alterar Nível de Acesso"
                      >
                        <Shield size={18} />
                      </button>
                      <button 
                        onClick={() => deleteProfile(profile.id)}
                        className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition shadow-sm border border-red-100"
                        title="Remover Registro Profissional"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProfiles.length === 0 && !loading && (
              <div className="p-20 text-center flex flex-col items-center space-y-3">
                <Search size={40} className="text-slate-200" />
                <p className="text-slate-400 font-medium">Nenhum registro encontrado.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
