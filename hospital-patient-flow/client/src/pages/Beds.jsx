import { Building2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import FormInput from '../components/FormInput';
import SelectInput from '../components/SelectInput';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh';
import api from '../services/api';
import { formatDateTime } from '../utils/format';

const floorOptions = [
  { value: '0', label: 'Floor 0 — Emergency (10 beds)' },
  { value: '1', label: 'Floor 1 — 10 beds' },
  { value: '2', label: 'Floor 2 — General Ward (10 beds)' },
  { value: '3', label: 'Floor 3 — ICU (10 beds)' },
  { value: '4', label: 'Floor 4 — Maternity 8 / Pediatric 4 (12 beds)' },
  { value: '5', label: 'Floor 5 — Other' }
];

export default function Beds() {
  const { isAdmin } = useAuth();
  const [beds, setBeds] = useState([]);
  const [allBeds, setAllBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [filters, setFilters] = useState({ ward: '', status: '', type: '' });
  const [form, setForm] = useState({ bedNumber: '', roomNumber: '', floor: '1', otherFloor: '', type: 'Standard', status: 'Available' });
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const query = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value))).toString();
    const [bedsRes, allBedsRes, wardsRes] = await Promise.all([api.get(`/beds?${query}`), api.get('/beds'), api.get('/beds/wards')]);
    setBeds(bedsRes.data);
    setAllBeds(allBedsRes.data);
    setWards(wardsRes.data);
  }, [filters]);

  useEffect(() => { load().catch((err) => setError(err.message)); }, [load]);
  useRealtimeRefresh(load);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...form,
        floor: form.floor === '5' ? `5 - ${form.otherFloor.trim()}` : form.floor
      };
      await api.post('/beds', payload);
      setForm({ ...form, bedNumber: '', roomNumber: '', otherFloor: '' });
      setToast('Bed added');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeStatus = async (bed, status) => {
    try {
      await api.put(`/beds/${bed._id}`, { status });
      setToast('Bed status updated');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (bed) => {
    if (!confirm(`Delete bed ${bed.bedNumber}?`)) return;
    try {
      await api.delete(`/beds/${bed._id}`);
      setToast('Bed deleted');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const setupFloorPlan = async () => {
    try {
      const { data } = await api.post('/beds/floor-plan');
      setToast(`${data.message}: ${data.created} beds created, ${data.existing} already existed`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const floorCapacity = form.floor === '4' ? 12 : 10;
  const floorPrefix = `F${form.floor}`;
  const usedBedNumbers = new Set(allBeds.map((bed) => bed.bedNumber));
  const bedOptions = Array.from({ length: floorCapacity }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return { bedNumber: `${floorPrefix}-B${number}`, roomNumber: `${floorPrefix}-R${number}` };
  }).filter((option) => !usedBedNumbers.has(option.bedNumber));

  const changeFloor = (event) => {
    setForm({ ...form, floor: event.target.value, bedNumber: '', roomNumber: '' });
  };

  return (
    <div className="space-y-6">
      <Toast message={toast || error} type={error ? 'error' : 'success'} onClose={() => { setToast(''); setError(''); }} />
      {isAdmin && (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-lg font-bold">Add Bed</h2><Button type="button" variant="secondary" onClick={setupFloorPlan}><Building2 size={16} />Create Hospital Floor Plan</Button></div>
          <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-6">
            <SelectInput label="Bed Number" value={form.bedNumber} onChange={(e) => { const option = bedOptions.find((item) => item.bedNumber === e.target.value); setForm({ ...form, bedNumber: e.target.value, roomNumber: option?.roomNumber || '' }); }} required><option value="">Select bed</option>{bedOptions.map((option) => <option key={option.bedNumber} value={option.bedNumber}>{option.bedNumber}</option>)}</SelectInput>
            <SelectInput label="Room Number" value={form.roomNumber} onChange={(e) => { const option = bedOptions.find((item) => item.roomNumber === e.target.value); setForm({ ...form, roomNumber: e.target.value, bedNumber: option?.bedNumber || '' }); }} required><option value="">Select room</option>{bedOptions.map((option) => <option key={option.roomNumber} value={option.roomNumber}>{option.roomNumber}</option>)}</SelectInput>
            <SelectInput label="Floor" value={form.floor} onChange={changeFloor} required>{floorOptions.map((floor) => <option key={floor.value} value={floor.value}>{floor.label}</option>)}</SelectInput>
            {form.floor === '5' && <FormInput label="Other Floor / Department" value={form.otherFloor} onChange={(e) => setForm({ ...form, otherFloor: e.target.value })} placeholder="e.g. Dialysis" required />}
            <SelectInput label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option>Standard</option><option>ICU</option><option>Emergency</option><option>Pediatric</option><option>Maternity</option></SelectInput>
            <SelectInput label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option>Available</option><option>Reserved</option><option>Cleaning</option><option>Maintenance</option></SelectInput>
            <div className="flex items-end"><Button type="submit"><Plus size={16} />Add</Button></div>
          </form>
        </Card>
      )}
      <Card>
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold">Bed and Ward Management</h2>
          <div className="grid gap-2 md:grid-cols-3">
            <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={filters.ward} onChange={(e) => setFilters({ ...filters, ward: e.target.value })}><option value="">All Wards</option>{wards.map((ward) => <option key={ward._id} value={ward._id}>{ward.name}</option>)}</select>
            <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}><option value="">All Status</option><option>Available</option><option>Occupied</option><option>Reserved</option><option>Cleaning</option><option>Maintenance</option></select>
            <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}><option value="">All Types</option><option>Standard</option><option>ICU</option><option>Emergency</option><option>Pediatric</option><option>Maternity</option></select>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {beds.map((bed) => (
            <div key={bed._id} className="rounded-lg border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between"><div><p className="text-xl font-bold">{bed.bedNumber}</p><p className="text-sm text-slate-500">Room {bed.roomNumber || '-'} · {bed.ward?.name} - Floor {bed.floor}</p></div><Badge>{bed.status}</Badge></div>
              <p className="mt-3 text-sm"><span className="font-semibold">Type:</span> {bed.type}</p>
              <p className="text-sm"><span className="font-semibold">Patient:</span> {bed.assignedPatient?.name || 'None'}</p>
              <p className="text-xs text-slate-400">Updated {formatDateTime(bed.lastUpdated)}</p>
              <div className="mt-4 flex gap-2">
                <select className="min-w-0 flex-1 rounded-md border border-slate-200 px-2 py-2 text-sm" value={bed.status} onChange={(e) => changeStatus(bed, e.target.value)}>
                  <option>Available</option><option>Occupied</option><option>Reserved</option><option>Cleaning</option><option>Maintenance</option>
                </select>
                {isAdmin && <button onClick={() => remove(bed)} className="rounded-md border border-rose-200 px-3 text-rose-600"><Trash2 size={17} /></button>}
              </div>
            </div>
          ))}
        </div>
        {!beds.length && <p className="p-6 text-center text-slate-500">No beds match the current filters.</p>}
      </Card>
    </div>
  );
}
