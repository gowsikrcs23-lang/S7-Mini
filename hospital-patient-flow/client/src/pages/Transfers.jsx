import { ArrowRightLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import SelectInput from '../components/SelectInput';
import Toast from '../components/Toast';
import api from '../services/api';
import { formatDateTime } from '../utils/format';

export default function Transfers() {
  const [admissions, setAdmissions] = useState([]);
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState({ patient: '', ward: '', toBed: '', reason: '' });
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [admissionsRes, transfersRes, wardsRes] = await Promise.all([api.get('/admissions'), api.get('/transfers'), api.get('/beds/wards')]);
    const active = admissionsRes.data.filter((item) => item.status !== 'Discharged');
    setAdmissions(active);
    setTransfers(transfersRes.data);
    setWards(wardsRes.data);
    setForm((current) => ({ ...current, patient: current.patient || active[0]?.patient?._id || '', ward: current.ward || wardsRes.data[0]?._id || '' }));
  };

  useEffect(() => { load().catch((err) => setError(err.message)); }, []);
  useEffect(() => {
    if (!form.ward) return;
    api.get(`/beds/available?ward=${form.ward}`).then(({ data }) => setBeds(data)).catch((err) => setError(err.message));
  }, [form.ward]);

  const currentAdmission = admissions.find((item) => item.patient?._id === form.patient);

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/transfers', form);
      setToast('Patient transferred successfully');
      setForm({ ...form, toBed: '', reason: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Toast message={toast || error} type={error ? 'error' : 'success'} onClose={() => { setToast(''); setError(''); }} />
      <Card>
        <h2 className="text-lg font-bold">Transfer Patient</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-3">
          <SelectInput label="Admitted Patient" value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>{admissions.map((item) => <option key={item._id} value={item.patient?._id}>{item.patient?.name} - {item.bed?.bedNumber}</option>)}</SelectInput>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm"><p className="font-semibold">Current Bed</p><p>{currentAdmission?.ward?.name || '-'} / {currentAdmission?.bed?.bedNumber || '-'}</p></div>
          <SelectInput label="Destination Ward" value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value, toBed: '' })}>{wards.map((ward) => <option key={ward._id} value={ward._id}>{ward.name}</option>)}</SelectInput>
          <SelectInput label="Destination Bed" value={form.toBed} onChange={(e) => setForm({ ...form, toBed: e.target.value })} required><option value="">Select bed</option>{beds.map((bed) => <option key={bed._id} value={bed._id}>{bed.bedNumber} - {bed.type}</option>)}</SelectInput>
          <FormInput label="Transfer Reason" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} required />
          <div className="flex items-end"><Button type="submit"><ArrowRightLeft size={17} />Confirm Transfer</Button></div>
        </form>
      </Card>
      <Card><h2 className="mb-4 text-lg font-bold">Transfer History</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Patient</th><th>From</th><th>To</th><th>Reason</th><th>Date</th></tr></thead><tbody>{transfers.map((item) => <tr key={item._id} className="border-t border-slate-100"><td className="p-3">{item.patient?.name}</td><td>{item.fromWard?.name} / {item.fromBed?.bedNumber}</td><td>{item.toWard?.name} / {item.toBed?.bedNumber}</td><td>{item.reason}</td><td>{formatDateTime(item.transferDate)}</td></tr>)}</tbody></table></div></Card>
    </div>
  );
}
