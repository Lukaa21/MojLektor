type EstimateDisplayProps = {
  cardCount: number;
  perCard: number;
  subtotal: number;
  totalPrice: number;
};

const formatPrice = (value: number) => `${value.toFixed(2)} EUR`;

export const EstimateDisplay = ({
  cardCount,
  perCard,
  subtotal,
  totalPrice,
}: EstimateDisplayProps) => {
  return (
    <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Procjena</h2>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Kartice: {cardCount}
        </p>
      </div>
      <div className="grid gap-2 text-sm text-slate-700">
        <div className="flex items-center justify-between">
          <span>Cijena po kartici</span>
          <span className="font-medium text-slate-900">
            {formatPrice(perCard)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Medjuzbir</span>
          <span className="font-medium text-slate-900">
            {formatPrice(subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2">
          <span className="font-semibold text-slate-900">Ukupno</span>
          <span className="text-base font-semibold text-slate-900">
            {formatPrice(totalPrice)}
          </span>
        </div>
      </div>
    </section>
  );
};
