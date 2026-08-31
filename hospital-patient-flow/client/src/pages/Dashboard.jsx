import { useCallback, useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, BedDouble, CheckCircle2, Hospital, Percent, UserCheck, UserMinus } from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import api from '../services/api';
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh';
import { formatDateTime } from '../utils/format';

const colors = ['#0f9f94', '#ef4444', '#f59e0b', '#38bdf8', '#64748b'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [queue, setQueue] = useState([]);

  const load = useCallback(async () => {
    const [statsRes, chartsRes, notificationRes, queueRes] = await Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/charts'),
      api.get('/notifications'),
      api.get('/waiting-queue?status=Waiting')
    ]);
    setStats(statsRes.data);
    setCharts(chartsRes.data);
    setNotifications(notificationRes.data);
    setQueue(queueRes.data);
  }, []);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);
  useRealtimeRefresh(load);

  const statCards = [
    ['Total Beds', stats?.totalBeds, Hospital],
    ['Available Beds', stats?.availableBeds, CheckCircle2],
    ['Occupied Beds', stats?.occupiedBeds, BedDouble],
    ['ICU Beds Available', stats?.icuBedsAvailable, AlertTriangle],
    ['Emergency Beds Available', stats?.emergencyBedsAvailable, AlertTriangle],
    ['Admitted Today', stats?.patientsAdmittedToday, UserCheck],
    ['Discharged Today', stats?.patientsDischargedToday, UserMinus],
    ['Occupancy Rate', `${stats?.occupancyRate || 0}%`, Percent]
  ];

  if (!stats || !charts) return <div className="text-slate-600">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(([label, value, Icon]) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>
              <div className="rounded-md bg-hospital-mint p-3 text-hospital-teal"><Icon size={22} /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Bed Availability by Ward</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={charts.bedAvailabilityByWard}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ward" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="available" stackId="a" fill="#0f9f94" />
              <Bar dataKey="occupied" stackId="a" fill="#ef4444" />
              <Bar dataKey="cleaning" stackId="a" fill="#38bdf8" />
              <Bar dataKey="maintenance" stackId="a" fill="#64748b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Overall Occupancy</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={charts.occupancyPie} dataKey="value" nameKey="name" innerRadius={70} outerRadius={105} paddingAngle={3}>
                {charts.occupancyPie.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Admissions</h2>
          <ResponsiveContainer width="100%" height={220}><LineChart data={charts.admissionTrend}><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Line dataKey="admissions" stroke="#2563eb" strokeWidth={3} /></LineChart></ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Discharges</h2>
          <ResponsiveContainer width="100%" height={220}><LineChart data={charts.dischargeTrend}><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Line dataKey="discharges" stroke="#0f9f94" strokeWidth={3} /></LineChart></ResponsiveContainer>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Weekly Patient Flow</h2>
          <ResponsiveContainer width="100%" height={220}><AreaChart data={charts.weeklyFlow}><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Area dataKey="admissions" fill="#bfdbfe" stroke="#2563eb" /><Area dataKey="discharges" fill="#ccfbf1" stroke="#0f9f94" /></AreaChart></ResponsiveContainer>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Notifications</h2>
          <div className="space-y-3">{notifications.slice(0, 6).map((item) => <div key={item._id} className="rounded-md border border-slate-200 p-3"><div className="flex justify-between"><Badge>{item.severity}</Badge><span className="text-xs text-slate-400">{formatDateTime(item.createdAt)}</span></div><p className="mt-2 text-sm font-semibold">{item.message}</p></div>)}</div>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-bold">Waiting Queue Alerts</h2>
          <div className="space-y-3">{queue.length ? queue.slice(0, 6).map((item) => <div key={item._id} className="flex items-center justify-between rounded-md border border-amber-200 bg-amber-50 p-3"><div><p className="font-semibold">{item.patient?.name}</p><p className="text-sm text-slate-500">{item.requiredWard?.name}</p></div><Badge>{item.priority}</Badge></div>) : <p className="text-sm text-slate-500">No patients waiting for a bed.</p>}</div>
        </Card>
      </div>
    </div>
  );
}
