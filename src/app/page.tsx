"use client";

import { useEffect, useState } from "react";
import Header, {
  type HeaderSearchProduct,
} from "./components/MainPageHeader/page";
import Card from "./components/Card/page";

type ApiProduct = {
  id: number;
  name: string;
  description: string;
  categoryId: number;
  categoryName: string;
  sellerId: number;
  sellerName: string;
  sellerRating: number | null;
  currentPrice: number | null;
  stockQuantity: number;
  averageRating: number;
  reviewCount: number;
};

type ProductsResponse = {
  content?: ApiProduct[];
};

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
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

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
        const url = new URL("http://localhost:8080/products");
        url.searchParams.set("page", "0");
        url.searchParams.set("size", "24");

        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery) {
          url.searchParams.set("query", trimmedQuery);
        }

        const response = await fetch(url.toString(), {
          credentials: "include",
          mode: "cors",
          signal: controller.signal,
        });

        if (!response.ok) {
          setProducts([]);
          return;
        }

        const data: ProductsResponse | ApiProduct[] = await response.json();
        const nextProducts = Array.isArray(data) ? data : (data.content ?? []);
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
  }, [searchQuery]);

  const handleSelectProduct = (productId: number) => {
    const productElement = document.getElementById(`product-${productId}`);
    productElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const searchResults: HeaderSearchProduct[] = products.slice(0, 10).map(
    (product) => ({
      id: product.id,
      name: product.name,
      currentPrice: product.currentPrice,
    }),
  );

  return (
    <>
      <Header
        searchQuery={searchQuery}
        searchResults={searchResults}
        searchLoading={searchLoading}
        onSearchChange={setSearchQuery}
        onSelectProduct={handleSelectProduct}
      />

      <main className="my-5 flex flex-wrap justify-center gap-15 max-sm:justify-center max-sm:gap-7 xl:mx-10">
        {!searchLoading && products.length === 0 && (
          <p className="text-center text-neutral-500">Товары не найдены</p>
        )}

        {products.map((product) => {
          const productId = String(product.id);

          return (
            <div key={product.id} id={`product-${product.id}`}>
              <Card
                title={product.name}
                price={Number(product.currentPrice ?? 0)}
                image={PRODUCT_PLACEHOLDER}
                isBought={boughtItems.includes(productId)}
                isFavorite={favoriteItems.includes(productId)}
                onBuy={() => handleBuy(productId)}
                onFavorite={() => handleFavorite(productId)}
              />
            </div>
          );
        })}
      </main>
    </>
  );
}