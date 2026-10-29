import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Button from '../components/Button';
import Card from '../components/Card';
import api from '../services/api';

const rangeLabels = {
  today: 'Today',
  '7d': 'Last 7 days',
  '30d': 'Last 30 days'
};

export default function Reports() {
  const [range, setRange] = useState('7d');
  const [report, setReport] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);

  useEffect(() => {
    api.get(`/reports?range=${range}`).then(({ data }) => setReport(data)).catch(console.error);
  }, [range]);

  const downloadPdf = async () => {
    if (!report) return;

    setIsExporting(true);
    setExportStatus(null);

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const margin = 16;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const generatedAt = new Date();
      let y = 18;

      const addTableHeader = () => {
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y - 5, pageWidth - margin * 2, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        ['Ward', 'Total', 'Occupied', 'Available', 'Occupancy'].forEach((heading, index) => {
          doc.text(heading, [margin, 70, 102, 134, 166][index], y);
        });
        y += 9;
      };

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Hospital Patient Flow Report', margin, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(`Period: ${rangeLabels[range]}  |  Generated: ${generatedAt.toLocaleString()}`, margin, y);
      y += 8;
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Summary', margin, y);
      y += 8;

      const summary = [
        ['Total Admissions', report.totalAdmissions],
        ['Total Discharges', report.totalDischarges],
        ['Average Occupancy', `${report.averageOccupancy}%`],
        ['Available Beds', report.availableBeds],
        ['Average Stay', `${report.averagePatientStay} days`],
        ['Bed Utilization', `${report.bedUtilizationRate}%`]
      ];

      doc.setFontSize(10);
      summary.forEach(([label, value], index) => {
        const x = margin + (index % 2) * 92;
        const rowY = y + Math.floor(index / 2) * 13;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(label, x, rowY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(String(value), x + 48, rowY);
      });
      y += 47;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('Ward Utilization', margin, y);
      y += 8;
      addTableHeader();

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      report.wardWiseOccupancy.forEach((item) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
          addTableHeader();
        }

        doc.setTextColor(15, 23, 42);
        [item.ward, item.total, item.occupied, item.available, `${item.occupancyRate}%`].forEach((value, index) => {
          doc.text(String(value), [margin, 70, 102, 134, 166][index], y);
        });
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y + 3, pageWidth - margin, y + 3);
        y += 8;
      });

      doc.save(`hospital-report-${range}-${generatedAt.toISOString().slice(0, 10)}.pdf`);
      setExportStatus({ type: 'success', message: 'Report downloaded as PDF.' });
    } catch (error) {
      console.error('Unable to download report as PDF', error);
      setExportStatus({ type: 'error', message: 'The PDF could not be downloaded. Please try again.' });
    } finally {
      setIsExporting(false);
    }
  };

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Reports and Analytics</h2>
        <div className="flex flex-wrap items-center gap-3">
          <select className="rounded-md border border-slate-200 px-3 py-2 text-sm" value={range} onChange={(e) => setRange(e.target.value)} aria-label="Report date range">
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <Button variant="secondary" onClick={downloadPdf} disabled={isExporting} aria-label="Download report as PDF">
            <Download size={16} />
            {isExporting ? 'Preparing PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>
      {exportStatus && (
        <div className={`flex items-center gap-2 rounded-md border px-4 py-3 text-sm ${exportStatus.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`} role="status">
          {exportStatus.type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          <span>{exportStatus.message}</span>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">{cards.map(([label, value]) => <Card key={label}><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Card>)}</div>
      <Card>
        <h3 className="mb-4 text-lg font-bold">Ward-wise Occupancy</h3>
        <ResponsiveContainer width="100%" height={300}><BarChart data={report.wardWiseOccupancy}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="ward" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="occupied" fill="#ef4444" /><Bar dataKey="available" fill="#0f9f94" /></BarChart></ResponsiveContainer>
      </Card>
      <Card><h3 className="mb-4 text-lg font-bold">Ward Utilization Table</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Ward</th><th>Total</th><th>Occupied</th><th>Available</th><th>Occupancy</th></tr></thead><tbody>{report.wardWiseOccupancy.map((item) => <tr key={item.ward} className="border-t border-slate-100"><td className="p-3 font-semibold">{item.ward}</td><td>{item.total}</td><td>{item.occupied}</td><td>{item.available}</td><td>{item.occupancyRate}%</td></tr>)}</tbody></table></div></Card>
    </div>
  );
}
