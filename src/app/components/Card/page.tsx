import { useState, useEffect } from "react";
import { Check, Heart } from "lucide-react";
import Link from "next/link";

export interface CardProps {
  title: string;
  price: number;
  image: string;
  isBought?: boolean;
  isFavorite?: boolean;
  onBuy: () => void;
  onFavorite: () => void;
}

export default function Card({
  title,
  price,
  image,
  isBought = false,
  isFavorite = false,
  onBuy,
  onFavorite,
}: CardProps) {
  const [isShowingCheck, setIsShowingCheck] = useState(false);

  useEffect(() => {
    if (!isBought) {
      setIsShowingCheck(false);
    }
  }, [isBought]);

  const handleBuyClick = () => {
    onBuy();
    setIsShowingCheck(true);
    setTimeout(() => {
      setIsShowingCheck(false);
    }, 1000);
  };

  return (
    <div className="flex max-h-min max-w-50 flex-col justify-center gap-1 overflow-hidden rounded-2xl bg-white pb-2 shadow-md max-sm:max-h-min max-sm:min-w-40">
      <Link href="/CardPage">
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
        <h3 className="overflow-hidden text-sm font-bold text-ellipsis whitespace-nowrap text-neutral-700 max-sm:text-[0.8rem]">
          {title}
        </h3>
      </div>

      <div className="flex items-center justify-evenly gap-2 px-5 max-sm:gap-1 max-sm:px-2">
        {isShowingCheck ? (
          <button
            className="flex w-full items-center justify-center rounded-md bg-[#F62877] px-1.5 py-1"
            onClick={handleBuyClick}
            disabled={true}
          >
            <Check className="h-6 w-6 text-white max-sm:h-5 max-sm:w-5" />
          </button>
        ) : isBought ? (
          <button
            className="flex w-full items-center justify-center rounded-md bg-[#f628779a] px-1.5 py-1"
            onClick={handleBuyClick}
            disabled={true}
          >
            <span className="text-white max-sm:text-sm">В корзине</span>
          </button>
        ) : (
          <button
            className="flex w-full cursor-pointer items-center justify-center rounded-md bg-[#F62877] px-1.5 py-1"
            onClick={handleBuyClick}
            disabled={false}
          >
            <span className="text-white max-sm:text-sm">Купить</span>
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
