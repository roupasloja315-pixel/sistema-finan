import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import LoginPage from './components/LoginPage';
import AdminPage from './components/AdminPage';
import Navigation from './components/Navigation';
import LaunchExpensePage from './components/Expenses/LaunchExpensePage';
import LaunchRevenuePage from './components/Revenue/LaunchRevenuePage';
import DashboardPage from './components/Dashboard/DashboardPage';
import { ActiveView } from './lib/types';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { session, profile, loading, signOut } = useAuth();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-cyan-400" />
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
          {activeView === 'launch-expense' && <LaunchExpensePage />}
          {activeView === 'launch-revenue' && <LaunchRevenuePage />}
          {activeView === 'dashboard' && <DashboardPage />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
