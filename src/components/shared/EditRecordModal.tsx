import { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, FileText, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatBRL, parseBRL, PAYMENT_METHODS } from '../../lib/currency';
import UnitCategorySelector, { HierarchySelection } from './UnitCategorySelector';

interface EditRecord {
  id: string;
  type: 'expense' | 'revenue';
  unit_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  value: number;
  observation: string;
  date: string;
  payment_method: string | null;
}

interface Props {
  record: EditRecord;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditRecordModal({ record, onClose, onSaved }: Props) {
  const isExpense = record.type === 'expense';

  const [hierarchy, setHierarchy] = useState<HierarchySelection>({
    unit_id: record.unit_id || '',
    category_id: record.category_id || '',
    subcategory_id: record.subcategory_id || '',
  });
  const [value, setValue] = useState(formatBRL(Number(record.value).toFixed(2).replace('.', ',')));
  const [observation, setObservation] = useState(record.observation || '');
  const [date, setDate] = useState(record.date);
  const [paymentMethod, setPaymentMethod] = useState(record.payment_method || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  async function handleSave() {
    setError('');
    if (!hierarchy.unit_id) { setError('Selecione uma unidade.'); return; }
    const val = parseBRL(value);
    if (!value || val <= 0) { setError('Informe um valor válido maior que zero.'); return; }
    if (!date) { setError('Informe a data.'); return; }

    setSaving(true);
    const table = isExpense ? 'expenses' : 'revenues';
    const { error: err } = await supabase.from(table).update({
      unit_id: hierarchy.unit_id,
      category_id: hierarchy.category_id || null,
      subcategory_id: hierarchy.subcategory_id || null,
      value: val,
      observation: observation.trim(),
      date,
      payment_method: paymentMethod || null,
    }).eq('id', record.id);

    setSaving(false);
    if (err) { setError('Erro ao salvar. Tente novamente.'); return; }

    setSuccess(true);
    setTimeout(() => {
      onSaved();
      onClose();
    }, 800);
  }

  const focusBorder = isExpense ? 'focus:border-red-500/50' : 'focus:border-emerald-500/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className={`h-1 ${isExpense ? 'bg-red-500' : 'bg-emerald-500'}`} />
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">
            Editar {isExpense ? 'Despesa' : 'Receita'}
          </h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-all">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          <UnitCategorySelector
            type={record.type}
            value={hierarchy}
            onChange={setHierarchy}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Valor (R$)
              </label>
              <div className="relative">
                <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  inputMode="decimal"
                  value={value}
                  onChange={e => setValue(formatBRL(e.target.value))}
                  placeholder="0,00"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 ${focusBorder} text-white placeholder-slate-500 rounded-xl text-sm outline-none transition-colors`}
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
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 ${focusBorder} text-white rounded-xl text-sm outline-none transition-colors`}
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
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className={`w-full appearance-none pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 ${focusBorder} text-white rounded-xl text-sm outline-none transition-colors cursor-pointer`}
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
                  value={observation}
                  onChange={e => setObservation(e.target.value)}
                  rows={3}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 ${focusBorder} text-white placeholder-slate-500 rounded-xl text-sm outline-none transition-colors resize-none`}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-sm">
              <CheckCircle size={14} />
              Salvo com sucesso!
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 py-2.5 font-bold text-sm rounded-xl transition-all duration-200 disabled:opacity-50 ${
              isExpense
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/15'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/15'
            }`}
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
