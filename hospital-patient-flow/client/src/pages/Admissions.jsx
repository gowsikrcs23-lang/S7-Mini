import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import Button from '../components/Button';
import Card from '../components/Card';
import SelectInput from '../components/SelectInput';
import FormInput from '../components/FormInput';
import Toast from '../components/Toast';
import Badge from '../components/Badge';
import api from '../services/api';
import { formatDateTime } from '../utils/format';

const doctors = ['Manoj', 'Natish', 'Kavin Kumar', 'Abinaya', 'Iyal'];

export default function Admissions() {
  const [patients, setPatients] = useState([]);
  const [wards, setWards] = useState([]);
  const [beds, setBeds] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [recommended, setRecommended] = useState(null);
  const [form, setForm] = useState({ patient: '', ward: '', bed: '', doctor: '', diagnosis: '', admissionDate: new Date().toISOString().slice(0, 16) });
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const loadBase = async () => {
    const [patientsRes, wardsRes, admissionsRes] = await Promise.all([api.get('/patients?limit=100&status=Registered'), api.get('/beds/wards'), api.get('/admissions')]);
    setPatients(patientsRes.data.patients);
    setWards(wardsRes.data);
    setAdmissions(admissionsRes.data);
    setForm((current) => ({ ...current, patient: current.patient || patientsRes.data.patients[0]?._id || '', ward: current.ward || wardsRes.data[0]?._id || '' }));
  };

  useEffect(() => { loadBase().catch((err) => setError(err.message)); }, []);
  useEffect(() => {
    if (!form.ward) return;
    api.get(`/beds/available?ward=${form.ward}`).then(({ data }) => setBeds(data)).catch((err) => setError(err.message));
  }, [form.ward]);
  useEffect(() => {
    const patient = patients.find((item) => item._id === form.patient);
    if (!form.ward || !patient) return;
    api.get(`/recommend-bed?ward=${form.ward}&priority=${patient.priority}`).then(({ data }) => setRecommended(data.recommendedBed)).catch(() => setRecommended(null));
  }, [form.ward, form.patient, patients]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.post('/admissions', form);
      setToast(data.waitingQueue ? 'No bed available: patient moved to waiting queue' : 'Patient admitted successfully');
      setForm({ ...form, bed: '', doctor: '', diagnosis: '' });
      await loadBase();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Toast message={toast || error} type={error ? 'error' : 'success'} onClose={() => { setToast(''); setError(''); }} />
      <Card>
        <h2 className="text-lg font-bold">Patient Admission Workflow</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-3">
          <SelectInput label="Registered Patient" value={form.patient} onChange={(e) => setForm({ ...form, patient: e.target.value })}>{patients.map((patient) => <option key={patient._id} value={patient._id}>{patient.patientId} - {patient.name} ({patient.priority})</option>)}</SelectInput>
          <SelectInput label="Required Ward" value={form.ward} onChange={(e) => setForm({ ...form, ward: e.target.value, bed: '' })}>{wards.map((ward) => <option key={ward._id} value={ward._id}>{ward.name}</option>)}</SelectInput>
          <SelectInput label="Available Bed" value={form.bed} onChange={(e) => setForm({ ...form, bed: e.target.value })}><option value="">Auto assign or queue</option>{beds.map((bed) => <option key={bed._id} value={bed._id}>{bed.bedNumber} - {bed.type}</option>)}</SelectInput>
          <SelectInput label="Consulting Doctor" value={form.doctor} onChange={(e) => setForm({ ...form, doctor: e.target.value })} required>
            <option value="">Select doctor</option>
            {doctors.map((doctor) => <option key={doctor}>{doctor}</option>)}
          </SelectInput>
          <FormInput label="Diagnosis / Reason" value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} required />
          <FormInput label="Admission Date/Time" type="datetime-local" value={form.admissionDate} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} />
          {recommended && <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm md:col-span-2"><p className="font-bold text-emerald-700">Recommended Bed</p><p>{recommended.bedNumber} in {recommended.ward?.name} ({recommended.type})</p><button type="button" className="mt-2 font-semibold text-hospital-teal" onClick={() => setForm({ ...form, bed: recommended._id })}>Accept recommendation</button></div>}
          <div className="flex items-end"><Button type="submit"><CheckCircle2 size={17} />Confirm Admission</Button></div>
        </form>
      </Card>
      <Card><h2 className="mb-4 text-lg font-bold">Admission Records</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Patient</th><th>Ward</th><th>Bed</th><th>Doctor</th><th>Status</th><th>Date</th></tr></thead><tbody>{admissions.map((item) => <tr key={item._id} className="border-t border-slate-100"><td className="p-3">{item.patient?.name}</td><td>{item.ward?.name}</td><td>{item.bed?.bedNumber}</td><td>{item.doctor}</td><td><Badge>{item.status}</Badge></td><td>{formatDateTime(item.admissionDate)}</td></tr>)}</tbody></table></div></Card>
    </div>
  );
}
