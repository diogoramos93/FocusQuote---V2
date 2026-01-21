
import React, { useState } from 'react';
import { User } from '../types';
import { Camera, Lock, Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name: email.split('@')[0] } }
        });
        
        if (signUpError) throw signUpError;
        
        if (data.user) {
          alert('Conta criada! Você já será conectado automaticamente.');
          const user: User = {
            id: data.user.id,
            username: data.user.email || '',
            name: data.user.user_metadata.name || data.user.email?.split('@')[0],
            role: 'photographer',
            isBlocked: false,
            createdAt: data.user.created_at
          };
          onLogin(user);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        
        if (data.user) {
          const user: User = {
            id: data.user.id,
            username: data.user.email || '',
            name: data.user.user_metadata.name || data.user.email?.split('@')[0],
            role: 'photographer',
            isBlocked: false,
            createdAt: data.user.created_at
          };
          onLogin(user);
        }
      }
    } catch (err: any) {
      console.error("Erro Auth:", err);
      setError(err.message || 'Falha na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-10">
          <div className="bg-indigo-600 p-5 rounded-[2rem] inline-block text-white shadow-2xl mb-6">
            <Camera size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">FocusQuote</h1>
          <p className="text-slate-500 mt-3 font-medium">Orçamentos Profissionais em Nuvem</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100">
          <div className="flex mb-8 bg-slate-50 p-1.5 rounded-2xl">
            <button onClick={() => setIsSignUp(false)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${!isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Entrar</button>
            <button onClick={() => setIsSignUp(true)} className={`flex-1 py-3 rounded-xl text-sm font-bold transition ${isSignUp ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Cadastrar</button>
          </div>

          <h2 className="text-2xl font-black text-slate-800 mb-6 text-center tracking-tight">
            {isSignUp ? 'Crie sua conta master' : 'Acesse seu painel'}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-start space-x-3 text-sm mb-6 border border-red-100 animate-in shake">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input required type="email" placeholder="seu@email.com" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Sua Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input required type="password" placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-medium" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-[0.97] flex items-center justify-center space-x-3 disabled:opacity-50">
              {loading ? <Loader2 size={24} className="animate-spin" /> : <><span>{isSignUp ? 'Criar Minha Conta' : 'Acessar Agora'}</span> <ArrowRight size={20} /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
