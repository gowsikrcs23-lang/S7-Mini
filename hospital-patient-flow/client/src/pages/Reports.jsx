import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Card from '../components/Card';
import api from '../services/api';

export default function Reports() {
  const [range, setRange] = useState('7d');
  const [report, setReport] = useState(null);

  useEffect(() => {
    api.get(`/reports?range=${range}`).then(({ data }) => setReport(data)).catch(console.error);
  }, [range]);

  if (!report) return <div className="text-slate-600">Loading reports...</div>;

  const cards = [
    ['Total Admissions', report.totalAdmissions],
    ['Total Discharges', report.totalDischarges],
    ['Average Occupancy', `${report.averageOccupancy}%`],
    ['Available Beds', report.availableBeds],
    ['Average Stay', `${report.averagePatientStay} days`],
    ['Bed Utilization', `${report.bedUtilizationRate}%`]
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">Reports and Analytics</h2><select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={range} onChange={(e) => setRange(e.target.value)}><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option></select></div>
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">{cards.map(([label, value]) => <Card key={label}><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Card>)}</div>
      <Card>
        <h3 className="mb-4 text-lg font-bold">Ward-wise Occupancy</h3>
        <ResponsiveContainer width="100%" height={300}><BarChart data={report.wardWiseOccupancy}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="ward" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="occupied" fill="#ef4444" /><Bar dataKey="available" fill="#0f9f94" /></BarChart></ResponsiveContainer>
      </Card>
      <Card><h3 className="mb-4 text-lg font-bold">Ward Utilization Table</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Ward</th><th>Total</th><th>Occupied</th><th>Available</th><th>Occupancy</th></tr></thead><tbody>{report.wardWiseOccupancy.map((item) => <tr key={item.ward} className="border-t border-slate-100"><td className="p-3 font-semibold">{item.ward}</td><td>{item.total}</td><td>{item.occupied}</td><td>{item.available}</td><td>{item.occupancyRate}%</td></tr>)}</tbody></table></div></Card>
    </div>
  );
}
