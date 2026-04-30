import { useState, useEffect } from 'react';
import { DollarSign, Calendar, FileText, AlertCircle, CheckCircle, Trash2, Clock, CreditCard, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Expense } from '../../lib/types';
import { formatBRL, parseBRL, PAYMENT_METHODS } from '../../lib/currency';
import UnitCategorySelector, { HierarchySelection } from '../shared/UnitCategorySelector';
import EditRecordModal from '../shared/EditRecordModal';
import { useAuth } from '../../lib/auth';

interface FormState {
  hierarchy: HierarchySelection;
  value: string;
  observation: string;
  date: string;
  paymentMethod: string;
}

interface RecentExpense extends Expense {
  units?: { name: string; color: string };
  categories?: { name: string };
  subcategories?: { name: string };
}

export default function LaunchExpensePage() {
  const { user } = useAuth();
  const [recent, setRecent] = useState<RecentExpense[]>([]);
  const [form, setForm] = useState<FormState>({
    hierarchy: { unit_id: '', category_id: '', subcategory_id: '' },
    value: '',
    observation: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<RecentExpense | null>(null);

  useEffect(() => { fetchRecent(); }, []);

  async function fetchRecent() {
    const { data } = await supabase
      .from('expenses')
      .select('*, units(name, color), categories(name), subcategories(name)')
      .not('unit_id', 'is', null)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setRecent(data as RecentExpense[]);
  }

  async function handleSubmit() {
    setError('');
    if (!form.hierarchy.unit_id) { setError('Selecione uma unidade.'); return; }
    const val = parseBRL(form.value);
    if (!form.value || val <= 0) { setError('Informe um valor válido maior que zero.'); return; }
    if (!form.date) { setError('Informe a data da despesa.'); return; }

    setSaving(true);
    const { error: err } = await supabase.from('expenses').insert({
      user_id: user?.id,
      unit_id: form.hierarchy.unit_id,
      category_id: form.hierarchy.category_id || null,
      subcategory_id: form.hierarchy.subcategory_id || null,
      value: val,
      observation: form.observation.trim(),
      date: form.date,
      payment_method: form.paymentMethod || null,
    });

    setSaving(false);
    if (err) { setError('Erro ao lançar despesa. Tente novamente.'); return; }

    setSuccess(true);
    setForm({
      hierarchy: { unit_id: '', category_id: '', subcategory_id: '' },
      value: '',
      observation: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: '',
    });
    fetchRecent();
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await supabase.from('expenses').delete().eq('id', id);
    setDeletingId(null);
    fetchRecent();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <DollarSign size={16} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Lançar Despesa</h2>
        </div>
        <p className="text-slate-400 text-sm ml-11">Registre um novo gasto empresarial</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8">
        <UnitCategorySelector
          type="expense"
          value={form.hierarchy}
          onChange={hierarchy => setForm(f => ({ ...f, hierarchy }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Valor (R$)
            </label>
            <div className="relative">
              <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                inputMode="decimal"
                value={form.value}
                onChange={e => setForm(f => ({ ...f, value: formatBRL(e.target.value) }))}
                placeholder="0,00"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-red-500/50 text-white placeholder-slate-500 rounded-xl text-sm outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Data
            </label>
            <div className="relative">
              <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-red-500/50 text-white rounded-xl text-sm outline-none transition-colors"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Forma de Pagamento <span className="text-slate-600 normal-case font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <CreditCard size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={form.paymentMethod}
                onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
                className="w-full appearance-none pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-red-500/50 text-white rounded-xl text-sm outline-none transition-colors cursor-pointer"
              >
                <option value="">Selecionar forma de pagamento...</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Descrição <span className="text-slate-600 normal-case font-normal">(opcional)</span>
            </label>
            <div className="relative">
              <FileText size={15} className="absolute left-3.5 top-3.5 text-slate-500" />
              <textarea
                value={form.observation}
                onChange={e => setForm(f => ({ ...f, observation: e.target.value }))}
                placeholder="Detalhes adicionais sobre esta despesa..."
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-red-500/50 text-white placeholder-slate-500 rounded-xl text-sm outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 mt-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
            <CheckCircle size={14} />
            Despesa lançada com sucesso!
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full mt-5 py-3.5 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-red-500/15 hover:shadow-red-500/30"
        >
          {saving ? 'Registrando...' : 'Lançar Despesa'}
        </button>
      </div>

      {recent.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-slate-500" />
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lançamentos Recentes</h3>
          </div>
          <div className="space-y-2">
            {recent.map((expense) => (
              <div
                key={expense.id}
                className="group flex items-center justify-between p-4 rounded-xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: (expense.units?.color || '#00D4FF') + '22' }}
                  >
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: expense.units?.color || '#00D4FF' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-semibold text-white">{expense.units?.name || '—'}</span>
                      {expense.categories?.name && (
                        <>
                          <span className="text-slate-600">/</span>
                          <span className="text-xs text-slate-400">{expense.categories.name}</span>
                        </>
                      )}
                      {expense.subcategories?.name && (
                        <>
                          <span className="text-slate-600">/</span>
                          <span className="text-xs text-slate-500">{expense.subcategories.name}</span>
                        </>
                      )}
                      <span className="text-xs text-slate-600 ml-1">
                        {new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {expense.payment_method && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                          <CreditCard size={10} />
                          {expense.payment_method}
                        </span>
                      )}
                      {expense.observation && (
                        <p className="text-xs text-slate-500 truncate max-w-xs">{expense.observation}</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className="text-sm font-bold text-red-400 whitespace-nowrap">
                    - R$ {Number(expense.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <button
                    onClick={() => setEditingRecord(expense)}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 transition-all"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={deletingId === expense.id}
                    className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editingRecord && (
        <EditRecordModal
          record={{
            id: editingRecord.id,
            type: 'expense',
            unit_id: editingRecord.unit_id || null,
            category_id: editingRecord.category_id || null,
            subcategory_id: editingRecord.subcategory_id || null,
            value: editingRecord.value,
            observation: editingRecord.observation,
            date: editingRecord.date,
            payment_method: editingRecord.payment_method || null,
          }}
          onClose={() => setEditingRecord(null)}
          onSaved={fetchRecent}
        />
      )}
    </div>
  );
}
