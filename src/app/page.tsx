"use client";

import { useEffect, useState } from "react";
import Header, {
  type HeaderSearchProduct,
} from "./components/MainPageHeader/page";
import Card from "./components/Card/page";
import { getCurrentUser, startGoogleLogin } from "~/lib/auth";
import { type ApiProduct, searchProducts } from "~/lib/products";
import { addToWishlist, getWishlist, removeFromWishlist } from "~/lib/wishlist";

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
  const [favoriteItems, setFavoriteItems] = useState<number[]>([]);
  const [favoriteLoadingIds, setFavoriteLoadingIds] = useState<number[]>([]);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const handleBuy = (productId: string) => {
    setBoughtItems((prev) => [...prev, productId]);
  };

  const handleFavorite = async (productId: number) => {
    if (!isLogged) {
      startGoogleLogin();
      return;
    }

    setFavoriteLoadingIds((prev) => [...prev, productId]);

    try {
      if (favoriteItems.includes(productId)) {
        await removeFromWishlist(productId);
        setFavoriteItems((prev) => prev.filter((id) => id !== productId));
      } else {
        await addToWishlist(productId);
        setFavoriteItems((prev) => [...prev, productId]);
      }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
    } finally {
      setFavoriteLoadingIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  useEffect(() => {
    const loadAuthAndWishlist = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          setIsLogged(false);
          setFavoriteItems([]);
          return;
        }

        setIsLogged(true);

        const wishlistPage = await getWishlist();
        setFavoriteItems(wishlistPage.content.map((item) => item.id));
      } catch (error) {
        console.error("Failed to load auth state:", error);
        setIsLogged(false);
        setFavoriteItems([]);
      }
    };

    void loadAuthAndWishlist();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setSearchLoading(true);

      try {
        const nextProducts = await searchProducts(searchQuery);

        if (!controller.signal.aborted) {
          setProducts(nextProducts);
        }
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
                productId={product.id}
                title={product.name}
                price={Number(product.currentPrice ?? 0)}
                image={PRODUCT_PLACEHOLDER}
                isBought={boughtItems.includes(productId)}
                isFavorite={favoriteItems.includes(product.id)}
                isFavoriteLoading={favoriteLoadingIds.includes(product.id)}
                onBuy={() => handleBuy(productId)}
                onFavorite={() => {
                  void handleFavorite(product.id);
                }}
              />
            </div>
          );
        })}
      </main>
    </>
  );
}
