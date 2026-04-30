import { DollarSign, Hash, TrendingDown, Award } from 'lucide-react';
import { ExpenseWithType } from '../../lib/types';

interface StatsCardsProps {
  total: number;
  count: number;
  avg: number;
  maxExpense: ExpenseWithType | undefined;
}

export default function StatsCards({ total, count, avg, maxExpense }: StatsCardsProps) {
  const cards = [
    {
      label: 'Total de Despesas',
      value: `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-red-400',
      bg: 'bg-red-400/8',
      border: 'border-red-400/10',
      iconBg: 'bg-red-400/10',
    },
    {
      label: 'Lançamentos',
      value: count.toString(),
      icon: Hash,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/8',
      border: 'border-cyan-400/10',
      iconBg: 'bg-cyan-400/10',
    },
    {
      label: 'Ticket Médio',
      value: count > 0 ? `R$ ${avg.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'R$ 0,00',
      icon: TrendingDown,
      color: 'text-amber-400',
      bg: 'bg-amber-400/8',
      border: 'border-amber-400/10',
      iconBg: 'bg-amber-400/10',
    },
    {
      label: 'Maior Despesa',
      value: maxExpense
        ? `R$ ${Number(maxExpense.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        : 'R$ 0,00',
      subtitle: maxExpense?.expense_types?.name,
      icon: Award,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/8',
      border: 'border-emerald-400/10',
      iconBg: 'bg-emerald-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div
            key={i}
            className={`rounded-2xl border p-5 ${card.bg} ${card.border} backdrop-blur-sm`}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-slate-400">{card.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.iconBg}`}>
                <Icon size={15} className={card.color} />
              </div>
            </div>
            <p className={`text-xl font-bold ${card.color} leading-none`}>{card.value}</p>
            {card.subtitle && (
              <p className="text-xs text-slate-500 mt-1.5 truncate">{card.subtitle}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
