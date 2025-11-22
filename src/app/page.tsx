"use client";

import Header from "./components/MainPageHeader/page";
import Card from "./components/Card/page";
import { products } from "./components/Card/data";
import { useState } from "react";

export default function HomePage() {
  const [boughtItems, setBoughtItems] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<string[]>([]);

  const handleBuy = (productId: string) => {
    setBoughtItems([...boughtItems, productId]);
  };

  const handleFavorite = (productId: string) => {
    setFavoriteItems([...favoriteItems, productId]);
  };

  return (
    <>
      <Header></Header>
      <main className="my-5 flex flex-wrap justify-center gap-15 max-sm:justify-center max-sm:gap-7 xl:mx-10">
        {products.map((product) => (
          <Card
            key={product.id}
            {...product}
            isBought={boughtItems.includes(product.id)}
            isFavorite={favoriteItems.includes(product.id)}
            onBuy={() => handleBuy(product.id)}
            onFavorite={() => handleFavorite(product.id)}
          />
        ))}
      </main>
    </>
  );
}
