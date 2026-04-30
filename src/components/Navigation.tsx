import { LayoutDashboard, TrendingDown, TrendingUp, Wallet, LogOut } from 'lucide-react';
import { ActiveView } from '../lib/types';

interface NavigationProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  onSignOut: () => void;
}

const navItems = [
  { id: 'dashboard' as ActiveView, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'launch-expense' as ActiveView, label: 'Lancar Despesa', icon: TrendingDown },
  { id: 'launch-revenue' as ActiveView, label: 'Lancar Receita', icon: TrendingUp },
];

export default function Navigation({ activeView, onViewChange, onSignOut }: NavigationProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Wallet size={17} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-none tracking-wide">Controle Financeiro</h1>
              <span className="text-xs font-semibold text-cyan-400 tracking-widest">TECNOCAR</span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              const isExpense = item.id === 'launch-expense';
              const isRevenue = item.id === 'launch-revenue';
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? isExpense
                        ? 'bg-red-500/10 text-red-400'
                        : isRevenue
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-cyan-500/10 text-cyan-400'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon size={15} />
                  <span className="hidden sm:inline">{item.label}</span>
                  {isActive && (
                    <span
                      className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full ${
                        isExpense ? 'bg-red-400' : isRevenue ? 'bg-emerald-400' : 'bg-cyan-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}

            <button
              onClick={onSignOut}
              className="ml-2 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
              title="Sair"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
