import { Edit, Eye, Plus, Search, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import SelectInput from '../components/SelectInput';
import Toast from '../components/Toast';
import api from '../services/api';
import { formatDate } from '../utils/format';

const emptyPatient = { name: '', age: '', gender: 'Male', phone: '', address: '', bloodGroup: '', medicalCondition: '', priority: 'Medium', status: 'Registered', emergencyContact: { name: '', phone: '', relation: '' } };
const phoneDigits = (value) => value.replace(/\D/g, '').slice(0, 10);
const conditionOptions = ['Fever', 'Cold', 'Cough', 'Chest pain', 'Fracture', 'Pregnancy care', 'Pediatric fever', 'Post surgery', 'Observation'];

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState(emptyPatient);
  const [conditionChoice, setConditionChoice] = useState('');
  const [otherCondition, setOtherCondition] = useState('');
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const load = async () => {
    const { data } = await api.get(`/patients?page=${page}&search=${search}&status=${status}`);
    setPatients(data.patients);
    setPages(data.pages || 1);
  };

  useEffect(() => { load().catch((err) => setError(err.message)); }, [page, search, status]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const patientData = { ...form, medicalCondition: conditionChoice === 'Other' ? otherCondition : conditionChoice };
      if (editing) await api.put(`/patients/${editing}`, patientData);
      else await api.post('/patients', patientData);
      setForm(emptyPatient);
      setConditionChoice('');
      setOtherCondition('');
      setEditing(null);
      setToast(editing ? 'Patient updated' : 'Patient registered');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const edit = (patient) => {
    setEditing(patient._id);
    const selectedCondition = !patient.medicalCondition ? '' : conditionOptions.includes(patient.medicalCondition) ? patient.medicalCondition : 'Other';
    setForm({ ...emptyPatient, ...patient, medicalCondition: patient.medicalCondition || '', emergencyContact: patient.emergencyContact || emptyPatient.emergencyContact });
    setConditionChoice(selectedCondition);
    setOtherCondition(selectedCondition === 'Other' ? patient.medicalCondition || '' : '');
  };

  const remove = async (patient) => {
    if (!confirm(`Delete ${patient.name}?`)) return;
    try {
      await api.delete(`/patients/${patient._id}`);
      setToast('Patient deleted');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <Toast message={toast || error} type={error ? 'error' : 'success'} onClose={() => { setToast(''); setError(''); }} />
      <Card>
        <h2 className="text-lg font-bold">{editing ? 'Edit Patient' : 'Register Patient'}</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-4">
          <FormInput label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <FormInput label="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
          <SelectInput label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></SelectInput>
          <FormInput label="Phone" type="tel" inputMode="numeric" maxLength={10} minLength={10} pattern="[0-9]{10}" title="Enter exactly 10 digits" value={form.phone} onChange={(e) => setForm({ ...form, phone: phoneDigits(e.target.value) })} required />
          <FormInput label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <SelectInput label="Blood Group" value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
            <option value="">Select blood group</option>
            <option>A+</option>
            <option>A-</option>
            <option>B+</option>
            <option>B-</option>
            <option>AB+</option>
            <option>AB-</option>
            <option>O+</option>
            <option>O-</option>
          </SelectInput>
          <SelectInput label="Condition" value={conditionChoice} onChange={(e) => { setConditionChoice(e.target.value); if (e.target.value !== 'Other') setOtherCondition(''); }}>
            <option value="">Select condition</option>
            {conditionOptions.map((condition) => <option key={condition}>{condition}</option>)}
            <option>Other</option>
          </SelectInput>
          {conditionChoice === 'Other' && <FormInput label="Enter Condition" value={otherCondition} onChange={(e) => setOtherCondition(e.target.value)} required />}
          <SelectInput label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></SelectInput>
          <FormInput label="Emergency Contact" value={form.emergencyContact.name} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, name: e.target.value } })} />
          <FormInput label="Emergency Phone" type="tel" inputMode="numeric" maxLength={10} minLength={10} pattern="[0-9]{10}" title="Enter exactly 10 digits" value={form.emergencyContact.phone} onChange={(e) => setForm({ ...form, emergencyContact: { ...form.emergencyContact, phone: phoneDigits(e.target.value) } })} required={Boolean(form.emergencyContact.name)} />
          <SelectInput label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Registered</option><option>Waiting</option><option>Admitted</option><option>Discharged</option></SelectInput>
          <div className="flex items-end gap-2"><Button type="submit"><Plus size={16} />{editing ? 'Save' : 'Add'}</Button>{editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(emptyPatient); setConditionChoice(''); setOtherCondition(''); }}>Cancel</Button>}</div>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold">Patient Management</h2>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3"><Search size={16} /><input className="py-2 text-sm outline-none" placeholder="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
            <select className="rounded-md border border-slate-200 px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option><option>Registered</option><option>Waiting</option><option>Admitted</option><option>Discharged</option></select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">ID</th><th>Name</th><th>Age</th><th>Phone</th><th>Priority</th><th>Status</th><th>Registered</th><th>Actions</th></tr></thead>
            <tbody>{patients.map((patient) => <tr key={patient._id} className="border-t border-slate-100"><td className="p-3 font-semibold">{patient.patientId}</td><td>{patient.name}</td><td>{patient.age}</td><td>{patient.phone}</td><td><Badge>{patient.priority}</Badge></td><td><Badge>{patient.status}</Badge></td><td>{formatDate(patient.createdAt)}</td><td className="flex gap-2 py-3"><button aria-label={`View ${patient.name} details`} title="View doctor details" onClick={() => setSelectedPatient(patient)} className="text-hospital-teal"><Eye size={17} /></button><button aria-label={`Edit ${patient.name}`} title="Edit patient" onClick={() => edit(patient)} className="text-blue-600"><Edit size={17} /></button><button aria-label={`Delete ${patient.name}`} title="Delete patient" onClick={() => remove(patient)} className="text-rose-600"><Trash2 size={17} /></button></td></tr>)}</tbody>
          </table>
          {!patients.length && <p className="p-6 text-center text-slate-500">No patients found.</p>}
        </div>
        <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button><span className="py-2 text-sm">Page {page} of {pages}</span><Button variant="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button></div>
      </Card>

      {selectedPatient && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="patient-details-title">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-hospital-teal">Doctor Reference</p>
                <h2 id="patient-details-title" className="mt-1 text-xl font-bold">{selectedPatient.name}</h2>
                <p className="text-sm text-slate-500">Patient ID: {selectedPatient.patientId}</p>
              </div>
              <button aria-label="Close patient details" onClick={() => setSelectedPatient(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div>
                <h3 className="mb-3 font-bold text-slate-800">Patient Information</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Age / Gender</dt><dd className="font-semibold">{selectedPatient.age} / {selectedPatient.gender}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Phone</dt><dd className="font-semibold">{selectedPatient.phone}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Blood Group</dt><dd className="font-semibold">{selectedPatient.bloodGroup || '—'}</dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Status</dt><dd><Badge>{selectedPatient.status}</Badge></dd></div>
                  <div className="flex justify-between gap-4"><dt className="text-slate-500">Priority</dt><dd><Badge>{selectedPatient.priority}</Badge></dd></div>
                </dl>
              </div>

              <div>
                <h3 className="mb-3 font-bold text-slate-800">Clinical Details</h3>
                <dl className="space-y-2 text-sm">
                  <div><dt className="text-slate-500">Medical Condition</dt><dd className="mt-1 font-semibold">{selectedPatient.medicalCondition || 'Not recorded'}</dd></div>
                  <div><dt className="text-slate-500">Address</dt><dd className="mt-1 font-semibold">{selectedPatient.address || 'Not recorded'}</dd></div>
                </dl>
              </div>

              <div className="rounded-lg bg-slate-50 p-4 md:col-span-2">
                <h3 className="mb-2 font-bold text-slate-800">Emergency Contact</h3>
                <p className="text-sm">{selectedPatient.emergencyContact?.name || 'Not recorded'}{selectedPatient.emergencyContact?.relation ? ` · ${selectedPatient.emergencyContact.relation}` : ''}</p>
                <p className="text-sm text-slate-600">{selectedPatient.emergencyContact?.phone || 'No phone recorded'}</p>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 p-5">
              <Button type="button" variant="secondary" onClick={() => setSelectedPatient(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
