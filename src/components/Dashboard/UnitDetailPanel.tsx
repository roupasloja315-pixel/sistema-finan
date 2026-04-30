import { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Scale } from 'lucide-react';

interface RawRecord {
  id: string;
  unit_id: string | null;
  category_id: string | null;
  value: number;
  observation: string;
  date: string;
  units?: { id: string; name: string; color: string } | null;
  categories?: { id: string; name: string } | null;
  subcategories?: { id: string; name: string } | null;
}

interface Props {
  unitId: string;
  unitName: string;
  unitColor: string;
  expenses: RawRecord[];
  revenues: RawRecord[];
  onClose: () => void;
}

const fmtBRL = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function UnitDetailPanel({ unitId, unitName, unitColor, expenses, revenues, onClose }: Props) {
  const unitExpenses = useMemo(() => expenses.filter(e => e.unit_id === unitId), [expenses, unitId]);
  const unitRevenues = useMemo(() => revenues.filter(r => r.unit_id === unitId), [revenues, unitId]);

  const totalExp = unitExpenses.reduce((s, e) => s + Number(e.value), 0);
  const totalRev = unitRevenues.reduce((s, r) => s + Number(r.value), 0);
  const net = totalRev - totalExp;
  const margin = totalRev > 0 ? (net / totalRev) * 100 : null;

  const expByCategory = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    unitExpenses.forEach(e => {
      const id = e.category_id || '__none__';
      const name = e.categories?.name || 'Sem categoria';
      if (!map[id]) map[id] = { name, total: 0, count: 0 };
      map[id].total += Number(e.value);
      map[id].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [unitExpenses]);

  const revByCategory = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    unitRevenues.forEach(r => {
      const id = r.category_id || '__none__';
      const name = r.categories?.name || 'Sem categoria';
      if (!map[id]) map[id] = { name, total: 0, count: 0 };
      map[id].total += Number(r.value);
      map[id].count++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [unitRevenues]);

  const allCategoryNames = useMemo(() => {
    const names = new Set([...expByCategory.map(c => c.name), ...revByCategory.map(c => c.name)]);
    return Array.from(names);
  }, [expByCategory, revByCategory]);

  const reconciliation = useMemo(() => {
    return allCategoryNames.map(name => {
      const exp = expByCategory.find(c => c.name === name)?.total || 0;
      const rev = revByCategory.find(c => c.name === name)?.total || 0;
      return { name, exp, rev, net: rev - exp };
    }).sort((a, b) => b.net - a.net);
  }, [allCategoryNames, expByCategory, revByCategory]);

  const maxExpCatVal = expByCategory[0]?.total || 1;
  const maxRevCatVal = revByCategory[0]?.total || 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: unitColor }} />
            <div>
              <h2 className="text-base font-bold text-white">{unitName}</h2>
              <p className="text-xs text-slate-500">Analise por categoria</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Receita Total</p>
              <p className="text-sm font-bold text-emerald-400">{fmtBRL(totalRev)}</p>
              <p className="text-xs text-slate-600 mt-0.5">{unitRevenues.length} lanc.</p>
            </div>
            <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-4">
              <p className="text-xs text-slate-400 mb-1">Despesa Total</p>
              <p className="text-sm font-bold text-red-400">{fmtBRL(totalExp)}</p>
              <p className="text-xs text-slate-600 mt-0.5">{unitExpenses.length} lanc.</p>
            </div>
            <div className={`border rounded-xl p-4 ${net >= 0 ? 'bg-cyan-500/5 border-cyan-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
              <p className="text-xs text-slate-400 mb-1">Resultado</p>
              <p className={`text-sm font-bold ${net >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                {net >= 0 ? '+' : '-'}{fmtBRL(net)}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">{net >= 0 ? 'Superavit' : 'Deficit'}</p>
            </div>
            <div className={`border rounded-xl p-4 ${margin !== null && margin >= 20 ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-amber-500/5 border-amber-500/15'}`}>
              <p className="text-xs text-slate-400 mb-1">Margem</p>
              <p className={`text-sm font-bold ${margin !== null && margin >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {margin !== null ? `${margin.toFixed(1)}%` : '—'}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">{margin !== null ? (margin >= 20 ? 'Saudavel' : 'Atencao') : '—'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={13} className="text-emerald-400" />
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Receitas por Categoria</h3>
              </div>
              {revByCategory.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-6">Sem dados</p>
              ) : (
                <div className="space-y-3">
                  {revByCategory.map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 truncate max-w-[140px]">{cat.name}</span>
                        <span className="text-emerald-400 font-semibold ml-2 flex-shrink-0">{fmtBRL(cat.total)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${(cat.total / maxRevCatVal) * 100}%` }} />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{cat.count} lanc. · {totalRev > 0 ? ((cat.total / totalRev) * 100).toFixed(1) : '0'}%</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={13} className="text-red-400" />
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Despesas por Categoria</h3>
              </div>
              {expByCategory.length === 0 ? (
                <p className="text-xs text-slate-600 text-center py-6">Sem dados</p>
              ) : (
                <div className="space-y-3">
                  {expByCategory.map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 truncate max-w-[140px]">{cat.name}</span>
                        <span className="text-red-400 font-semibold ml-2 flex-shrink-0">{fmtBRL(cat.total)}</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full transition-all duration-500"
                          style={{ width: `${(cat.total / maxExpCatVal) * 100}%` }} />
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">{cat.count} lanc. · {totalExp > 0 ? ((cat.total / totalExp) * 100).toFixed(1) : '0'}%</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {reconciliation.length > 0 && (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-4">
                <Scale size={13} className="text-cyan-400" />
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Reconciliacao por Categoria</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 text-slate-500 font-semibold">Categoria</th>
                      <th className="text-right py-2 text-emerald-400/70 font-semibold">Receita</th>
                      <th className="text-right py-2 text-red-400/70 font-semibold">Despesa</th>
                      <th className="text-right py-2 text-slate-400 font-semibold">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliation.map((row, i) => (
                      <tr key={i} className="border-b border-slate-800/50">
                        <td className="py-2.5 text-slate-300 truncate max-w-[140px]">{row.name}</td>
                        <td className="py-2.5 text-right text-emerald-400">{row.rev > 0 ? fmtBRL(row.rev) : '—'}</td>
                        <td className="py-2.5 text-right text-red-400">{row.exp > 0 ? fmtBRL(row.exp) : '—'}</td>
                        <td className={`py-2.5 text-right font-bold ${row.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {row.net >= 0 ? '+' : '-'}{fmtBRL(row.net)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-600">
                      <td className="py-2.5 font-bold text-slate-300">Total</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">{fmtBRL(totalRev)}</td>
                      <td className="py-2.5 text-right font-bold text-red-400">{fmtBRL(totalExp)}</td>
                      <td className={`py-2.5 text-right font-bold ${net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {net >= 0 ? '+' : '-'}{fmtBRL(net)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
