"use client";

import { useEffect, useMemo, useState } from "react";
import { authApi } from "~/api/auth";
import { cartApi } from "~/api/cart";
import { ApiError } from "~/api/http";
import { productsApi, type Product } from "~/api/products";
import { wishlistApi, type WishlistItem } from "~/api/wishlist";
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

export default function WishlistPage() {
  const pageSize = 12;
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [cartProductIds, setCartProductIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const loadWishlist = async (page: number) => {
    setLoading(true);

    try {
      const user = await authApi.getCurrentUser();
      if (!user) {
        setIsLogged(false);
        setWishlistItems([]);
        setCartProductIds([]);
        setTotalPages(0);
        return;
      }

      setIsLogged(true);
      const [wishlistPage, cart] = await Promise.all([
        wishlistApi.getWishlist(page, pageSize),
        cartApi.getCart(),
      ]);

      setWishlistItems(wishlistPage.content);
      setTotalPages(wishlistPage.totalPages);
      setCartProductIds(cart.items.map((item) => item.productId));
    } catch (error) {
      console.error("Failed to load wishlist:", error);
      setWishlistItems([]);
      setCartProductIds([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWishlist(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setSearchLoading(true);

        try {
          const nextProducts = await productsApi.getProducts({
            query: searchQuery,
            page: 0,
            size: 10,
            signal: controller.signal,
          });
          setSearchResults(nextProducts);
        } catch (error) {
          if ((error as Error).name !== "AbortError") {
            console.error("Failed to search products:", error);
            setSearchResults([]);
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
  }, [searchQuery]);

  const handleProtectedActionError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      authApi.loginWithGoogle();
      return;
    }

    console.error(error);
  };

  const handleRemove = async (productId: number) => {
    await wishlistApi.removeFromWishlist(productId);

    setWishlistItems((prev) => {
      const updated = prev.filter((item) => item.id !== productId);
      if (updated.length === 0 && currentPage > 0) {
        setCurrentPage((page) => page - 1);
      }
      return updated;
    });
  };

  const handleAddToCart = async (productId: number) => {
    await cartApi.addItem(productId, 1);
    setCartProductIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));
  };

  const headerResults: HeaderSearchProduct[] = useMemo(
    () =>
      searchResults.map((product) => ({
        id: product.id,
        name: product.name,
        currentPrice: product.currentPrice,
      })),
    [searchResults],
  );

  return (
    <>
      <MainPageHeader
        searchQuery={searchQuery}
        searchResults={headerResults}
        searchLoading={searchLoading}
        onSearchChange={setSearchQuery}
        onSelectProduct={(productId) => {
          window.location.href = `/product/${productId}`;
        }}
        onOpenMenu={() => setIsMenuOpen(true)}
      />

      <CategoriesMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <main className="min-h-screen bg-[linear-gradient(180deg,#fff7fb_0%,#ffffff_45%,#f8f8f8_100%)] px-4 py-8 sm:px-8 lg:px-16">
        <section className="mx-auto max-w-6xl">
          <div className="mb-8 rounded-[2rem] border border-[#f7d6e4] bg-white/90 p-6 shadow-[0_20px_60px_rgba(246,40,119,0.08)] backdrop-blur">
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#f62877]">
              Wish List
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-neutral-900 sm:text-4xl">
              Избранные товары
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600 sm:text-base">
              Здесь собраны товары, которые вы отметили сердечком. Можно быстро вернуться к ним,
              перенести в корзину или убрать лишнее одним нажатием.
            </p>
          </div>

          {loading && (
            <div className="rounded-[2rem] border border-dashed border-[#f3aac6] bg-white/70 px-6 py-12 text-center text-neutral-500">
              Загружаем избранное...
            </div>
          )}

          {!loading && !isLogged && (
            <div className="rounded-[2rem] border border-dashed border-[#f3aac6] bg-white/80 px-6 py-12 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-neutral-900">
                Войдите, чтобы открыть wish list
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-neutral-600">
                Избранное привязано к аккаунту, поэтому сначала нужно авторизоваться через Google.
              </p>
              <button
                type="button"
                onClick={() => authApi.loginWithGoogle()}
                className="mt-6 rounded-full bg-[#f62877] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#dd226a]"
              >
                Войти и открыть избранное
              </button>
            </div>
          )}

          {!loading && isLogged && wishlistItems.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-[#f3aac6] bg-white/80 px-6 py-12 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-neutral-900">Пока пусто</h2>
              <p className="mt-3 text-neutral-600">
                Добавьте товары в избранное на главной странице, и они появятся здесь.
              </p>
            </div>
          )}

          {!loading && isLogged && wishlistItems.length > 0 && (
            <div className="flex flex-wrap justify-center gap-7 xl:justify-start">
              {wishlistItems.map((product) => (
                <div key={product.id} id={`wishlist-product-${product.id}`}>
                  <ProductCard
                    id={product.id}
                    title={product.name}
                    price={Number(product.currentPrice ?? 0)}
                    image={PRODUCT_PLACEHOLDER}
                    stockQuantity={product.stockQuantity}
                    isBought={cartProductIds.includes(product.id)}
                    isFavorite={true}
                    buyLabel="В корзину"
                    onBuy={async () => {
                      try {
                        await handleAddToCart(product.id);
                      } catch (error) {
                        handleProtectedActionError(error);
                        throw error;
                      }
                    }}
                    onFavorite={() => {
                      void handleRemove(product.id).catch(handleProtectedActionError);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && isLogged && totalPages > 1 && wishlistItems.length > 0 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                className="rounded-full border border-[#f3aac6] bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:border-[#f62877] enabled:hover:text-[#f62877] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Назад
              </button>
              <span className="text-sm font-medium text-neutral-600">
                Страница {currentPage + 1} из {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={currentPage >= totalPages - 1}
                className="rounded-full border border-[#f3aac6] bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition enabled:hover:border-[#f62877] enabled:hover:text-[#f62877] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Вперед
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
