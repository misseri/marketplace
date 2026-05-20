"use client";

import type { ProductCharacteristic } from "~/api/products";

type ProductCharacteristicsProps = {
  characteristics: ProductCharacteristic[];
};

export default function ProductCharacteristics({
  characteristics,
}: ProductCharacteristicsProps) {
  if (characteristics.length === 0) {
    return (
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Характеристики</h2>
          <p className="mt-2 text-sm text-slate-500">
            Для этого товара характеристики пока не заполнены.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-[linear-gradient(135deg,_rgba(255,248,240,0.98)_0%,_rgba(255,240,245,0.98)_100%)] p-6 shadow-[0_18px_40px_rgba(244,114,182,0.10)]">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Характеристики</h2>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {characteristics.map((characteristic) => (
          <article
            key={characteristic.id}
            className="rounded-3xl border border-white/90 bg-white/90 p-4 shadow-sm backdrop-blur"
          >
            <p className="text-xs font-semibold tracking-[0.22em] text-[#d55384] uppercase">
              {characteristic.name}
            </p>
            <p className="mt-3 text-base leading-6 font-semibold text-slate-900">
              {characteristic.value}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
