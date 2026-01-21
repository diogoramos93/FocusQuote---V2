
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  UserCircle, 
  Camera,
  LogOut,
  Menu,
  ShieldCheck,
  Briefcase,
  Loader2,
  RefreshCw,
  BarChart3,
  Wallet
} from 'lucide-react';
import { PhotographerProfile, Client, Quote, QuoteStatus, User, ServiceTemplate, ServiceType, PaymentMethod } from './types';
import Dashboard from './views/Dashboard';
import ClientsView from './views/ClientsView';
import QuotesView from './views/QuotesView';
import ProfileView from './views/ProfileView';
import QuoteBuilder from './views/QuoteBuilder';
import AdminView from './views/AdminView';
import LoginView from './views/LoginView';
import PublicQuoteView from './views/PublicQuoteView';
import ServicesView from './views/ServicesView';
import ReportsView from './views/ReportsView';
import CashFlowView from './views/CashFlowView';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [profile, setProfile] = useState<PhotographerProfile>({
    name: '', taxId: '', phone: '', whatsapp: '', email: '', address: '', defaultTerms: '', monthlyGoal: 5000
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [services, setServices] = useState<ServiceTemplate[]>([]);

  const isSyncingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  const urlParams = new URLSearchParams(window.location.search);
  const isPublicView = urlParams.get('view') === 'public';
  const publicQuoteId = urlParams.get('q');
  const publicUserId = urlParams.get('u');

  const loadData = useCallback(async (userId: string, email?: string) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setSyncing(true);
    
    try {
      const { data: pData } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
      
      let currentRole: any = 'photographer';
      let isFirstTime = false;

      if (pData) {
        currentRole = pData.role || 'photographer';
        setProfile({
          name: pData.name || '',
          studioName: pData.studio_name || '',
          taxId: pData.tax_id || '',
          phone: pData.phone || '',
          whatsapp: pData.whatsapp || '',
          email: pData.email || '',
          address: pData.address || '',
          monthlyGoal: Number(pData.monthly_goal) || 5000,
          defaultTerms: pData.default_terms || ''
        });
      } else {
        isFirstTime = true;
        await supabase.from('profiles').insert({ user_id: userId, email: email || '', name: email?.split('@')[0] || 'Usuário' });
      }

      setCurrentUser({
        id: userId,
        username: email || '',
        name: pData?.name || email?.split('@')[0] || 'Usuário',
        role: currentRole,
        isBlocked: false,
        createdAt: new Date().toISOString()
      });

      if (isFirstTime && !hasInitializedRef.current) {
        setActiveTab('profile');
      }

      const [clientsRes, servicesRes, quotesRes] = await Promise.all([
        supabase.from('clients').select('*').eq('user_id', userId).order('name'),
        supabase.from('services').select('*').eq('user_id', userId).order('name'),
        supabase.from('quotes').select('*, items:quote_items(*)').eq('user_id', userId).order('created_at', { ascending: false })
      ]);

      if (clientsRes.data) {
        setClients(clientsRes.data.map(c => ({ 
          id: c.id, name: c.name, email: c.email || '', phone: c.phone || '', taxId: c.tax_id || '', 
          address: c.address || '', type: (c.type as 'PF'|'PJ') || 'PF', notes: c.notes || ''
        })));
      }

      if (servicesRes.data) {
        setServices(servicesRes.data.map(s => ({ 
          id: s.id, name: s.name, description: s.description || '', 
          defaultPrice: Number(s.default_price) || 0, type: (s.type as ServiceType) || ServiceType.PACKAGE
        })));
      }

      if (quotesRes.data) {
        setQuotes(quotesRes.data.map(q => ({
          id: q.id, number: q.number, clientId: q.client_id, date: q.date, validUntil: q.valid_until,
          status: q.status as QuoteStatus, discount: Number(q.discount) || 0, extraFees: Number(q.extra_fees) || 0,
          paymentMethod: q.payment_method as PaymentMethod, paymentConditions: q.payment_conditions || '', total: Number(q.total) || 0,
          items: (q.items || []).map((i: any) => ({
            id: i.id, name: i.name, description: i.description || '', unitPrice: Number(i.unit_price) || 0, quantity: Number(i.quantity) || 1, type: i.type as ServiceType
          }))
        })));
      }
      
      hasInitializedRef.current = true;
    } catch (err: any) {
      console.error("Erro no sincronismo:", err);
    } finally {
      setSyncing(false);
      isSyncingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session) {
          await loadData(session.user.id, session.user.email);
        } else {
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        if (session) {
          loadData(session.user.id, session.user.email);
        } else {
          setLoading(false);
          setCurrentUser(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadData]);

  if (isPublicView && publicQuoteId && publicUserId) return <PublicQuoteView quoteId={publicQuoteId} userId={publicUserId} />;
  
  if (loading) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-6">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando FocusQuote...</p>
    </div>
  );

  if (!currentUser) return <LoginView onLogin={(u) => { setCurrentUser(u); loadData(u.id, u.username); }} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard quotes={quotes} profile={profile} onNewQuote={() => setActiveTab('quote-builder')} onViewQuotes={() => setActiveTab('quotes')} onGoToClients={() => setActiveTab('clients')} />;
      case 'clients': return <ClientsView clients={clients} onRefresh={() => loadData(currentUser.id, currentUser.username)} userId={currentUser.id} />;
      case 'services': return <ServicesView services={services} onRefresh={() => loadData(currentUser.id, currentUser.username)} userId={currentUser.id} />;
      case 'quotes': return <QuotesView quotes={quotes} setQuotes={setQuotes} clients={clients} currentUser={currentUser} onEditQuote={(id) => { setEditingQuoteId(id); setActiveTab('quote-builder'); }} onNewQuote={() => { setEditingQuoteId(null); setActiveTab('quote-builder'); }} profile={profile} />;
      case 'reports': return <ReportsView quotes={quotes} clients={clients} />;
      case 'finance': return <CashFlowView quotes={quotes} userId={currentUser.id} />;
      case 'profile': return <ProfileView profile={profile} setProfile={setProfile} userId={currentUser.id} onRefresh={() => loadData(currentUser.id, currentUser.username)} />;
      case 'quote-builder': return <QuoteBuilder profile={profile} clients={clients} services={services} setQuotes={setQuotes} initialQuoteId={editingQuoteId} userId={currentUser.id} onCancel={() => setActiveTab('quotes')} onSave={async () => { await loadData(currentUser.id, currentUser.username); setActiveTab('quotes'); }} />;
      case 'admin': return <AdminView />;
      default: return <Dashboard quotes={quotes} profile={profile} onNewQuote={() => setActiveTab('quote-builder')} onViewQuotes={() => setActiveTab('quotes')} onGoToClients={() => setActiveTab('clients')} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#fbfcfd] overflow-hidden font-sans">
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-8 flex items-center space-x-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200"><Camera size={24} /></div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">FocusQuote</h1>
          </div>
          <nav className="flex-1 px-4 space-y-1 mt-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Painel Principal' },
              { id: 'quotes', icon: FileText, label: 'Orçamentos' },
              { id: 'finance', icon: Wallet, label: 'Financeiro' },
              { id: 'clients', icon: Users, label: 'Clientes' },
              { id: 'services', icon: Briefcase, label: 'Catálogo' },
              { id: 'reports', icon: BarChart3, label: 'Relatórios' },
              { id: 'profile', icon: UserCircle, label: 'Meu Perfil' }
            ].map(item => (
              <button key={item.id} onClick={() => {setActiveTab(item.id); setIsSidebarOpen(false)}} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-600 hover:bg-slate-50'}`}>
                <item.icon size={20} /><span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
            
            {currentUser.role === 'admin' && (
              <div className="pt-6 mt-6 border-t border-slate-50">
                <button onClick={() => {setActiveTab('admin'); setIsSidebarOpen(false)}} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'admin' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'text-slate-600 hover:bg-purple-50 hover:text-purple-600'}`}>
                  <ShieldCheck size={20} /><span className="font-bold text-sm tracking-tight">Gerenciar Usuários</span>
                </button>
              </div>
            )}
          </nav>
          <div className="p-6 border-t border-slate-50">
            <button onClick={() => supabase.auth.signOut()} className="w-full flex items-center justify-center space-x-2 text-slate-400 hover:text-red-500 py-2 transition font-bold"><LogOut size={16} /><span>Sair</span></button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-50 flex items-center justify-between px-8 shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600 lg:hidden hover:bg-slate-50 rounded-xl transition"><Menu size={24} /></button>
          <div className="flex-1 px-6">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[2px]">FocusQuote <span className="text-indigo-600 ml-1">Cloud</span></h2>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => loadData(currentUser.id, currentUser.username)} className={`p-2.5 rounded-xl transition ${syncing ? 'text-indigo-600 bg-indigo-50 animate-pulse' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'}`} title="Sincronizar">
              <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
            </button>
            <div className="h-10 w-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black uppercase">{currentUser.name.charAt(0)}</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto bg-[#fbfcfd] p-6 md:p-10">{renderContent()}</div>
      </main>
      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
    </div>
  );
};

export default App;
