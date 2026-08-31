import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  return (
    <Card>
      <h2 className="text-lg font-bold">Settings</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-slate-200 p-4"><p className="text-sm text-slate-500">Name</p><p className="font-bold">{user?.name}</p></div>
        <div className="rounded-md border border-slate-200 p-4"><p className="text-sm text-slate-500">Email</p><p className="font-bold">{user?.email}</p></div>
        <div className="rounded-md border border-slate-200 p-4"><p className="text-sm text-slate-500">Role</p><p className="font-bold">{user?.role}</p></div>
      </div>
      <p className="mt-6 text-sm text-slate-500">Admin and staff accounts are managed through registration and seeded demo users for this mini project.</p>
    </Card>
  );
}
