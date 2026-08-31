import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'admin@hospital.com', password: 'Admin@123' });
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden bg-hospital-ink p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="font-bold text-hospital-mint">CareFlow</p>
          <h1 className="mt-8 max-w-xl text-5xl font-bold leading-tight">Hospital Patient Flow Optimization System</h1>
          <p className="mt-5 max-w-lg text-slate-200">Real-time bed availability, admissions, transfers, discharges, waiting queue alerts, and operational reports.</p>
        </div>
        <p className="text-sm text-slate-300">Demo: admin@hospital.com / Admin@123</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <Toast message={error} type="error" onClose={() => setError('')} />
          <h2 className="text-2xl font-bold">Sign in</h2>
          <p className="mt-2 text-sm text-slate-500">Access the hospital operations dashboard.</p>
          <div className="mt-6 space-y-4">
            <FormInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <FormInput label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <Button className="mt-6 w-full" type="submit"><LogIn size={18} />Login</Button>
          <p className="mt-4 text-center text-sm text-slate-500">No account? <Link className="font-semibold text-hospital-teal" to="/register">Register</Link></p>
        </form>
      </section>
    </div>
  );
}
