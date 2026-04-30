import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Check, X, Building2, Tag, Layers, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Unit, Category, Subcategory } from '../../lib/types';
import { useAuth } from '../../lib/auth';

const PRESET_COLORS = [
  '#00D4FF', '#00FF88', '#FF6B35', '#FFD700', '#FF4757',
  '#2ED573', '#1E90FF', '#FF6EB4', '#7FDBFF', '#FF8C42',
];

export interface HierarchySelection {
  unit_id: string;
  category_id: string;
  subcategory_id: string;
}

interface Props {
  value: HierarchySelection;
  onChange: (val: HierarchySelection) => void;
  type: 'expense' | 'revenue';
}

interface InlineForm {
  show: boolean;
  name: string;
  color: string;
  saving: boolean;
  editingId: string | null;
}

const emptyForm = (): InlineForm => ({ show: false, name: '', color: '#00D4FF', saving: false, editingId: null });

export default function UnitCategorySelector({ value, onChange, type }: Props) {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [unitForm, setUnitForm] = useState<InlineForm>(emptyForm());
  const [catForm, setCatForm] = useState<InlineForm>(emptyForm());
  const [subForm, setSubForm] = useState<InlineForm>(emptyForm());

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchUnits(); }, []);

  useEffect(() => {
    if (value.unit_id) fetchCategories(value.unit_id);
    else setCategories([]);
  }, [value.unit_id]);

  useEffect(() => {
    if (value.category_id) fetchSubcategories(value.category_id);
    else setSubcategories([]);
  }, [value.category_id]);

  async function fetchUnits() {
    const { data } = await supabase.from('units').select('*').order('name');
    if (data) setUnits(data);
  }

  async function fetchCategories(unitId: string) {
    const { data } = await supabase.from('categories').select('*').eq('unit_id', unitId).eq('type', type).order('name');
    if (data) setCategories(data);
  }

  async function fetchSubcategories(categoryId: string) {
    const { data } = await supabase.from('subcategories').select('*').eq('category_id', categoryId).order('name');
    if (data) setSubcategories(data);
  }

  // --- Unit CRUD ---
  async function saveUnit() {
    if (!unitForm.name.trim()) return;
    setUnitForm(f => ({ ...f, saving: true }));
    if (unitForm.editingId) {
      const { data } = await supabase
        .from('units')
        .update({ name: unitForm.name.trim(), color: unitForm.color })
        .eq('id', unitForm.editingId)
        .select()
        .single();
      if (data) await fetchUnits();
    } else {
      const { data } = await supabase
        .from('units')
        .insert({ name: unitForm.name.trim(), color: unitForm.color, user_id: user?.id })
        .select()
        .single();
      if (data) {
        await fetchUnits();
        onChange({ ...value, unit_id: data.id, category_id: '', subcategory_id: '' });
      }
    }
    setUnitForm(emptyForm());
  }

  async function deleteUnit(id: string) {
    setDeletingId(id);
    await supabase.from('units').delete().eq('id', id);
    if (value.unit_id === id) {
      onChange({ unit_id: '', category_id: '', subcategory_id: '' });
    }
    await fetchUnits();
    setDeletingId(null);
  }

  function startEditUnit(unit: Unit) {
    setUnitForm({ show: true, name: unit.name, color: unit.color, saving: false, editingId: unit.id });
  }

  // --- Category CRUD ---
  async function saveCategory() {
    if (!catForm.name.trim() || !value.unit_id) return;
    setCatForm(f => ({ ...f, saving: true }));
    if (catForm.editingId) {
      const { data } = await supabase
        .from('categories')
        .update({ name: catForm.name.trim() })
        .eq('id', catForm.editingId)
        .select()
        .single();
      if (data) await fetchCategories(value.unit_id);
    } else {
      const { data } = await supabase
        .from('categories')
        .insert({ name: catForm.name.trim(), unit_id: value.unit_id, type, user_id: user?.id })
        .select()
        .single();
      if (data) {
        await fetchCategories(value.unit_id);
        onChange({ ...value, category_id: data.id, subcategory_id: '' });
      }
    }
    setCatForm(emptyForm());
  }

  async function deleteCategory(id: string) {
    setDeletingId(id);
    await supabase.from('categories').delete().eq('id', id);
    if (value.category_id === id) {
      onChange({ ...value, category_id: '', subcategory_id: '' });
    }
    await fetchCategories(value.unit_id);
    setDeletingId(null);
  }

  function startEditCategory(cat: Category) {
    setCatForm({ show: true, name: cat.name, color: '', saving: false, editingId: cat.id });
  }

  // --- Subcategory CRUD ---
  async function saveSubcategory() {
    if (!subForm.name.trim() || !value.category_id) return;
    setSubForm(f => ({ ...f, saving: true }));
    if (subForm.editingId) {
      const { data } = await supabase
        .from('subcategories')
        .update({ name: subForm.name.trim() })
        .eq('id', subForm.editingId)
        .select()
        .single();
      if (data) await fetchSubcategories(value.category_id);
    } else {
      const { data } = await supabase
        .from('subcategories')
        .insert({ name: subForm.name.trim(), category_id: value.category_id, user_id: user?.id })
        .select()
        .single();
      if (data) {
        await fetchSubcategories(value.category_id);
        onChange({ ...value, subcategory_id: data.id });
      }
    }
    setSubForm(emptyForm());
  }

  async function deleteSubcategory(id: string) {
    setDeletingId(id);
    await supabase.from('subcategories').delete().eq('id', id);
    if (value.subcategory_id === id) {
      onChange({ ...value, subcategory_id: '' });
    }
    await fetchSubcategories(value.category_id);
    setDeletingId(null);
  }

  function startEditSubcategory(sub: Subcategory) {
    setSubForm({ show: true, name: sub.name, color: '', saving: false, editingId: sub.id });
  }

  const selectedUnit = units.find(u => u.id === value.unit_id);
  const selectedCat = categories.find(c => c.id === value.category_id);

  return (
    <div className="space-y-4">
      {/* Unit */}
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <Building2 size={12} />
          Unidade
        </label>
        {unitForm.show ? (
          <div className="space-y-2">
            <input
              autoFocus
              type="text"
              value={unitForm.name}
              onChange={e => setUnitForm(f => ({ ...f, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') saveUnit(); if (e.key === 'Escape') setUnitForm(emptyForm()); }}
              placeholder="Nome da unidade..."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-cyan-500/40 text-white placeholder-slate-500 rounded-xl text-sm outline-none"
            />
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setUnitForm(f => ({ ...f, color: c }))}
                  className="w-6 h-6 rounded-md relative hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                >
                  {unitForm.color === c && <Check size={11} className="absolute inset-0 m-auto text-slate-900" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={saveUnit} disabled={unitForm.saving || !unitForm.name.trim()}
                className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                <Check size={12} /> {unitForm.saving ? 'Salvando...' : unitForm.editingId ? 'Atualizar' : 'Criar'}
              </button>
              <button type="button" onClick={() => setUnitForm(emptyForm())}
                className="px-3 py-2 border border-slate-700 text-slate-400 hover:text-white text-xs rounded-lg transition-colors">
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                value={value.unit_id}
                onChange={e => onChange({ unit_id: e.target.value, category_id: '', subcategory_id: '' })}
                className="w-full appearance-none px-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-cyan-500 text-white rounded-xl text-sm outline-none transition-colors cursor-pointer"
              >
                <option value="">Selecione a unidade...</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {selectedUnit && (
              <>
                <button type="button" onClick={() => startEditUnit(selectedUnit)} title="Editar unidade"
                  className="px-3 py-2.5 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors">
                  <Pencil size={15} />
                </button>
                <button type="button" onClick={() => deleteUnit(selectedUnit.id)} disabled={deletingId === selectedUnit.id} title="Excluir unidade"
                  className="px-3 py-2.5 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-xl transition-colors disabled:opacity-40">
                  <Trash2 size={15} />
                </button>
              </>
            )}
            <button type="button" onClick={() => setUnitForm(f => ({ ...f, show: true, editingId: null }))} title="Nova unidade"
              className="px-3 py-2.5 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors">
              <Plus size={15} />
            </button>
          </div>
        )}
        {selectedUnit && !unitForm.show && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedUnit.color }} />
            <span className="text-xs text-slate-500">{selectedUnit.name}</span>
          </div>
        )}
      </div>

      {/* Category */}
      {value.unit_id && (
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <Tag size={12} />
            Categoria
          </label>
          {catForm.show ? (
            <div className="space-y-2">
              <input
                autoFocus
                type="text"
                value={catForm.name}
                onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') saveCategory(); if (e.key === 'Escape') setCatForm(emptyForm()); }}
                placeholder="Nome da categoria..."
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-cyan-500/40 text-white placeholder-slate-500 rounded-xl text-sm outline-none"
              />
              <div className="flex gap-2">
                <button type="button" onClick={saveCategory} disabled={catForm.saving || !catForm.name.trim()}
                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                  <Check size={12} /> {catForm.saving ? 'Salvando...' : catForm.editingId ? 'Atualizar' : 'Criar'}
                </button>
                <button type="button" onClick={() => setCatForm(emptyForm())}
                  className="px-3 py-2 border border-slate-700 text-slate-400 hover:text-white text-xs rounded-lg transition-colors">
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={value.category_id}
                  onChange={e => onChange({ ...value, category_id: e.target.value, subcategory_id: '' })}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-cyan-500 text-white rounded-xl text-sm outline-none transition-colors cursor-pointer"
                >
                  <option value="">Selecione a categoria...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {selectedCat && (
                <>
                  <button type="button" onClick={() => startEditCategory(selectedCat)} title="Editar categoria"
                    className="px-3 py-2.5 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors">
                    <Pencil size={15} />
                  </button>
                  <button type="button" onClick={() => deleteCategory(selectedCat.id)} disabled={deletingId === selectedCat.id} title="Excluir categoria"
                    className="px-3 py-2.5 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-xl transition-colors disabled:opacity-40">
                    <Trash2 size={15} />
                  </button>
                </>
              )}
              <button type="button" onClick={() => setCatForm(f => ({ ...f, show: true, editingId: null }))} title="Nova categoria"
                className="px-3 py-2.5 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors">
                <Plus size={15} />
              </button>
            </div>
          )}
          {selectedCat && !catForm.show && (
            <span className="text-xs text-slate-500 mt-1.5 block">{selectedCat.name}</span>
          )}
        </div>
      )}

      {/* Subcategory */}
      {value.category_id && (
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <Layers size={12} />
            Subcategoria <span className="text-slate-600 normal-case font-normal ml-1">(opcional)</span>
          </label>
          {subForm.show ? (
            <div className="space-y-2">
              <input
                autoFocus
                type="text"
                value={subForm.name}
                onChange={e => setSubForm(f => ({ ...f, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') saveSubcategory(); if (e.key === 'Escape') setSubForm(emptyForm()); }}
                placeholder="Nome da subcategoria..."
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-cyan-500/40 text-white placeholder-slate-500 rounded-xl text-sm outline-none"
              />
              <div className="flex gap-2">
                <button type="button" onClick={saveSubcategory} disabled={subForm.saving || !subForm.name.trim()}
                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                  <Check size={12} /> {subForm.saving ? 'Salvando...' : subForm.editingId ? 'Atualizar' : 'Criar'}
                </button>
                <button type="button" onClick={() => setSubForm(emptyForm())}
                  className="px-3 py-2 border border-slate-700 text-slate-400 hover:text-white text-xs rounded-lg transition-colors">
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={value.subcategory_id}
                  onChange={e => onChange({ ...value, subcategory_id: e.target.value })}
                  className="w-full appearance-none px-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-cyan-500 text-white rounded-xl text-sm outline-none transition-colors cursor-pointer"
                >
                  <option value="">Nenhuma</option>
                  {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {value.subcategory_id && (() => {
                const selectedSub = subcategories.find(s => s.id === value.subcategory_id);
                if (!selectedSub) return null;
                return (
                  <>
                    <button type="button" onClick={() => startEditSubcategory(selectedSub)} title="Editar subcategoria"
                      className="px-3 py-2.5 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors">
                      <Pencil size={15} />
                    </button>
                    <button type="button" onClick={() => deleteSubcategory(selectedSub.id)} disabled={deletingId === selectedSub.id} title="Excluir subcategoria"
                      className="px-3 py-2.5 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 rounded-xl transition-colors disabled:opacity-40">
                      <Trash2 size={15} />
                    </button>
                  </>
                );
              })()}
              <button type="button" onClick={() => setSubForm(f => ({ ...f, show: true, editingId: null }))} title="Nova subcategoria"
                className="px-3 py-2.5 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors">
                <Plus size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
