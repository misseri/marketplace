"use client";

import { Suspense, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "~/api/auth";
import { cartApi } from "~/api/cart";
import { ApiError } from "~/api/http";
import { productsApi, type Product } from "~/api/products";
import { wishlistApi } from "~/api/wishlist";
import CategoriesMenu from "~/features/categories/ui/CategoriesMenu";
import type { HeaderSearchProduct } from "~/features/header/model";
import MainPageHeader from "~/features/header/ui/MainPageHeader";
import ProductCard from "~/features/products/ui/ProductCard";

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

function HomePageContent() {
  const router = useRouter();
  const [boughtItems, setBoughtItems] = useState<string[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId");

  const handleProtectedActionError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      authApi.loginWithGoogle();
      return;
    }

    console.error(error);
  };

  const handleBuy = async (productId: string) => {
    await cartApi.addItem(Number(productId), 1);
    setBoughtItems((prev) =>
      prev.includes(productId) ? prev : [...prev, productId],
    );
  };

  const handleFavorite = async (productId: string) => {
    const numericProductId = Number(productId);

    if (favoriteItems.includes(productId)) {
      await wishlistApi.removeFromWishlist(numericProductId);
      setFavoriteItems((prev) => prev.filter((id) => id !== productId));
      return;
    }

    await wishlistApi.addToWishlist(numericProductId);
    setFavoriteItems((prev) => [...prev, productId]);
  };

  useEffect(() => {
    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      void (async () => {
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
      })();
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery, categoryId]);

  useEffect(() => {
    let cancelled = false;

    if (products.length === 0) {
      setBoughtItems([]);
      setFavoriteItems([]);
      return;
    }

    void (async () => {
      const user = await authApi.getCurrentUser();
      if (!user) {
        if (!cancelled) {
          setBoughtItems([]);
          setFavoriteItems([]);
        }
        return;
      }

      try {
        const [cart, wishlistStatuses] = await Promise.all([
          cartApi.getCart(),
          Promise.allSettled(
            products.map((product) => wishlistApi.getWishlistStatus(product.id)),
          ),
        ]);

        if (cancelled) {
          return;
        }

        setBoughtItems(cart.items.map((item) => String(item.productId)));
        setFavoriteItems(
          wishlistStatuses.flatMap((result) =>
            result.status === "fulfilled" && result.value.inWishlist
              ? [String(result.value.productId)]
              : [],
          ),
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to sync cart/wishlist state:", error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [products]);

  const handleSelectProduct = (productId: number) => {
    const productElement = document.getElementById(`product-${productId}`);
    productElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleResetCategory = () => {
    router.push("/");
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

      <CategoriesMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="my-5 flex w-full flex-col items-center px-4 sm:px-6 xl:px-10">
        {categoryId && (
          <div className="mb-6 flex w-full max-w-[1440px]">
            <button
              type="button"
              onClick={handleResetCategory}
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-[#F62877] hover:text-[#F62877]"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Назад ко всем товарам</span>
            </button>
          </div>
        )}

        <div className="flex w-full flex-wrap justify-center gap-15 max-sm:justify-center max-sm:gap-7">
          {searchLoading && products.length === 0 && (
            <p className="mt-10 w-full text-center text-neutral-500">
              Загрузка товаров...
            </p>
          )}

          {!searchLoading && products.length === 0 && (
            <div className="mt-10 flex w-full flex-col items-center justify-center">
              <p className="text-center text-xl text-neutral-500">Товары не найдены</p>
              <p className="mt-2 text-center text-sm text-neutral-400">
                Попробуйте изменить поисковый запрос или выбрать другую категорию
              </p>
            </div>
          )}

          {products.map((product) => {
            const productIdString = String(product.id);

            return (
              <div key={product.id} id={`product-${product.id}`}>
                <ProductCard
                  id={product.id}
                  title={product.name}
                  price={Number(product.currentPrice ?? 0)}
                  image={PRODUCT_PLACEHOLDER}
                  stockQuantity={product.stockQuantity}
                  isBought={boughtItems.includes(productIdString)}
                  isFavorite={favoriteItems.includes(productIdString)}
                  onBuy={async () => {
                    try {
                      await handleBuy(productIdString);
                    } catch (error) {
                      handleProtectedActionError(error);
                      throw error;
                    }
                  }}
                  onFavorite={() => {
                    void handleFavorite(productIdString).catch(handleProtectedActionError);
                  }}
                />
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-neutral-500">Загрузка...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
