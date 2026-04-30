import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Check, X, Building2, Tag, Layers } from 'lucide-react';
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

interface InlineCreate {
  show: boolean;
  name: string;
  color: string;
  saving: boolean;
}

const emptyInline = (): InlineCreate => ({ show: false, name: '', color: '#00D4FF', saving: false });

export default function UnitCategorySelector({ value, onChange, type }: Props) {
  const { user } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [newUnit, setNewUnit] = useState<InlineCreate>(emptyInline());
  const [newCat, setNewCat] = useState<InlineCreate>(emptyInline());
  const [newSub, setNewSub] = useState<InlineCreate>(emptyInline());

  useEffect(() => {
    fetchUnits();
  }, []);

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

  async function createUnit() {
    if (!newUnit.name.trim()) return;
    setNewUnit(u => ({ ...u, saving: true }));
    const { data } = await supabase
      .from('units')
      .insert({ name: newUnit.name.trim(), color: newUnit.color, user_id: user?.id })
      .select()
      .single();
    if (data) {
      await fetchUnits();
      onChange({ ...value, unit_id: data.id, category_id: '', subcategory_id: '' });
    }
    setNewUnit(emptyInline());
  }

  async function createCategory() {
    if (!newCat.name.trim() || !value.unit_id) return;
    setNewCat(c => ({ ...c, saving: true }));
    const { data } = await supabase
      .from('categories')
      .insert({ name: newCat.name.trim(), unit_id: value.unit_id, type, user_id: user?.id })
      .select()
      .single();
    if (data) {
      await fetchCategories(value.unit_id);
      onChange({ ...value, category_id: data.id, subcategory_id: '' });
    }
    setNewCat(emptyInline());
  }

  async function createSubcategory() {
    if (!newSub.name.trim() || !value.category_id) return;
    setNewSub(s => ({ ...s, saving: true }));
    const { data } = await supabase
      .from('subcategories')
      .insert({ name: newSub.name.trim(), category_id: value.category_id, user_id: user?.id })
      .select()
      .single();
    if (data) {
      await fetchSubcategories(value.category_id);
      onChange({ ...value, subcategory_id: data.id });
    }
    setNewSub(emptyInline());
  }

  const selectedUnit = units.find(u => u.id === value.unit_id);
  const selectedCat = categories.find(c => c.id === value.category_id);

  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <Building2 size={12} />
          Unidade
        </label>
        {newUnit.show ? (
          <div className="space-y-2">
            <input
              autoFocus
              type="text"
              value={newUnit.name}
              onChange={e => setNewUnit(u => ({ ...u, name: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter') createUnit(); if (e.key === 'Escape') setNewUnit(emptyInline()); }}
              placeholder="Nome da nova unidade..."
              className="w-full px-4 py-2.5 bg-slate-800/60 border border-cyan-500/40 text-white placeholder-slate-500 rounded-xl text-sm outline-none"
            />
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewUnit(u => ({ ...u, color: c }))}
                  className="w-6 h-6 rounded-md relative hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }}
                >
                  {newUnit.color === c && <Check size={11} className="absolute inset-0 m-auto text-slate-900" />}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={createUnit} disabled={newUnit.saving || !newUnit.name.trim()}
                className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                <Check size={12} /> {newUnit.saving ? 'Criando...' : 'Criar'}
              </button>
              <button type="button" onClick={() => setNewUnit(emptyInline())}
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
            <button type="button" onClick={() => setNewUnit(u => ({ ...u, show: true }))}
              className="px-3 py-2.5 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors">
              <Plus size={15} />
            </button>
          </div>
        )}
        {selectedUnit && !newUnit.show && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedUnit.color }} />
            <span className="text-xs text-slate-500">{selectedUnit.name}</span>
          </div>
        )}
      </div>

      {value.unit_id && (
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <Tag size={12} />
            Categoria
          </label>
          {newCat.show ? (
            <div className="space-y-2">
              <input
                autoFocus
                type="text"
                value={newCat.name}
                onChange={e => setNewCat(c => ({ ...c, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') createCategory(); if (e.key === 'Escape') setNewCat(emptyInline()); }}
                placeholder="Nome da nova categoria..."
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-cyan-500/40 text-white placeholder-slate-500 rounded-xl text-sm outline-none"
              />
              <div className="flex gap-2">
                <button type="button" onClick={createCategory} disabled={newCat.saving || !newCat.name.trim()}
                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                  <Check size={12} /> {newCat.saving ? 'Criando...' : 'Criar'}
                </button>
                <button type="button" onClick={() => setNewCat(emptyInline())}
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
              <button type="button" onClick={() => setNewCat(c => ({ ...c, show: true }))}
                className="px-3 py-2.5 border border-slate-700 hover:border-cyan-500/50 text-slate-400 hover:text-cyan-400 rounded-xl transition-colors">
                <Plus size={15} />
              </button>
            </div>
          )}
          {selectedCat && !newCat.show && (
            <span className="text-xs text-slate-500 mt-1.5 block">{selectedCat.name}</span>
          )}
        </div>
      )}

      {value.category_id && (
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <Layers size={12} />
            Subcategoria <span className="text-slate-600 normal-case font-normal ml-1">(opcional)</span>
          </label>
          {newSub.show ? (
            <div className="space-y-2">
              <input
                autoFocus
                type="text"
                value={newSub.name}
                onChange={e => setNewSub(s => ({ ...s, name: e.target.value }))}
                onKeyDown={e => { if (e.key === 'Enter') createSubcategory(); if (e.key === 'Escape') setNewSub(emptyInline()); }}
                placeholder="Nome da nova subcategoria..."
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-cyan-500/40 text-white placeholder-slate-500 rounded-xl text-sm outline-none"
              />
              <div className="flex gap-2">
                <button type="button" onClick={createSubcategory} disabled={newSub.saving || !newSub.name.trim()}
                  className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1">
                  <Check size={12} /> {newSub.saving ? 'Criando...' : 'Criar'}
                </button>
                <button type="button" onClick={() => setNewSub(emptyInline())}
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
              <button type="button" onClick={() => setNewSub(s => ({ ...s, show: true }))}
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
