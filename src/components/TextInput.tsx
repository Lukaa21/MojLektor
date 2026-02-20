type TextInputProps = {
  id: string;
  label: string;
  value: string;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  onChange: (value: string) => void;
};

export const TextInput = ({
  id,
  label,
  value,
  placeholder,
  rows = 12,
  disabled = false,
  onChange,
}: TextInputProps) => {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-[220px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        aria-label={label}
      />
    </div>
  );
};
