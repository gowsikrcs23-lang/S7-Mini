export const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '-');
export const formatDateTime = (date) => (date ? new Date(date).toLocaleString() : '-');

export const statusClasses = {
  Admin: 'bg-blue-100 text-blue-700 border-blue-200',
  Staff: 'bg-amber-100 text-amber-700 border-amber-200',
  Available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Occupied: 'bg-rose-100 text-rose-700 border-rose-200',
  Reserved: 'bg-amber-100 text-amber-700 border-amber-200',
  Cleaning: 'bg-sky-100 text-sky-700 border-sky-200',
  Maintenance: 'bg-slate-200 text-slate-700 border-slate-300',
  Registered: 'bg-blue-100 text-blue-700 border-blue-200',
  Waiting: 'bg-amber-100 text-amber-700 border-amber-200',
  Admitted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Discharged: 'bg-slate-200 text-slate-700 border-slate-300'
};
