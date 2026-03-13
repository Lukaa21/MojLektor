type LoaderProps = {
  label?: string;
};

export const Loader = ({ label = "Obrada u toku..." }: LoaderProps) => {
  return (
    <div className="flex items-center gap-3 text-sm text-slate-600" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
      {label}
    </div>
  );
};
