type HeaderProps = {
  title: string;
  subtitle?: string;
};

export const Header = ({ title, subtitle }: HeaderProps) => {
  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-semibold text-white shadow-sm">
          ML
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            AI lektura
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            {title}
          </h1>
        </div>
      </div>
      {subtitle ? (
        <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          {subtitle}
        </p>
      ) : null}
    </header>
  );
};
