import { X, Lightbulb, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, Target, Zap } from 'lucide-react';

interface UnitData {
  name: string;
  expenseTotal: number;
  revenueTotal: number;
  expensePercent: number;
  revenuePercent: number;
}

interface CategoryData {
  name: string;
  unitName: string;
  total: number;
  percent: number;
}

interface InsightsModalProps {
  onClose: () => void;
  totalExpenses: number;
  totalRevenues: number;
  topExpenseUnit: UnitData | null;
  topRevenueUnit: UnitData | null;
  topExpenseCategory: CategoryData | null;
  unitData: UnitData[];
  expenseCount: number;
  revenueCount: number;
}

interface Insight {
  type: 'warning' | 'success' | 'tip' | 'action';
  icon: typeof AlertTriangle;
  title: string;
  description: string;
}

function generateInsights(props: Omit<InsightsModalProps, 'onClose'>): Insight[] {
  const {
    totalExpenses, totalRevenues, topExpenseUnit, topRevenueUnit,
    topExpenseCategory, unitData, expenseCount, revenueCount,
  } = props;

  const insights: Insight[] = [];
  const margin = totalRevenues > 0 ? ((totalRevenues - totalExpenses) / totalRevenues) * 100 : null;
  const ratio = totalRevenues > 0 ? totalExpenses / totalRevenues : null;

  if (margin !== null) {
    if (margin < 0) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Despesas superam as receitas',
        description: `Voce esta gastando R$ ${(totalExpenses - totalRevenues).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a mais do que entra. Revise os maiores custos imediatamente.`,
      });
    } else if (margin < 20) {
      insights.push({
        type: 'warning',
        icon: AlertTriangle,
        title: `Margem apertada: ${margin.toFixed(1)}%`,
        description: 'Sua margem esta abaixo de 20%. Busque reduzir despesas variaveis e aumentar o ticket medio das vendas.',
      });
    } else if (margin >= 40) {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: `Excelente margem: ${margin.toFixed(1)}%`,
        description: 'Sua operacao esta muito saudavel. Considere reinvestir parte do lucro em marketing ou expansao.',
      });
    } else {
      insights.push({
        type: 'success',
        icon: CheckCircle,
        title: `Margem saudavel: ${margin.toFixed(1)}%`,
        description: 'Bom controle financeiro. Mantenha o monitoramento constante e busque otimizar categorias de alto custo.',
      });
    }
  }

  if (topExpenseUnit && topExpenseUnit.expensePercent > 40) {
    insights.push({
      type: 'warning',
      icon: TrendingDown,
      title: `"${topExpenseUnit.name}" concentra ${topExpenseUnit.expensePercent.toFixed(0)}% das despesas`,
      description: `Unidade de alto impacto. Analise subcategorias dentro desta unidade para identificar onde cortar sem prejudicar a operacao.`,
    });
  }

  if (topExpenseCategory && topExpenseCategory.percent > 30) {
    insights.push({
      type: 'tip',
      icon: Target,
      title: `Categoria "${topExpenseCategory.name}" e a maior despesa`,
      description: `Representa ${topExpenseCategory.percent.toFixed(0)}% dos gastos. Negocie com fornecedores, busque alternativas ou otimize o consumo desta categoria.`,
    });
  }

  if (topRevenueUnit) {
    insights.push({
      type: 'success',
      icon: TrendingUp,
      title: `"${topRevenueUnit.name}" e sua maior geradora de receita`,
      description: `Concentre esforcos e investimentos nesta unidade. Escale o que funciona: mais volume, mais canais de venda ou novos produtos/servicos.`,
    });
  }

  const unitsWithNegativeMargin = unitData.filter(u => u.revenueTotal > 0 && u.expenseTotal > u.revenueTotal);
  if (unitsWithNegativeMargin.length > 0) {
    insights.push({
      type: 'warning',
      icon: AlertTriangle,
      title: `${unitsWithNegativeMargin.length} unidade(s) com resultado negativo`,
      description: `${unitsWithNegativeMargin.map(u => u.name).join(', ')} gastam mais do que geram. Revise o modelo de negocio ou reduza custos nestas unidades.`,
    });
  }

  if (ratio !== null && ratio < 0.5) {
    insights.push({
      type: 'tip',
      icon: Zap,
      title: 'Oportunidade de reinvestimento',
      description: 'Suas despesas sao menos da metade das receitas. Voce tem capital disponivel para reinvestir em crescimento, marketing ou reserva de emergencia.',
    });
  }

  if (revenueCount === 0 && expenseCount > 0) {
    insights.push({
      type: 'action',
      icon: TrendingUp,
      title: 'Nenhuma receita registrada no periodo',
      description: 'Comece a registrar suas receitas para ter uma visao completa da saude financeira do negocio e calcular sua margem real.',
    });
  }

  if (expenseCount > 0 && revenueCount > 0 && expenseCount > revenueCount * 3) {
    insights.push({
      type: 'tip',
      icon: Target,
      title: 'Muitas transacoes de despesa vs receita',
      description: 'Voce tem 3x mais lancamentos de despesa que receita. Verifique se todas as receitas estao sendo devidamente registradas.',
    });
  }

  insights.push({
    type: 'tip',
    icon: Lightbulb,
    title: 'Dica: Revise mensalmente',
    description: 'Dedique 30 minutos por mes para analisar o dashboard. Compare o mes atual com o anterior e defina uma meta de reducao de despesas de 5 a 10%.',
  });

  return insights.slice(0, 6);
}

const typeConfig = {
  warning: { bg: 'bg-amber-500/8', border: 'border-amber-500/20', icon: 'text-amber-400', badge: 'bg-amber-500/10 text-amber-400' },
  success: { bg: 'bg-emerald-500/8', border: 'border-emerald-500/20', icon: 'text-emerald-400', badge: 'bg-emerald-500/10 text-emerald-400' },
  tip: { bg: 'bg-cyan-500/8', border: 'border-cyan-500/20', icon: 'text-cyan-400', badge: 'bg-cyan-500/10 text-cyan-400' },
  action: { bg: 'bg-blue-500/8', border: 'border-blue-500/20', icon: 'text-blue-400', badge: 'bg-blue-500/10 text-blue-400' },
};

const typeLabel = { warning: 'Atencao', success: 'Positivo', tip: 'Dica', action: 'Acao' };

export default function InsightsModal(props: InsightsModalProps) {
  const { onClose } = props;
  const insights = generateInsights(props);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Lightbulb size={18} className="text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Ideias de Melhoria</h3>
              <p className="text-xs text-slate-500">Analise baseada nos seus dados do periodo</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {insights.map((insight, i) => {
            const Icon = insight.icon;
            const cfg = typeConfig[insight.type];
            return (
              <div key={i} className={`rounded-xl border p-4 ${cfg.bg} ${cfg.border}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.badge}`}>
                    <Icon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {typeLabel[insight.type]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-white leading-snug">{insight.title}</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex-shrink-0">
          <p className="text-xs text-slate-600 text-center">
            Sugestoes geradas automaticamente com base nos dados do periodo selecionado
          </p>
        </div>
      </div>
    </div>
  );
}
