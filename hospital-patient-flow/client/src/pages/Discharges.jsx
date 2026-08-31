import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import SelectInput from '../components/SelectInput';
import Toast from '../components/Toast';
import api from '../services/api';
import { formatDateTime } from '../utils/format';

const doctors = ['Manoj', 'Natish', 'Kavin Kumar', 'Abinaya', 'Iyal'];

export default function Discharges() {
  const [admissions, setAdmissions] = useState([]);
  const [discharges, setDischarges] = useState([]);
  const [form, setForm] = useState({ patient: '', doctor: '', dischargeSummary: '', notes: '', dischargeDate: new Date().toISOString().slice(0, 16) });
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [admissionsRes, dischargesRes] = await Promise.all([api.get('/admissions'), api.get('/discharges')]);
    const active = admissionsRes.data.filter((item) => item.status !== 'Discharged');
    setAdmissions(active);
    setDischarges(dischargesRes.data);
    setForm((current) => ({ ...current, patient: current.patient || active[0]?.patient?._id || '' }));
  };

  useEffect(() => { load().catch((err) => setError(err.message)); }, []);
  const currentAdmission = admissions.find((item) => item.patient?._id === form.patient);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/discharges', form);
      setToast('Patient discharged and bed moved to Cleaning');
      setForm({ patient: '', doctor: '', dischargeSummary: '', notes: '', dischargeDate: new Date().toISOString().slice(0, 16) });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Toast message={toast || error} type={error ? 'error' : 'success'} onClose={() => { setToast(''); setError(''); }} />
      <Card>
        <h2 className="text-lg font-bold">Discharge Workflow</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-3">
          <SelectInput label="Patient" value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>{admissions.map((item) => <option key={item._id} value={item.patient?._id}>{item.patient?.name}</option>)}</SelectInput>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"><p className="font-semibold">Admission Info</p><p>{currentAdmission?.ward?.name || '-'} / {currentAdmission?.bed?.bedNumber || '-'}</p><Badge>{currentAdmission?.status || 'None'}</Badge></div>
          <SelectInput label="Consulting Doctor" value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} required>
            <option value="">Select doctor</option>
            {doctors.map((doctor) => <option key={doctor}>{doctor}</option>)}
          </SelectInput>
          <FormInput label="Discharge Date" type="datetime-local" value={form.dischargeDate} onChange={(e) => setForm({ ...form, dischargeDate: e.target.value })} />
          <FormInput label="Discharge Summary" value={form.dischargeSummary} onChange={(e) => setForm({ ...form, dischargeSummary: e.target.value })} required />
          <FormInput label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex items-end"><Button type="submit"><LogOut size={17} />Confirm Discharge</Button></div>
        </form>
      </Card>
      <Card><h2 className="mb-4 text-lg font-bold">Discharge Records</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Patient</th><th>Doctor</th><th>Summary</th><th>Date</th></tr></thead><tbody>{discharges.map((item) => <tr key={item._id} className="border-t border-slate-100"><td className="p-3">{item.patient?.name}</td><td>{item.doctor}</td><td>{item.dischargeSummary}</td><td>{formatDateTime(item.dischargeDate)}</td></tr>)}</tbody></table></div></Card>
    </div>
  );
}
