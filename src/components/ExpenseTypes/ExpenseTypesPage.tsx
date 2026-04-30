import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Tag, AlertCircle, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ExpenseType } from '../../lib/types';

const PRESET_COLORS = [
  '#00D4FF', '#00FF88', '#FF6B35', '#FFD700', '#FF4757',
  '#2ED573', '#1E90FF', '#FF6EB4', '#A8E6CF', '#FF8C42',
  '#7FDBFF', '#01FF70', '#FFDC00', '#FF4136', '#B10DC9',
];

interface FormState {
  name: string;
  color: string;
}

export default function ExpenseTypesPage() {
  const [types, setTypes] = useState<ExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExpenseType | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', color: '#00D4FF' });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTypes();
  }, []);

  async function fetchTypes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('expense_types')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setTypes(data);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: '', color: '#00D4FF' });
    setError('');
    setShowForm(true);
  }

  function openEdit(type: ExpenseType) {
    setEditing(type);
    setForm({ name: type.name, color: type.color });
    setError('');
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError('O nome da categoria é obrigatório.');
      return;
    }
    setSaving(true);
    setError('');
    if (editing) {
      const { error } = await supabase
        .from('expense_types')
        .update({ name: form.name.trim(), color: form.color })
        .eq('id', editing.id);
      if (error) { setError('Erro ao atualizar categoria.'); setSaving(false); return; }
    } else {
      const { error } = await supabase
        .from('expense_types')
        .insert({ name: form.name.trim(), color: form.color });
      if (error) { setError('Erro ao criar categoria.'); setSaving(false); return; }
    }
    setSaving(false);
    setShowForm(false);
    fetchTypes();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await supabase.from('expense_types').delete().eq('id', id);
    setDeletingId(null);
    fetchTypes();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Categorias de Despesa</h2>
          <p className="text-slate-400 text-sm mt-1">Crie e gerencie seus tipos de despesas</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
        >
          <Plus size={16} />
          Nova Categoria
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-800/40 animate-pulse" />
          ))}
        </div>
      ) : types.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mb-4">
            <Tag size={28} className="text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">Nenhuma categoria criada</p>
          <p className="text-slate-600 text-sm mt-1">Clique em "Nova Categoria" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {types.map((type) => (
            <div
              key={type.id}
              className="group flex items-center justify-between p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: type.color + '22', border: `1.5px solid ${type.color}44` }}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: type.color }} />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">{type.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{type.color}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(type)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10 transition-colors"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(type.id)}
                  disabled={deletingId === type.id}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">
                {editing ? 'Editar Categoria' : 'Nova Categoria'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Aluguel, Salários, Marketing..."
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 focus:border-cyan-500 text-white placeholder-slate-500 rounded-xl text-sm outline-none transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Cor de Identificação
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setForm({ ...form, color: c })}
                      className="w-8 h-8 rounded-lg transition-transform hover:scale-110 relative"
                      style={{ backgroundColor: c }}
                    >
                      {form.color === c && (
                        <Check size={14} className="absolute inset-0 m-auto text-slate-900" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-10 h-10 rounded-lg border border-slate-700 cursor-pointer bg-slate-800"
                  />
                  <span className="text-sm text-slate-400">Personalizada: <span className="text-white font-mono">{form.color}</span></span>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 text-sm font-bold transition-colors"
                >
                  {saving ? 'Salvando...' : editing ? 'Atualizar' : 'Criar Categoria'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
