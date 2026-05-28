"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { authApi } from "~/api/auth";
import { cartApi, type CartItem, type CartResponse } from "~/api/cart";
import { ApiError } from "~/api/http";
import { productsApi, type Product } from "~/api/products";
import CategoriesMenu from "~/features/categories/ui/CategoriesMenu";
import type { HeaderSearchProduct } from "~/features/header/model";
import MainPageHeader from "~/features/header/ui/MainPageHeader";

const formatPrice = (price: number) => `${new Intl.NumberFormat("ru-RU").format(price)} ₽`;

const preserveCartItemOrder = (previousItems: CartItem[], nextCart: CartResponse): CartResponse => {
  const previousOrder = new Map(
    previousItems.map((item, index) => [item.productId, index] as const),
  );

  const items = [...nextCart.items].sort((left, right) => {
    const leftIndex = previousOrder.get(left.productId) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = previousOrder.get(right.productId) ?? Number.MAX_SAFE_INTEGER;
    return leftIndex - rightIndex;
  });

  return {
    ...nextCart,
    items,
  };
};

export default function CartPage() {
  const [cart, setCart] = useState<CartResponse>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [isLogged, setIsLogged] = useState(false);
  const [busyProductIds, setBusyProductIds] = useState<number[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const loadCart = async () => {
    setLoading(true);

    try {
      const user = await authApi.getCurrentUser();
      if (!user) {
        setIsLogged(false);
        setCart({ items: [], total: 0 });
        return;
      }

      setIsLogged(true);
      setCart(await cartApi.getCart());
    } catch (error) {
      console.error("Failed to load cart:", error);
      setCart({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCart();
  }, []);

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

  const headerResults: HeaderSearchProduct[] = useMemo(
    () =>
      searchResults.map((product) => ({
        id: product.id,
        name: product.name,
        currentPrice: product.currentPrice,
      })),
    [searchResults],
  );

  const withBusyProduct = async (productId: number, task: () => Promise<void>) => {
    setBusyProductIds((prev) => [...prev, productId]);

    try {
      await task();
    } finally {
      setBusyProductIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const handleQuantityChange = async (productId: number, quantity: number) => {
    await withBusyProduct(productId, async () => {
      if (quantity <= 0) {
        await cartApi.removeItem(productId);
        const nextCart = await cartApi.getCart();
        setCart((prev) => preserveCartItemOrder(prev.items, nextCart));
        return;
      }

      const nextCart = await cartApi.updateQuantity(productId, quantity);
      setCart((prev) => preserveCartItemOrder(prev.items, nextCart));
    });
  };

  const handleClearCart = async () => {
    setIsClearing(true);
    try {
      await cartApi.clearCart();
      setCart({ items: [], total: 0 });
    } finally {
      setIsClearing(false);
    }
  };

  const handleProtectedActionError = (error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      authApi.loginWithGoogle();
      return;
    }

    console.error(error);
  };

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

      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff5eb_0%,_#fff9fb_45%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-10">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(246,40,119,0.10)] backdrop-blur">
            <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Корзина
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Проверяйте состав заказа, меняйте количество и быстро переходите к покупке.
            </p>
          </div>

          {loading && (
            <div className="rounded-[2rem] border border-dashed border-[#f3c6d9] bg-white/70 px-6 py-12 text-center text-slate-500">
              Загружаем корзину...
            </div>
          )}

          {!loading && !isLogged && (
            <div className="rounded-[2rem] border border-dashed border-[#f3c6d9] bg-white/80 px-6 py-12 text-center shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">
                Войдите, чтобы открыть корзину
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-600">
                Корзина привязана к аккаунту, поэтому нужно сначала войти.
              </p>
              <button
                type="button"
                onClick={() => authApi.loginWithGoogle()}
                className="mt-6 rounded-full bg-[#f62877] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#dd226a]"
              >
                Войти через Google
              </button>
            </div>
          )}

          {!loading && isLogged && cart.items.length === 0 && (
            <div className="rounded-[2rem] border border-dashed border-[#f3c6d9] bg-white/80 px-6 py-12 text-center shadow-sm">
              <ShoppingCart className="mx-auto h-10 w-10 text-[#f62877]" />
              <h2 className="mt-4 text-2xl font-semibold text-slate-900">Корзина пока пуста</h2>
              <p className="mt-3 text-slate-600">
                Добавьте товары с главной страницы или карточки товара.
              </p>
              <Link
                href="/"
                className="mt-6 inline-flex rounded-full border border-[#f3bfd0] px-5 py-3 text-sm font-semibold text-[#f62877] transition hover:bg-[#fff1f6]"
              >
                Перейти к товарам
              </Link>
            </div>
          )}

          {!loading && isLogged && cart.items.length > 0 && (
            <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:p-6">
                <div className="space-y-4">
                  {cart.items.map((item) => {
                    const isBusy = busyProductIds.includes(item.productId);

                    return (
                      <div
                        key={item.productId}
                        className="flex flex-col gap-4 rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:gap-6"
                      >
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/product/${item.productId}`}
                            className="block break-words text-lg font-semibold leading-6 text-slate-900 transition hover:text-[#f62877]"
                          >
                            {item.productName}
                          </Link>
                          <p className="mt-1 break-words text-sm text-slate-500">
                            {formatPrice(item.price)} за шт. • Остаток: {item.stockQuantity}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap lg:justify-end">
                          <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                void handleQuantityChange(item.productId, item.quantity - 1).catch(
                                  handleProtectedActionError,
                                );
                              }}
                              className="rounded-full p-2 text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="min-w-10 text-center text-sm font-semibold text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isBusy || item.quantity >= item.stockQuantity}
                              onClick={() => {
                                void handleQuantityChange(item.productId, item.quantity + 1).catch(
                                  handleProtectedActionError,
                                );
                              }}
                              className="rounded-full p-2 text-slate-600 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="min-w-28 text-left text-sm font-semibold text-slate-900 sm:text-right">
                            {formatPrice(item.lineTotal)}
                          </div>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => {
                              void handleQuantityChange(item.productId, 0).catch(handleProtectedActionError);
                            }}
                            className="rounded-full border border-rose-200 p-3 text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <aside className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <h2 className="text-2xl font-bold text-slate-900">Итого</h2>
                <div className="mt-6 flex items-end justify-between gap-4">
                  <span className="text-slate-500">Сумма</span>
                  <span className="text-right text-3xl font-bold text-slate-900">
                    {formatPrice(cart.total)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Товаров в корзине: {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                </p>
                <button
                  type="button"
                  className="mt-8 w-full rounded-full bg-[linear-gradient(135deg,_#f62877_0%,_#ff7f50_100%)] px-6 py-4 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(246,40,119,0.22)] transition hover:-translate-y-0.5"
                >
                  Перейти к оформлению
                </button>
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={() => {
                    void handleClearCart().catch(handleProtectedActionError);
                  }}
                  className="mt-3 w-full rounded-full border border-slate-200 px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Очистить корзину
                </button>
              </aside>
            </div>
          )}
        </section>
      </main>
    </>
  );
}
