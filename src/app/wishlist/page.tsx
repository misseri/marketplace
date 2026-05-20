"use client";

import { useEffect, useState } from "react";
import Header from "~/app/components/MainPageHeader/page";
import Card from "~/app/components/Card/page";
import { getCurrentUser, startGoogleLogin } from "~/lib/auth";
import { getWishlist, removeFromWishlist, type WishlistItem } from "~/lib/wishlist";
import type { HeaderSearchProduct } from "../components/MainPageHeader/page";

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
  const [favoriteLoadingIds, setFavoriteLoadingIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const loadWishlist = async (page: number) => {
    setLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        setIsLogged(false);
        setWishlistItems([]);
        setTotalPages(0);
        return;
      }

      setIsLogged(true);
      const wishlistPage = await getWishlist(page, pageSize);
      setWishlistItems(wishlistPage.content);
      setTotalPages(wishlistPage.totalPages);
    } catch (error) {
      console.error("Failed to load wishlist:", error);
      setWishlistItems([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWishlist(currentPage);
  }, [currentPage]);

  const handleRemove = async (productId: number) => {
    setFavoriteLoadingIds((prev) => [...prev, productId]);

    try {
      await removeFromWishlist(productId);

      setWishlistItems((prev) => {
        const updated = prev.filter((item) => item.id !== productId);
        if (updated.length === 0 && currentPage > 0) {
          setCurrentPage((p) => p - 1);
        }
        return updated;
      });
    } catch (error) {
      console.error("Failed to remove product from wishlist:", error);
    } finally {
      setFavoriteLoadingIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const filteredWishlistItems = wishlistItems.filter((item) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return true;
    }

    return `${item.name} ${item.description} ${item.categoryName} ${item.sellerName}`
      .toLowerCase()
      .includes(normalizedQuery);
  });

  const searchResults: HeaderSearchProduct[] = filteredWishlistItems
    .slice(0, 10)
    .map((item) => ({
      id: item.id,
      name: item.name,
      currentPrice: item.currentPrice,
    }));

  const handleSelectProduct = (productId: number) => {
    const productElement = document.getElementById(`wishlist-product-${productId}`);
    productElement?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <Header
        searchQuery={searchQuery}
        searchResults={searchResults}
        searchLoading={false}
        onSearchChange={setSearchQuery}
        onSelectProduct={handleSelectProduct}
      />

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
              Здесь собраны товары, которые пользователь отметил сердечком.
              Можно быстро вернуться к ним и убрать лишнее одним нажатием.
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
                Избранное привязано к аккаунту, поэтому сначала нужно
                авторизоваться через Google.
              </p>
              <button
                type="button"
                onClick={startGoogleLogin}
                className="mt-6 rounded-full bg-[#f62877] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#dd226a]"
              >
                Войти и открыть избранное
              </button>
            </div>
          )}

          {!loading && isLogged && wishlistItems.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-[#f3aac6] bg-white/80 px-6 py-12 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-neutral-900">
                Пока пусто
              </h2>
              <p className="mt-3 text-neutral-600">
                Добавьте товары в избранное на главной странице, и они появятся
                здесь.
              </p>
            </div>
          )}

          {!loading && isLogged && wishlistItems.length > 0 && filteredWishlistItems.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-[#f3aac6] bg-white/80 px-6 py-12 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-neutral-900">
                Ничего не найдено
              </h2>
              <p className="mt-3 text-neutral-600">
                Попробуйте изменить запрос в поиске по избранному.
              </p>
            </div>
          )}

          {!loading && isLogged && filteredWishlistItems.length > 0 && (
            <div className="flex flex-wrap justify-center gap-7 xl:justify-start">
              {filteredWishlistItems.map((product) => (
                <div key={product.id} id={`wishlist-product-${product.id}`}>
                  <Card
                    productId={product.id}
                    title={product.name}
                    price={Number(product.currentPrice ?? 0)}
                    image={PRODUCT_PLACEHOLDER}
                    isFavorite={true}
                    isFavoriteLoading={favoriteLoadingIds.includes(product.id)}
                    buyLabel="В корзину"
                    isBuyDisabled={false}
                    showBuyFeedback={false}
                    onBuy={() => undefined}
                    onFavorite={() => {
                      void handleRemove(product.id);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          {!loading && isLogged && totalPages > 1 && filteredWishlistItems.length > 0 && (
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
