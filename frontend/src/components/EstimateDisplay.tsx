type EstimateDisplayProps = {
  requiredTokens: number;
  currentBalance: number;
  canProcess: boolean;
  suggestedPackage?: {
    tokenAmount: number;
    priceEur: number;
  } | null;
  nextLowerPackage?: {
    tokenAmount: number;
    priceEur: number;
  } | null;
  differenceToLowerPackage?: number | null;
  hintMessage?: string | null;
};

const formatPrice = (value: number) => `${value.toFixed(2)} EUR`;

export const EstimateDisplay = ({
  requiredTokens,
  currentBalance,
  canProcess,
  suggestedPackage,
  nextLowerPackage,
  differenceToLowerPackage,
  hintMessage,
}: EstimateDisplayProps) => {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Procjena</h2>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Token model
        </p>
      </div>
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex items-center justify-between">
          <span>Potrebno tokena</span>
          <span className="font-medium text-slate-900">
            {requiredTokens}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Trenutni balans</span>
          <span className="font-medium text-slate-900">
            {currentBalance}
          </span>
        </div>
        {canProcess && (
          <div className="flex items-center justify-between">
            <span>Nakon obrade ostaće vam</span>
            <span className="font-medium text-slate-900">
              {currentBalance - requiredTokens} tokena
            </span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-200 pt-2">
          <span className="font-semibold text-slate-900">Status obrade</span>
          <span className="text-base font-semibold text-slate-900">
            {canProcess ? "Dovoljno tokena" : "Nedovoljno tokena"}
          </span>
        </div>
        {!canProcess && suggestedPackage ? (
          <div className="mt-1 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p>
              Predloženi paket: {suggestedPackage.tokenAmount} tokena za {formatPrice(suggestedPackage.priceEur)}.
            </p>
            {nextLowerPackage && differenceToLowerPackage && differenceToLowerPackage > 0 ? (
              <p className="mt-1">
                Ako uklonite još {differenceToLowerPackage} karakter/a, možete uzeti paket od {nextLowerPackage.tokenAmount} tokena.
              </p>
            ) : null}
          </div>
        ) : null}
        {hintMessage ? (
          <p className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {hintMessage}
          </p>
        ) : null}
      </div>
    </section>
  );
};
