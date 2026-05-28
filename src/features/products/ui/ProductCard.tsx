"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Heart } from "lucide-react";

export interface ProductCardProps {
  id: number;
  title: string;
  price: number;
  image: string;
  stockQuantity?: number;
  isBought?: boolean;
  isFavorite?: boolean;
  buyLabel?: string;
  onBuy: () => Promise<void>;
  onFavorite: () => void;
}

export default function ProductCard({
  id,
  title,
  price,
  image,
  stockQuantity,
  isBought = false,
  isFavorite = false,
  buyLabel = "Купить",
  onBuy,
  onFavorite,
}: ProductCardProps) {
  const [isShowingCheck, setIsShowingCheck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOutOfStock = typeof stockQuantity === "number" && stockQuantity <= 0;

  useEffect(() => {
    if (!isBought) {
      setIsShowingCheck(false);
    }
  }, [isBought]);

  const handleBuyClick = async () => {
    if (isSubmitting || isBought || isOutOfStock) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onBuy();
      setIsShowingCheck(true);
      window.setTimeout(() => {
        setIsShowingCheck(false);
      }, 1000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex max-h-min max-w-60 flex-col justify-center gap-1 overflow-hidden rounded-2xl bg-white pb-2 shadow-md max-sm:max-h-min max-sm:min-w-40">
      <Link href={`/product/${id}`}>
        <img
          src={image || "no-image"}
          alt="card image"
          className="min-h-60 min-w-50 bg-neutral-400 max-sm:min-h-40 max-sm:min-w-25"
        />
      </Link>
      <div className="flex flex-col items-start justify-start px-5 max-sm:px-2">
        <span className="text-xl font-bold text-[#F62877] max-sm:text-[1rem]">
          {price.toLocaleString()} ₽
        </span>
        <h3 className="line-clamp-1 overflow-hidden text-ellipsis text-sm font-bold text-neutral-700 max-sm:text-[0.8rem]">
          {title}
        </h3>
      </div>

      <div className="flex items-center justify-evenly gap-2 px-5 max-sm:gap-1 max-sm:px-2">
        {isShowingCheck ? (
          <button
            className="flex w-full items-center justify-center rounded-md bg-[#F62877] px-1.5 py-1"
            disabled
          >
            <Check className="h-6 w-6 text-white max-sm:h-5 max-sm:w-5" />
          </button>
        ) : isBought ? (
          <button
            className="flex w-full items-center justify-center rounded-md bg-[#f628779a] px-1.5 py-1"
            disabled
          >
            <span className="text-white max-sm:text-sm">В корзине</span>
          </button>
        ) : isOutOfStock ? (
          <button
            className="flex w-full items-center justify-center rounded-md bg-slate-300 px-1.5 py-1"
            disabled
          >
            <span className="text-white max-sm:text-sm">Нет в наличии</span>
          </button>
        ) : (
          <button
            className="flex w-full cursor-pointer items-center justify-center rounded-md bg-[#F62877] px-1.5 py-1"
            onClick={() => {
              void handleBuyClick();
            }}
            disabled={isSubmitting}
          >
            <span className="text-white max-sm:text-sm">
              {isSubmitting ? "Добавляем..." : buyLabel}
            </span>
          </button>
        )}

        <button
          className="cursor-pointer rounded-md p-1 text-[#F62877]"
          onClick={onFavorite}
        >
          {isFavorite ? <Heart fill="#F62877" /> : <Heart />}
        </button>
      </div>
    </div>
  );
}
