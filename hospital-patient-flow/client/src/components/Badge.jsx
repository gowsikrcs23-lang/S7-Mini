import { statusClasses } from '../utils/format';

export default function Badge({ children }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses[children] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>{children}</span>;
}
