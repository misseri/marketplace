"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Heart,
  Package,
  SearchX,
  Star,
} from "lucide-react";
import { categoriesApi } from "~/api/categories";
import {
  productsApi,
  type Product,
  type ProductDetails,
} from "~/api/products";
import CategoriesMenu from "~/features/categories/ui/CategoriesMenu";
import type { HeaderSearchProduct } from "~/features/header/model";
import MainPageHeader from "~/features/header/ui/MainPageHeader";

const PRODUCT_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="880" viewBox="0 0 720 880">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fff4df"/>
          <stop offset="52%" stop-color="#ffe4d6"/>
          <stop offset="100%" stop-color="#ffe1ec"/>
        </linearGradient>
      </defs>
      <rect width="720" height="880" rx="42" fill="url(#bg)"/>
      <circle cx="360" cy="270" r="124" fill="#ffffff" fill-opacity="0.9"/>
      <path d="M290 238c0-39 31-70 70-70s70 31 70 70v95c0 39-31 70-70 70s-70-31-70-70z" fill="#f76598"/>
      <path d="M268 393c20 31 52 49 92 49s72-18 92-49" stroke="#f76598" stroke-width="24" stroke-linecap="round" fill="none"/>
      <rect x="170" y="505" width="380" height="36" rx="18" fill="#ffffff" fill-opacity="0.84"/>
      <rect x="220" y="564" width="280" height="28" rx="14" fill="#ffffff" fill-opacity="0.68"/>
      <rect x="255" y="615" width="210" height="28" rx="14" fill="#ffffff" fill-opacity="0.56"/>
      <text x="50%" y="742" dominant-baseline="middle" text-anchor="middle" fill="#7c2d4d" font-family="Arial" font-size="42" font-weight="700">
        Product image
      </text>
    </svg>
  `);

const formatPrice = (price: number | null) =>
  price === null
    ? "Цена уточняется"
    : `${new Intl.NumberFormat("ru-RU").format(price)} ₽`;

const formatRating = (rating: number | null) =>
  rating === null ? "—" : rating.toFixed(1);

const getAvailability = (stockQuantity: number) => {
  if (stockQuantity > 0) {
    return {
      label: "В наличии",
      classes: "border-emerald-200 bg-emerald-50/90 text-emerald-700",
    };
  }

  return {
    label: "Нет в наличии",
    classes: "border-rose-200 bg-rose-50/90 text-rose-700",
  };
};

type CategoryPathNode = {
  id: number;
  name: string;
};

async function findCategoryPath(
  targetId: number,
  parentId = 0,
  trail: CategoryPathNode[] = [],
): Promise<CategoryPathNode[] | null> {
  const page = await categoriesApi.getCategories({ parentId, size: 100 });

  for (const category of page.content) {
    const nextTrail = [...trail, { id: category.id, name: category.name }];

    if (category.id === targetId) {
      return nextTrail.slice(-3);
    }

    if (category.hasChildren) {
      const nestedMatch = await findCategoryPath(targetId, category.id, nextTrail);
      if (nestedMatch) {
        return nestedMatch.slice(-3);
      }
    }
  }

  return null;
}

export default function ProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = Number(params.id);

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [categoryPath, setCategoryPath] = useState<CategoryPathNode[]>([]);
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    if (!Number.isInteger(productId) || productId <= 0) {
      router.replace("/");
      return;
    }

    let cancelled = false;

    void (async () => {
      setIsLoading(true);

      try {
        const nextProduct = await productsApi.getProductById(productId);

        if (!nextProduct) {
          router.replace("/");
          return;
        }

        if (!cancelled) {
          setProduct(nextProduct);
        }

        const path = await findCategoryPath(nextProduct.categoryId);
        if (!cancelled) {
          setCategoryPath(path ?? [{ id: nextProduct.categoryId, name: nextProduct.categoryName }]);
        }
      } catch (error) {
        console.error("Failed to load product:", error);
        if (!cancelled) {
          setProduct(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [productId, router]);

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
            console.error("Failed to load product search:", error);
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
      searchResults.map((searchProduct) => ({
        id: searchProduct.id,
        name: searchProduct.name,
        currentPrice: searchProduct.currentPrice,
      })),
    [searchResults],
  );

  const categoryLine = categoryPath.map((item) => item.name).join(" - ");
  const availability = getAvailability(product?.stockQuantity ?? 0);

  return (
    <>
      <div className="relative z-50">
        <MainPageHeader
          searchQuery={searchQuery}
          searchResults={headerResults}
          searchLoading={searchLoading}
          onSearchChange={setSearchQuery}
          onSelectProduct={(selectedProductId) => {
            router.push(`/product/${selectedProductId}`);
          }}
          onOpenMenu={() => setIsMenuOpen(true)}
        />
      </div>

      <CategoriesMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
      />

      <main className="relative z-0 min-h-screen bg-[radial-gradient(circle_at_top,_#fff6ea_0%,_#fff0ef_38%,_#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-[#F62877] hover:text-[#F62877]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Назад к товарам</span>
          </Link>

          {isLoading ? (
            <section className="rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-[0_25px_80px_rgba(244,114,182,0.12)] backdrop-blur">
              <div className="grid animate-pulse gap-8 lg:grid-cols-[1.03fr_0.97fr]">
                <div className="aspect-[4/5] rounded-[2rem] bg-white/80" />
                <div className="space-y-5">
                  <div className="h-8 w-64 rounded-full bg-white/80" />
                  <div className="h-16 w-full rounded-[1.5rem] bg-white/80" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="h-28 rounded-[1.5rem] bg-white/80" />
                    <div className="h-28 rounded-[1.5rem] bg-white/80" />
                    <div className="h-28 rounded-[1.5rem] bg-white/80" />
                  </div>
                  <div className="h-40 rounded-[1.75rem] bg-white/80" />
                  <div className="h-14 rounded-full bg-white/80" />
                </div>
              </div>
            </section>
          ) : !product ? (
            <section className="rounded-[2rem] border border-white/60 bg-white/80 px-6 py-14 text-center shadow-[0_25px_80px_rgba(244,114,182,0.12)] backdrop-blur">
              <div className="mx-auto flex max-w-xl flex-col items-center gap-4">
                <SearchX className="h-12 w-12 text-[#F62877]" />
                <h1 className="text-3xl font-bold text-slate-900">
                  Товар не найден
                </h1>
                <p className="text-base text-slate-500">
                  Похоже, этого товара больше нет или ссылка устарела.
                </p>
              </div>
            </section>
          ) : (
            <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/75 shadow-[0_25px_80px_rgba(244,114,182,0.14)] backdrop-blur">
              <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="relative overflow-hidden bg-[linear-gradient(160deg,_rgba(255,238,220,0.96)_0%,_rgba(255,229,226,0.92)_52%,_rgba(255,255,255,0.96)_100%)] p-6 sm:p-8 lg:p-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(246,40,119,0.10),_transparent_30%)]" />
                  <div className="relative flex h-full flex-col">
                    <div className="relative mx-auto w-full max-w-xl">
                      <img
                        src={PRODUCT_PLACEHOLDER}
                        alt={`Заглушка изображения товара ${product.name}`}
                        className="aspect-[4/5] w-full rounded-[2rem] border border-white/80 bg-white object-cover shadow-[0_24px_70px_rgba(15,23,42,0.12)]"
                      />

                      <div className="absolute top-0 left-0 flex max-w-full flex-col items-start gap-3 p-4 sm:p-5">
                        {categoryPath.length > 0 && (
                          <span className="max-w-full rounded-full border border-white/85 bg-white/88 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm">
                            {categoryLine}
                          </span>
                        )}
                        <span
                          className={`rounded-full border px-4 py-2 text-sm font-semibold shadow-sm ${availability.classes}`}
                        >
                          {availability.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6 p-6 sm:p-8 lg:p-10">
                  <div className="space-y-4">
                    <h1 className="text-3xl leading-tight font-bold text-slate-900 sm:text-4xl">
                      {product.name}
                    </h1>

                    <div className="rounded-[1.75rem] border border-white/80 bg-[linear-gradient(135deg,_rgba(255,248,240,0.98)_0%,_rgba(255,233,240,0.96)_100%)] p-5 shadow-[0_18px_40px_rgba(244,114,182,0.10)]">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#d55384]">
                        Цена
                      </p>
                      <p className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">
                        {formatPrice(product.currentPrice)}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-semibold">Рейтинг</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {formatRating(product.averageRating)}
                        </p>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <BadgeCheck className="h-4 w-4 text-sky-600" />
                          <span className="text-sm font-semibold">Продавец</span>
                        </div>
                        <p className="mt-2 text-lg font-bold text-slate-900">
                          {product.sellerName}
                        </p>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-slate-50/90 p-4">
                        <div className="flex items-center gap-2 text-slate-500">
                          <Package className="h-4 w-4 text-emerald-600" />
                          <span className="text-sm font-semibold">Остаток</span>
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                          {product.stockQuantity}
                        </p>
                      </div>
                    </div>
                  </div>

                  <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-900">Описание</h2>
                    <p className="mt-4 text-base leading-7 text-slate-600">
                      {product.description}
                    </p>
                  </section>

                  <div className="flex items-stretch gap-3">
                    <button
                      type="button"
                      className="inline-flex min-h-14 flex-1 items-center justify-center rounded-full bg-[linear-gradient(135deg,_#f62877_0%,_#ff7f50_100%)] px-6 text-base font-bold text-white shadow-[0_18px_40px_rgba(246,40,119,0.26)] transition-transform hover:-translate-y-0.5"
                    >
                      Добавить в корзину
                    </button>

                    <button
                      type="button"
                      aria-label={
                        isWishlisted
                          ? "Убрать из избранного"
                          : "Добавить в избранное"
                      }
                      onClick={() => setIsWishlisted((prev) => !prev)}
                      className={`inline-flex min-h-14 min-w-14 items-center justify-center rounded-full border transition-all ${
                        isWishlisted
                          ? "border-[#f7b5cc] bg-[#fff1f6] text-[#F62877] shadow-[0_12px_30px_rgba(246,40,119,0.16)]"
                          : "border-slate-200 bg-slate-50 text-slate-500 shadow-sm hover:border-[#f3bfd0] hover:bg-white hover:text-[#F62877]"
                      }`}
                    >
                      <Heart
                        className="h-6 w-6"
                        fill={isWishlisted ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
