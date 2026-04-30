import { useState, useEffect } from 'react';
import { Shield, UserPlus, Mail, Lock, AlertCircle, CheckCircle, Loader2, LogOut, Trash2, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface Props {
  onBack: () => void;
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
}

export default function AdminPage({ onBack }: Props) {
  useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const token = await getAccessToken();
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`;
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'list' }),
    });
    const data = await res.json();
    if (data.users) setUsers(data.users);
    setLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) {
      setError('Preencha email e senha.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSaving(true);
    try {
      const token = await getAccessToken();
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'create', email, password }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || `Erro HTTP ${res.status}`);
        setSaving(false);
        return;
      }

      if (!data.success) {
        setError('Resposta inesperada do servidor.');
        setSaving(false);
        return;
      }

      setSuccess(`Usuario ${email} criado com sucesso!`);
      setEmail('');
      setPassword('');
      fetchUsers();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Erro de conexao com o servidor.');
    }
    setSaving(false);
  }

  async function handleDelete(userId: string) {
    if (!confirm('Tem certeza que deseja excluir este usuario? Todos os dados dele serao perdidos.')) return;

    setDeletingId(userId);
    const token = await getAccessToken();
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`;
    await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'delete', userId }),
    });
    setDeletingId(null);
    fetchUsers();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 mb-6 transition-colors"
        >
          <LogOut size={16} />
          Sair
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Shield size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Painel Admin</h1>
            <p className="text-sm text-slate-400">Gerenciar usuarios do sistema</p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-5">
            <UserPlus size={16} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Criar Novo Usuario</h2>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-cyan-500/50 text-white placeholder-slate-500 rounded-xl text-sm outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Senha
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/60 border border-slate-700 focus:border-cyan-500/50 text-white placeholder-slate-500 rounded-xl text-sm outline-none transition-colors"
                />
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
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-cyan-500/15 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus size={14} />
                  Criar Usuario
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Users size={16} className="text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Usuarios Cadastrados</h2>
            <span className="ml-auto text-xs text-slate-500">{users.length} usuarios</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={20} className="animate-spin text-slate-500" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">Nenhum usuario cadastrado</p>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div
                  key={u.id}
                  className="group flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${u.role === 'admin' ? 'bg-amber-500/10' : 'bg-cyan-500/10'}`}>
                      {u.role === 'admin' ? (
                        <Shield size={15} className="text-amber-400" />
                      ) : (
                        <Mail size={15} className="text-cyan-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{u.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700 text-slate-400'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Usuario'}
                        </span>
                        <span className="text-xs text-slate-600">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {u.role !== 'admin' && (
                    <button
                      onClick={() => handleDelete(u.id)}
                      disabled={deletingId === u.id}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
                    >
                      {deletingId === u.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
