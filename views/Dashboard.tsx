
import React from 'react';
import { Quote, QuoteStatus, PhotographerProfile } from '../types';
import { TrendingUp, FileText, CheckCircle, Clock, ArrowRight, PlusCircle, Users, Briefcase } from 'lucide-react';

interface DashboardProps {
  quotes: Quote[];
  profile: PhotographerProfile;
  onNewQuote: () => void;
  onViewQuotes: () => void;
  onGoToClients: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ quotes, profile, onNewQuote, onViewQuotes, onGoToClients }) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalRevenue = quotes
    .filter(q => q.status === QuoteStatus.APPROVED)
    .reduce((sum, q) => sum + q.total, 0);

  const currentMonthRevenue = quotes
    .filter(q => {
      const qDate = new Date(q.date);
      return q.status === QuoteStatus.APPROVED && 
             qDate.getMonth() === currentMonth && 
             qDate.getFullYear() === currentYear;
    })
    .reduce((sum, q) => sum + q.total, 0);

  const stats = {
    total: quotes.length,
    approved: quotes.filter(q => q.status === QuoteStatus.APPROVED).length,
    pending: quotes.filter(q => q.status === QuoteStatus.SENT || q.status === QuoteStatus.DRAFT || q.status === QuoteStatus.VIEWED).length,
    revenue: totalRevenue
  };

  const recentQuotes = [...quotes].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const goalValue = profile.monthlyGoal || 5000;
  const progressPercent = Math.min(Math.round((currentMonthRevenue / goalValue) * 100), 100);

  const StatCard = ({ title, value, icon: Icon, colorClass, bgColorClass }: any) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 mt-1">{value}</h3>
      </div>
      <div className={`${bgColorClass} p-4 rounded-2xl ${colorClass} shadow-inner`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Olá, {profile.name.split(' ')[0]}! 📸</h1>
          <p className="text-slate-500 font-medium mt-3">Você tem {stats.pending} orçamentos aguardando aprovação.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={onNewQuote}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center space-x-2"
          >
            <PlusCircle size={20} />
            <span>Criar Novo Orçamento</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard title="Faturamento Total" value={formatCurrency(stats.revenue)} icon={TrendingUp} colorClass="text-emerald-600" bgColorClass="bg-emerald-50" />
        <StatCard title="Total Criado" value={stats.total} icon={FileText} colorClass="text-indigo-600" bgColorClass="bg-indigo-50" />
        <StatCard title="Total Aprovado" value={stats.approved} icon={CheckCircle} colorClass="text-blue-600" bgColorClass="bg-blue-50" />
        <StatCard title="Em Aberto" value={stats.pending} icon={Clock} colorClass="text-amber-600" bgColorClass="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={onGoToClients} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition text-left group">
              <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors"><Users size={24} /></div>
              <h4 className="font-black text-slate-800 tracking-tight">Gerenciar Clientes</h4>
              <p className="text-slate-500 text-sm mt-1">Acesse sua base de contatos.</p>
            </button>
            <button onClick={onViewQuotes} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition text-left group">
              <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:bg-purple-600 group-hover:text-white transition-colors"><FileText size={24} /></div>
              <h4 className="font-black text-slate-800 tracking-tight">Lista de Orçamentos</h4>
              <p className="text-slate-500 text-sm mt-1">Veja todos os documentos gerados.</p>
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-black text-xl text-slate-900 tracking-tight">Últimos Orçamentos</h3>
              <button onClick={onViewQuotes} className="text-indigo-600 text-sm font-black flex items-center hover:underline uppercase tracking-widest">Ver Todos <ArrowRight size={14} className="ml-2" /></button>
            </div>
            <div className="divide-y divide-slate-50">
              {recentQuotes.length > 0 ? (
                recentQuotes.map(quote => (
                  <div key={quote.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center space-x-5">
                      <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400"><FileText size={24} /></div>
                      <div>
                        <p className="font-black text-slate-900 tracking-tight">#{quote.number}</p>
                        <p className="text-sm text-slate-400 font-medium">{new Date(quote.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-lg">{formatCurrency(quote.total)}</p>
                      <span className={`text-[10px] uppercase font-black px-3 py-1 rounded-full border ${
                        quote.status === QuoteStatus.APPROVED ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        quote.status === QuoteStatus.DECLINED ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-slate-50 text-slate-500 border-slate-200'
                      }`}>
                        {quote.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center text-slate-400 font-medium">Você ainda não criou nenhum orçamento.</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 flex flex-col justify-between h-full min-h-[400px]">
            <div>
              <div className="bg-indigo-800/50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6"><TrendingUp size={32} /></div>
              <h3 className="text-2xl font-black tracking-tight leading-tight mb-4">Meta de Faturamento Mensal</h3>
              <p className="text-indigo-200 font-medium leading-relaxed">
                Você faturou <span className="text-white font-black text-lg">{formatCurrency(currentMonthRevenue)}</span> neste mês.
              </p>
            </div>
            
            <div className="mt-auto space-y-4 pt-10 border-t border-indigo-800">
              <div className="flex justify-between items-end">
                <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Progresso</p>
                <p className="text-3xl font-black text-white">{progressPercent}%</p>
              </div>
              <div className="w-full bg-indigo-950/50 h-5 rounded-full overflow-hidden border border-indigo-800">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(129,140,248,0.5)] ${
                    progressPercent >= 100 ? 'bg-emerald-400' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                <span>R$ 0</span>
                <span>Alvo: {formatCurrency(goalValue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
