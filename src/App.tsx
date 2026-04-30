import { useState, Suspense } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import Navigation from './components/Navigation';
import LaunchExpensePage from './components/Expenses/LaunchExpensePage';
import LaunchRevenuePage from './components/Revenue/LaunchRevenuePage';
import DashboardPage from './components/Dashboard/DashboardPage';
import { ActiveView } from './lib/types';
import { Loader2, AlertCircle } from 'lucide-react';

function AppContent() {
  const { session, profile, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-cyan-400" />
          <p className="text-sm text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  if (profile?.role === 'admin') {
    return <AdminPage onBack={signOut} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-cyan-400/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navigation activeView={activeView} onViewChange={setActiveView} onSignOut={signOut} />
        <main>
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 size={32} className="animate-spin text-cyan-400" /></div>}>
            {activeView === 'launch-expense' && <LaunchExpensePage />}
            {activeView === 'launch-revenue' && <LaunchRevenuePage />}
            {activeView === 'dashboard' && <DashboardPage />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/20 mb-4">
          <AlertCircle size={24} className="text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Erro na inicialização</h2>
        <p className="text-sm text-slate-400 mb-4">{error.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-lg transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export default function App() {
  try {
    return (
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    );
  } catch (error) {
    return <ErrorFallback error={error instanceof Error ? error : new Error('Unknown error')} />;
  }
}
