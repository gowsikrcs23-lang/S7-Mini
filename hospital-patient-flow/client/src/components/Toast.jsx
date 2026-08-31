export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;
  const colors = type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  return (
    <div className={`fixed right-5 top-5 z-50 rounded-md border px-4 py-3 text-sm font-semibold shadow-lg ${colors}`}>
      <button className="ml-4 text-slate-500" onClick={onClose}>x</button>
      {message}
    </div>
  );
}
