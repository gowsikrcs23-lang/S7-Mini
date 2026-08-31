import { Edit, Search, ShieldCheck, Trash2, UserPlus, UsersRound, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import SelectInput from '../components/SelectInput';
import Toast from '../components/Toast';
import api from '../services/api';
import { formatDate } from '../utils/format';

const emptyForm = { name: '', email: '', password: '', role: 'Staff' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await api.get('/users');
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    load().catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query));
  }, [search, users]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      if (editing) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editing}`, payload);
      } else {
        await api.post('/users', form);
      }
      setForm(emptyForm);
      setEditing(null);
      setToast(editing ? 'User updated' : 'User created');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (user) => {
    setEditing(user._id);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const remove = async (user) => {
    if (!confirm(`Delete ${user.name}'s account?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      setToast('User deleted');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const adminCount = users.filter((user) => user.role === 'Admin').length;
  const staffCount = users.filter((user) => user.role === 'Staff').length;

  return (
    <div className="space-y-6">
      <Toast message={toast || error} type={error ? 'error' : 'success'} onClose={() => { setToast(''); setError(''); }} />

      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-hospital-teal">Administration</p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">User Management</h2>
        <p className="mt-1 text-sm text-slate-500">Manage staff access and administrator accounts for CareFlow.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="flex items-center gap-4"><div className="rounded-lg bg-hospital-mint p-3 text-hospital-teal"><UsersRound size={22} /></div><div><p className="text-2xl font-bold">{users.length}</p><p className="text-sm text-slate-500">Total users</p></div></Card>
        <Card className="flex items-center gap-4"><div className="rounded-lg bg-blue-50 p-3 text-blue-600"><ShieldCheck size={22} /></div><div><p className="text-2xl font-bold">{adminCount}</p><p className="text-sm text-slate-500">Administrators</p></div></Card>
        <Card className="flex items-center gap-4"><div className="rounded-lg bg-amber-50 p-3 text-amber-600"><UsersRound size={22} /></div><div><p className="text-2xl font-bold">{staffCount}</p><p className="text-sm text-slate-500">Staff members</p></div></Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-3"><div><h3 className="text-lg font-bold">{editing ? 'Edit user' : 'Add new user'}</h3><p className="mt-1 text-sm text-slate-500">{editing ? 'Update account details. Leave password blank to keep it unchanged.' : 'Create a secure account for a hospital team member.'}</p></div>{editing && <button type="button" aria-label="Cancel editing" onClick={cancelEdit} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>}</div>
        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-4">
          <FormInput label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <FormInput label={editing ? 'New password (optional)' : 'Password'} type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} />
          <SelectInput label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option>Staff</option><option>Admin</option></SelectInput>
          <div className="flex items-end gap-2 md:col-span-4"><Button type="submit"><UserPlus size={16} />{editing ? 'Save changes' : 'Create user'}</Button>{editing && <Button type="button" variant="secondary" onClick={cancelEdit}>Cancel</Button>}</div>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h3 className="text-lg font-bold">All users</h3><p className="text-sm text-slate-500">{filteredUsers.length} account{filteredUsers.length === 1 ? '' : 's'} shown</p></div><div className="flex items-center gap-2 rounded-md border border-slate-200 px-3"><Search size={16} className="text-slate-400" /><input className="w-full py-2 text-sm outline-none md:w-56" placeholder="Search users" value={search} onChange={(e) => setSearch(e.target.value)} /></div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>{filteredUsers.map((user) => <tr key={user._id} className="border-t border-slate-100"><td className="p-3"><p className="font-semibold">{user.name}</p><p className="text-xs text-slate-400">ID: {user._id.slice(-8)}</p></td><td>{user.email}</td><td><Badge>{user.role}</Badge></td><td>{formatDate(user.createdAt)}</td><td><div className="flex gap-3"><button type="button" aria-label={`Edit ${user.name}`} title="Edit user" onClick={() => edit(user)} className="text-blue-600"><Edit size={17} /></button><button type="button" aria-label={`Delete ${user.name}`} title="Delete user" onClick={() => remove(user)} className="text-rose-600"><Trash2 size={17} /></button></div></td></tr>)}</tbody>
          </table>
          {!loading && !filteredUsers.length && <p className="p-6 text-center text-slate-500">No users match your search.</p>}
          {loading && <p className="p-6 text-center text-slate-500">Loading users...</p>}
        </div>
      </Card>
    </div>
  );
}
