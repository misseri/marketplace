"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CategoriesMenu from "~/features/categories/ui/CategoriesMenu";
import type { HeaderSearchProduct } from "~/features/header/model";
import MainPageHeader from "~/features/header/ui/MainPageHeader";
import ProductCard from "~/features/products/ui/ProductCard";
import { productsApi, type Product } from "~/api/products";

const PRODUCT_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="384" viewBox="0 0 320 384">
      <rect width="320" height="384" fill="#e5e5e5"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#737373" font-family="Arial" font-size="20">
        No image
      </text>
    </svg>
  `);

export default function HomePage() {
  const [boughtItems, setBoughtItems] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");

  const handleBuy = (productId: string) => {
    setBoughtItems((prev) => [...prev, productId]);
  };

  const handleFavorite = (productId: string) => {
    setFavoriteItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setSearchLoading(true);

      try {
        const nextProducts = await productsApi.getProducts({
          query: searchQuery,
          categoryId,
          page: 0,
          size: 24,
          signal: controller.signal,
        });
        setProducts(nextProducts);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Failed to load products:", error);
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, categoryId]);

  const handleSelectProduct = (productId: number) => {
    const productElement = document.getElementById(`product-${productId}`);
    productElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const searchResults: HeaderSearchProduct[] = products
    .slice(0, 10)
    .map((product) => ({
      id: product.id,
      name: product.name,
      currentPrice: product.currentPrice,
    }));

  return (
    <>
      <MainPageHeader
        searchQuery={searchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onSearchChange={setSearchQuery}
        onSelectProduct={handleSelectProduct}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      <CategoriesMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="my-5 flex flex-col items-center xl:mx-10">
        <div className="flex w-full flex-wrap justify-center gap-15 max-sm:justify-center max-sm:gap-7">
          {searchLoading && products.length === 0 && (
            <p className="mt-10 w-full text-center text-neutral-500">
              Загрузка товаров...
            </p>
          )}

          {!searchLoading && products.length === 0 && (
            <div className="mt-10 flex w-full flex-col items-center justify-center">
              <p className="text-center text-xl text-neutral-500">
                Товары не найдены
              </p>
              <p className="mt-2 text-center text-sm text-neutral-400">
                Попробуйте изменить поисковый запрос или выбрать другую
                категорию
              </p>
            </div>
          )}

          {products.map((product) => {
            const productIdString = String(product.id);

            return (
              <div key={product.id} id={`product-${product.id}`}>
                <ProductCard
                  title={product.name}
                  price={Number(product.currentPrice ?? 0)}
                  image={PRODUCT_PLACEHOLDER}
                  isBought={boughtItems.includes(productIdString)}
                  isFavorite={favoriteItems.includes(productIdString)}
                  onBuy={() => handleBuy(productIdString)}
                  onFavorite={() => handleFavorite(productIdString)}
                />
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
