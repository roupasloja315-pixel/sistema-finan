import { useState, useEffect, useMemo } from 'react';
import { BarChart2, Filter, Search, X, ChevronDown, ArrowUpDown, GitCompare, Lightbulb, TrendingDown, TrendingUp, Scale, CreditCard, Pencil } from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { Unit } from '../../lib/types';
import InsightsModal from './InsightsModal';
import UnitDetailPanel from './UnitDetailPanel';
import ExportMenu from './ExportMenu';
import EditRecordModal from '../shared/EditRecordModal';

const RED_SHADES = ['#EF4444', '#DC2626', '#F87171', '#B91C1C', '#FCA5A5', '#991B1B'];
const GREEN_SHADES = ['#10B981', '#059669', '#34D399', '#065F46', '#6EE7B7', '#047857'];

interface RawExpense {
  id: string;
  unit_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  value: number;
  observation: string;
  date: string;
  payment_method: string | null;
  units?: { id: string; name: string; color: string } | null;
  categories?: { id: string; name: string } | null;
  subcategories?: { id: string; name: string } | null;
}

interface RawRevenue {
  id: string;
  unit_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  value: number;
  observation: string;
  date: string;
  payment_method: string | null;
  units?: { id: string; name: string; color: string } | null;
  categories?: { id: string; name: string } | null;
  subcategories?: { id: string; name: string } | null;
}

interface Filters {
  startDate: string;
  endDate: string;
  unitId: string;
  search: string;
}

type SortField = 'date' | 'value' | 'unit';
type SortDir = 'asc' | 'desc';

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-white font-semibold text-sm">{payload[0].name}</p>
      <p className="text-cyan-400 text-sm font-bold">R$ {Number(payload[0].value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
      <p className="text-slate-400 text-xs">{payload[0].payload.percent}%</p>
    </div>
  );
};

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: R$ {Number(p.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<RawExpense[]>([]);
  const [revenues, setRevenues] = useState<RawRevenue[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<{ id: string; type: 'expense' | 'revenue'; unit_id: string | null; category_id: string | null; subcategory_id: string | null; value: number; observation: string; date: string; payment_method: string | null } | null>(null);
  const [filters, setFilters] = useState<Filters>({ startDate: '', endDate: '', unitId: '', search: '' });
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const now = new Date();
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const defaultEnd = now.toISOString().split('T')[0];

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const [{ data: expData }, { data: revData }, { data: unitData }] = await Promise.all([
      supabase.from('expenses').select('*, units(id,name,color), categories(id,name), subcategories(id,name)')
        .not('unit_id', 'is', null).order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('revenues').select('*, units(id,name,color), categories(id,name), subcategories(id,name)')
        .order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('units').select('*').order('name'),
    ]);
    if (expData) setExpenses(expData as RawExpense[]);
    if (revData) setRevenues(revData as RawRevenue[]);
    if (unitData) setUnits(unitData);
    setLoading(false);
  }

  const activeStart = filters.startDate || defaultStart;
  const activeEnd = filters.endDate || defaultEnd;

  function applyFilters<T extends { date: string; unit_id: string | null; observation: string; units?: { name: string } | null }>(list: T[]): T[] {
    return list.filter(item => {
      if (item.date < activeStart || item.date > activeEnd) return false;
      if (filters.unitId && item.unit_id !== filters.unitId) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!item.observation?.toLowerCase().includes(q) && !item.units?.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  const filteredExpenses = useMemo(() => applyFilters(expenses), [expenses, filters, activeStart, activeEnd]);
  const filteredRevenues = useMemo(() => applyFilters(revenues), [revenues, filters, activeStart, activeEnd]);

  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.value), 0);
  const totalRevenues = filteredRevenues.reduce((s, r) => s + Number(r.value), 0);
  const netResult = totalRevenues - totalExpenses;
  const margin = totalRevenues > 0 ? (netResult / totalRevenues) * 100 : null;

  const expensesByUnit = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string; count: number }> = {};
    filteredExpenses.forEach(e => {
      const id = e.unit_id || 'unknown';
      const name = e.units?.name || 'Sem unidade';
      const color = e.units?.color || '#64748b';
      if (!map[id]) map[id] = { name, value: 0, color, count: 0 };
      map[id].value += Number(e.value);
      map[id].count++;
    });
    return Object.values(map).map(i => ({ ...i, percent: totalExpenses > 0 ? ((i.value / totalExpenses) * 100).toFixed(1) : '0' })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses, totalExpenses]);

  const revenuesByUnit = useMemo(() => {
    const map: Record<string, { name: string; value: number; color: string; count: number }> = {};
    filteredRevenues.forEach(r => {
      const id = r.unit_id || 'unknown';
      const name = r.units?.name || 'Sem unidade';
      const color = r.units?.color || '#64748b';
      if (!map[id]) map[id] = { name, value: 0, color, count: 0 };
      map[id].value += Number(r.value);
      map[id].count++;
    });
    return Object.values(map).map(i => ({ ...i, percent: totalRevenues > 0 ? ((i.value / totalRevenues) * 100).toFixed(1) : '0' })).sort((a, b) => b.value - a.value);
  }, [filteredRevenues, totalRevenues]);

  const byMonth = useMemo(() => {
    const map: Record<string, { expenses: number; revenues: number }> = {};
    [...filteredExpenses, ...filteredRevenues].forEach(item => {
      const key = item.date.slice(0, 7);
      if (!map[key]) map[key] = { expenses: 0, revenues: 0 };
    });
    filteredExpenses.forEach(e => { const k = e.date.slice(0, 7); if (map[k]) map[k].expenses += Number(e.value); });
    filteredRevenues.forEach(r => { const k = r.date.slice(0, 7); if (map[k]) map[k].revenues += Number(r.value); });
    return Object.entries(map).map(([key, v]) => {
      const [y, m] = key.split('-');
      return { key, label: new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }), ...v };
    }).sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredExpenses, filteredRevenues]);

  const unitComparisonData = useMemo(() => {
    const allUnits = new Set([
      ...filteredExpenses.map(e => e.unit_id),
      ...filteredRevenues.map(r => r.unit_id),
    ].filter(Boolean));

    return Array.from(allUnits).map(uid => {
      const unit = units.find(u => u.id === uid);
      const expTotal = filteredExpenses.filter(e => e.unit_id === uid).reduce((s, e) => s + Number(e.value), 0);
      const revTotal = filteredRevenues.filter(r => r.unit_id === uid).reduce((s, r) => s + Number(r.value), 0);
      return {
        id: uid as string,
        name: unit?.name || 'N/A',
        color: unit?.color || '#64748b',
        expenseTotal: expTotal,
        revenueTotal: revTotal,
        expensePercent: totalExpenses > 0 ? (expTotal / totalExpenses) * 100 : 0,
        revenuePercent: totalRevenues > 0 ? (revTotal / totalRevenues) * 100 : 0,
      };
    });
  }, [filteredExpenses, filteredRevenues, units, totalExpenses, totalRevenues]);

  const topExpenseCategory = useMemo(() => {
    const map: Record<string, { name: string; unitName: string; total: number }> = {};
    filteredExpenses.forEach(e => {
      if (!e.category_id) return;
      const id = e.category_id;
      const name = e.categories?.name || '—';
      const unitName = e.units?.name || '—';
      if (!map[id]) map[id] = { name, unitName, total: 0 };
      map[id].total += Number(e.value);
    });
    const sorted = Object.values(map).sort((a, b) => b.total - a.total);
    if (!sorted[0]) return null;
    return { ...sorted[0], percent: totalExpenses > 0 ? (sorted[0].total / totalExpenses) * 100 : 0 };
  }, [filteredExpenses, totalExpenses]);

  const paymentMethodBreakdown = useMemo(() => {
    const map: Record<string, { expenses: number; revenues: number; expenseCount: number; revenueCount: number }> = {};
    filteredExpenses.forEach(e => {
      const key = e.payment_method || 'Não informado';
      if (!map[key]) map[key] = { expenses: 0, revenues: 0, expenseCount: 0, revenueCount: 0 };
      map[key].expenses += Number(e.value);
      map[key].expenseCount++;
    });
    filteredRevenues.forEach(r => {
      const key = r.payment_method || 'Não informado';
      if (!map[key]) map[key] = { expenses: 0, revenues: 0, expenseCount: 0, revenueCount: 0 };
      map[key].revenues += Number(r.value);
      map[key].revenueCount++;
    });
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data, total: data.expenses + data.revenues }))
      .sort((a, b) => b.total - a.total);
  }, [filteredExpenses, filteredRevenues]);

  const allRecords = useMemo(() => {
    const exp = filteredExpenses.map(e => ({ ...e, type: 'expense' as const }));
    const rev = filteredRevenues.map(r => ({ ...r, type: 'revenue' as const }));
    const all = [...exp, ...rev].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'value') cmp = Number(a.value) - Number(b.value);
      else if (sortField === 'unit') cmp = (a.units?.name || '').localeCompare(b.units?.name || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return all;
  }, [filteredExpenses, filteredRevenues, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  }

  const hasFilters = filters.startDate || filters.endDate || filters.unitId || filters.search;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-2xl bg-slate-800/40 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-2xl bg-slate-800/40 animate-pulse" />
          <div className="h-80 rounded-2xl bg-slate-800/40 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">Visao completa das financas empresariais</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareMode(c => !c)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 border ${
              compareMode
                ? 'bg-slate-700 text-white border-slate-600 shadow-inner'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
            }`}
          >
            <GitCompare size={15} />
            {compareMode ? 'Visao Normal' : 'Comparativo'}
          </button>
          <ExportMenu
            records={allRecords}
            unitSummary={unitComparisonData}
            totalRevenues={totalRevenues}
            totalExpenses={totalExpenses}
            netResult={netResult}
            margin={margin}
            dateRange={{ start: activeStart, end: activeEnd }}
          />
          <button
            onClick={() => setShowInsights(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-sm font-semibold rounded-xl transition-all duration-200"
          >
            <Lightbulb size={15} />
            Ideias de Melhoria
          </button>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={13} className="text-slate-500" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filtros</span>
          {hasFilters && (
            <button onClick={() => setFilters({ startDate: '', endDate: '', unitId: '', search: '' })}
              className="ml-auto flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors">
              <X size={11} /> Limpar
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Data inicial</label>
            <input type="date" value={filters.startDate || defaultStart}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 focus:border-cyan-500 text-white rounded-xl text-xs outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Data final</label>
            <input type="date" value={filters.endDate || defaultEnd}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 focus:border-cyan-500 text-white rounded-xl text-xs outline-none" />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Unidade</label>
            <div className="relative">
              <select value={filters.unitId} onChange={e => setFilters(f => ({ ...f, unitId: e.target.value }))}
                className="w-full appearance-none px-3 py-2 bg-slate-800/60 border border-slate-700 focus:border-cyan-500 text-white rounded-xl text-xs outline-none cursor-pointer">
                <option value="">Todas</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Buscar</label>
            <div className="relative">
              <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                placeholder="Unidade, observacao..."
                className="w-full pl-8 pr-3 py-2 bg-slate-800/60 border border-slate-700 focus:border-cyan-500 text-white placeholder-slate-600 rounded-xl text-xs outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-emerald-400/10 bg-emerald-400/5 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-slate-400">Total Receitas</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center">
              <TrendingUp size={14} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-400">R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-500 mt-1">{filteredRevenues.length} lancamentos</p>
        </div>
        <div className="rounded-2xl border border-red-400/10 bg-red-400/5 p-5">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-slate-400">Total Despesas</p>
            <div className="w-8 h-8 rounded-lg bg-red-400/10 flex items-center justify-center">
              <TrendingDown size={14} className="text-red-400" />
            </div>
          </div>
          <p className="text-xl font-bold text-red-400">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <p className="text-xs text-slate-500 mt-1">{filteredExpenses.length} lancamentos</p>
        </div>
        <div className={`rounded-2xl border p-5 ${netResult >= 0 ? 'border-cyan-400/10 bg-cyan-400/5' : 'border-red-400/10 bg-red-400/5'}`}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-slate-400">Resultado Liquido</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${netResult >= 0 ? 'bg-cyan-400/10' : 'bg-red-400/10'}`}>
              <Scale size={14} className={netResult >= 0 ? 'text-cyan-400' : 'text-red-400'} />
            </div>
          </div>
          <p className={`text-xl font-bold ${netResult >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
            {netResult >= 0 ? '+' : ''}R$ {Math.abs(netResult).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">{netResult >= 0 ? 'Superavit' : 'Deficit'}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${margin !== null && margin >= 20 ? 'border-emerald-400/10 bg-emerald-400/5' : 'border-amber-400/10 bg-amber-400/5'}`}>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-medium text-slate-400">Margem</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${margin !== null && margin >= 20 ? 'bg-emerald-400/10' : 'bg-amber-400/10'}`}>
              <BarChart2 size={14} className={margin !== null && margin >= 20 ? 'text-emerald-400' : 'text-amber-400'} />
            </div>
          </div>
          <p className={`text-xl font-bold ${margin !== null && margin >= 20 ? 'text-emerald-400' : 'text-amber-400'}`}>
            {margin !== null ? `${margin.toFixed(1)}%` : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">{margin !== null ? (margin >= 20 ? 'Saudavel' : 'Atencao') : 'Sem receitas'}</p>
        </div>
      </div>

      {unitComparisonData.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={13} className="text-cyan-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Analise por Unidade</span>
            <span className="text-xs text-slate-600 ml-1">— clique para ver categorias em detalhe</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {unitComparisonData.map((unit) => {
              const result = unit.revenueTotal - unit.expenseTotal;
              const isPositive = result >= 0;
              const m = unit.revenueTotal > 0 ? (result / unit.revenueTotal) * 100 : null;
              return (
                <button
                  key={unit.id}
                  onClick={() => setSelectedUnitId(unit.id)}
                  className="group text-left bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/40 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-cyan-500/5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: unit.color }} />
                    <span className="text-xs font-bold text-white truncate">{unit.name}</span>
                    <span className={`ml-auto text-xs font-bold flex-shrink-0 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}{m !== null ? `${m.toFixed(0)}%` : '—'}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Receita</span>
                      <span className="text-emerald-400 font-semibold">R$ {unit.revenueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Despesa</span>
                      <span className="text-red-400 font-semibold">R$ {unit.expenseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-1.5 flex justify-between text-xs">
                      <span className="text-slate-500">Resultado</span>
                      <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? '+' : '-'}R$ {Math.abs(result).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-cyan-500/60 group-hover:text-cyan-400 transition-colors text-center font-medium">
                    Ver categorias →
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {compareMode ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-slate-800">
          <div className="bg-emerald-950/20 border-r border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingUp size={16} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Receitas</h3>
              <span className="ml-auto text-lg font-bold text-emerald-300">
                R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {revenuesByUnit.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Sem receitas no periodo</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={revenuesByUnit} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {revenuesByUnit.map((_, i) => <Cell key={i} fill={GREEN_SHADES[i % GREEN_SHADES.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {revenuesByUnit.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: GREEN_SHADES[i % GREEN_SHADES.length] }} />
                        <span className="text-xs text-slate-400 truncate max-w-[110px]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{item.percent}%</span>
                        <span className="text-xs font-bold text-emerald-300">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="bg-red-950/30 p-6">
            <div className="flex items-center gap-2 mb-5">
              <TrendingDown size={16} className="text-red-400" />
              <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Despesas</h3>
              <span className="ml-auto text-lg font-bold text-red-300">
                R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {expensesByUnit.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-600 text-sm">Sem despesas no periodo</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={expensesByUnit} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                      {expensesByUnit.map((_, i) => <Cell key={i} fill={RED_SHADES[i % RED_SHADES.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {expensesByUnit.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RED_SHADES[i % RED_SHADES.length] }} />
                        <span className="text-xs text-slate-400 truncate max-w-[110px]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">{item.percent}%</span>
                        <span className="text-xs font-bold text-red-300">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-5">Receitas por Unidade</h3>
            {revenuesByUnit.length === 0 ? (
              <div className="flex items-center justify-center h-60 text-slate-600 text-sm">Sem dados no periodo</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={revenuesByUnit} cx="50%" cy="50%" innerRadius={50} outerRadius={82} paddingAngle={3} dataKey="value">
                      {revenuesByUnit.map((_, i) => <Cell key={i} fill={GREEN_SHADES[i % GREEN_SHADES.length]} stroke="transparent" />)}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {revenuesByUnit.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: GREEN_SHADES[i % GREEN_SHADES.length] }} />
                        <span className="text-xs text-slate-400 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">{item.percent}%</span>
                        <span className="text-xs font-semibold text-white">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-5">Evolucao Mensal</h3>
            {byMonth.length === 0 ? (
              <div className="flex items-center justify-center h-60 text-slate-600 text-sm">Sem dados no periodo</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byMonth} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A40" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} width={50} />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#0D1221' }} />
                  <Bar dataKey="revenues" name="Receitas" fill="#34D399" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expenses" name="Despesas" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {unitComparisonData.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-slate-300">Resultado por Unidade</h3>
            <span className="text-xs text-slate-600">Clique em uma unidade para detalhar</span>
          </div>
          <div className="space-y-4">
            {unitComparisonData.map((unit, i) => {
              const result = unit.revenueTotal - unit.expenseTotal;
              const isPositive = result >= 0;
              return (
                <div key={i}
                  className="space-y-1.5 p-3 rounded-xl cursor-pointer hover:bg-slate-800/40 transition-colors border border-transparent hover:border-slate-700/50"
                  onClick={() => setSelectedUnitId(unit.id)}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: unit.color }} />
                      <span className="font-semibold text-white">{unit.name}</span>
                    </div>
                    <span className={`font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isPositive ? '+' : ''}R$ {Math.abs(result).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex gap-1 h-2">
                    <div className="flex-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400/70 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(unit.revenuePercent, 100)}%` }} />
                    </div>
                    <div className="flex-1 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-red-400/70 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(unit.expensePercent, 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span className="text-emerald-400/70">Rec: R$ {unit.revenueTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className="text-red-400/70">Desp: R$ {unit.expenseTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {paymentMethodBreakdown.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={13} className="text-cyan-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Formas de Pagamento</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paymentMethodBreakdown.map((item) => (
              <div key={item.name} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-white">{item.name}</span>
                  <CreditCard size={13} className="text-slate-500" />
                </div>
                <div className="space-y-1.5">
                  {item.revenues > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Receitas ({item.revenueCount})</span>
                      <span className="text-emerald-400 font-semibold">R$ {item.revenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                  {item.expenses > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Despesas ({item.expenseCount})</span>
                      <span className="text-red-400 font-semibold">R$ {item.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">Lancamentos Detalhados</h3>
          <span className="text-xs text-slate-500">{allRecords.length} registros</span>
        </div>
        {allRecords.length === 0 ? (
          <div className="flex items-center justify-center py-14 text-slate-600 text-sm">
            Nenhum lancamento encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="text-left px-6 py-3">
                    <button onClick={() => toggleSort('date')} className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors">
                      Data <ArrowUpDown size={11} className={sortField === 'date' ? 'text-cyan-400' : ''} />
                    </button>
                  </th>
                  <th className="text-left px-6 py-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</span>
                  </th>
                  <th className="text-left px-6 py-3">
                    <button onClick={() => toggleSort('unit')} className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors">
                      Unidade <ArrowUpDown size={11} className={sortField === 'unit' ? 'text-cyan-400' : ''} />
                    </button>
                  </th>
                  <th className="text-left px-6 py-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Descricao</span>
                  </th>
                  <th className="text-left px-6 py-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pagamento</span>
                  </th>
                  <th className="text-right px-6 py-3">
                    <button onClick={() => toggleSort('value')} className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-300 transition-colors ml-auto">
                      Valor <ArrowUpDown size={11} className={sortField === 'value' ? 'text-cyan-400' : ''} />
                    </button>
                  </th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {allRecords.map((record, i) => (
                  <tr key={record.id} className={`border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-900/20'}`}>
                    <td className="px-6 py-3.5">
                      <span className="text-sm text-slate-300">{new Date(record.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${record.type === 'expense' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {record.type === 'expense' ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                        {record.type === 'expense' ? 'Despesa' : 'Receita'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        {record.units?.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: record.units.color }} />}
                        <span className="text-sm text-slate-300">{record.units?.name || '—'}</span>
                        {record.categories?.name && <span className="text-xs text-slate-500">/ {record.categories.name}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-xs text-slate-500 max-w-xs truncate block">{record.observation || '—'}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      {record.payment_method ? (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                          <CreditCard size={10} />
                          {record.payment_method}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className={`text-sm font-bold ${record.type === 'expense' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {record.type === 'expense' ? '- ' : '+ '}R$ {Number(record.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <button
                        onClick={() => setEditingRecord({
                          id: record.id,
                          type: record.type,
                          unit_id: record.unit_id,
                          category_id: record.category_id,
                          subcategory_id: record.subcategory_id,
                          value: Number(record.value),
                          observation: record.observation || '',
                          date: record.date,
                          payment_method: (record as any).payment_method || null,
                        })}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all"
                      >
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-700">
                  <td colSpan={5} className="px-6 py-4 text-sm font-semibold text-slate-400">Resultado do periodo</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-base font-bold ${netResult >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {netResult >= 0 ? '+' : ''}R$ {Math.abs(netResult).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-3 py-4" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {selectedUnitId && (() => {
        const u = units.find(u => u.id === selectedUnitId);
        if (!u) return null;
        const rawExp = filteredExpenses.map(e => ({ ...e }));
        const rawRev = filteredRevenues.map(r => ({ ...r }));
        return (
          <UnitDetailPanel
            unitId={selectedUnitId}
            unitName={u.name}
            unitColor={u.color}
            expenses={rawExp}
            revenues={rawRev}
            onClose={() => setSelectedUnitId(null)}
          />
        );
      })()}

      {showInsights && (
        <InsightsModal
          onClose={() => setShowInsights(false)}
          totalExpenses={totalExpenses}
          totalRevenues={totalRevenues}
          topExpenseUnit={unitComparisonData.sort((a, b) => b.expenseTotal - a.expenseTotal)[0] || null}
          topRevenueUnit={unitComparisonData.sort((a, b) => b.revenueTotal - a.revenueTotal)[0] || null}
          topExpenseCategory={topExpenseCategory}
          unitData={unitComparisonData}
          expenseCount={filteredExpenses.length}
          revenueCount={filteredRevenues.length}
        />
      )}

      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onClose={() => setEditingRecord(null)}
          onSaved={fetchData}
        />
      )}
    </div>
  );
}
