import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const submit = async (event) => {
    event.preventDefault();
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <Toast message={error} type="error" onClose={() => setError('')} />
        <h2 className="text-2xl font-bold">Create account</h2>
        <div className="mt-6 space-y-4">
          <FormInput label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormInput label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <FormInput label="Password" type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <Button className="mt-6 w-full" type="submit"><UserPlus size={18} />Register</Button>
        <p className="mt-4 text-center text-sm text-slate-500">Already registered? <Link className="font-semibold text-hospital-teal" to="/login">Login</Link></p>
      </form>
    </div>
  );
}
