export default function SelectInput({ label, children, className = '', ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      <select
        className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-hospital-teal focus:ring-2 focus:ring-teal-100"
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
