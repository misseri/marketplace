"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { categoriesApi, type Category } from "~/api/categories";

interface CategoriesMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CategoryListProps {
  categories: Category[];
  activeCategoryId?: number | null;
  onSelect: (category: Category) => void;
}

function CategoryList({
  categories,
  activeCategoryId = null,
  onSelect,
}: CategoryListProps) {
  return (
    <ul className="py-3">
      {categories.map((category) => {
        const isActive = activeCategoryId === category.id;

        return (
          <li key={category.id}>
            <button
              type="button"
              onClick={() => onSelect(category)}
              className={`flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-lg font-medium transition-colors ${
                isActive
                  ? "bg-[#FFF0F6] text-[#F62877]"
                  : "text-gray-800 hover:bg-gray-50 hover:text-[#F62877]"
              }`}
            >
              <span className="min-w-0 flex-1 break-words">
                {category.name}
              </span>
              {category.hasChildren && (
                <ChevronRight
                  className={`h-5 w-5 flex-shrink-0 ${
                    isActive ? "text-[#F62877]" : "text-gray-400"
                  }`}
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default function CategoriesMenu({
  isOpen,
  onClose,
}: CategoriesMenuProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rootCategories, setRootCategories] = useState<Category[]>([]);
  const [childrenCache, setChildrenCache] = useState<
    Record<number, Category[]>
  >({});
  const [categoryPath, setCategoryPath] = useState<Category[]>([]);

  useEffect(() => {
    if (!isOpen || rootCategories.length > 0) {
      return;
    }

    const fetchRootCategories = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await categoriesApi.getRootCategories();
        setRootCategories(data);
      } catch (err) {
        console.error("Failed to load root categories", err);
        setError("Ошибка загрузки категорий");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRootCategories();
  }, [isOpen, rootCategories.length]);

  const handleCloseMenu = () => {
    setCategoryPath([]);
    setError(null);
    onClose();
  };

  const openCategoryProducts = (categoryId: number) => {
    router.push(`/?categoryId=${categoryId}`);
    handleCloseMenu();
  };

  const loadChildren = async (categoryId: number) => {
    if (childrenCache[categoryId]) {
      return;
    }

    setIsLoadingChildren(true);
    setError(null);

    try {
      const children = await categoriesApi.getChildCategories(categoryId);
      setChildrenCache((prev) => ({ ...prev, [categoryId]: children }));
    } catch (err) {
      console.error("Failed to load child categories", err);
      setError("Ошибка загрузки подкатегорий");
    } finally {
      setIsLoadingChildren(false);
    }
  };

  const handleNestedCategoryClick = async (category: Category) => {
    if (!category.hasChildren) {
      openCategoryProducts(category.id);
      return;
    }

    setCategoryPath((prev) => [...prev, category]);
    await loadChildren(category.id);
  };

  const handleRootCategoryClick = async (category: Category) => {
    if (!category.hasChildren) {
      openCategoryProducts(category.id);
      return;
    }

    setCategoryPath([category]);
    await loadChildren(category.id);
  };

  const handleBackClick = () => {
    setCategoryPath((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleResetCategories = () => {
    router.push("/");
    setCategoryPath([]);
    setError(null);
    onClose();
  };

  const currentParent = categoryPath[categoryPath.length - 1] ?? null;
  const selectedRootCategory = categoryPath[0] ?? null;
  const currentCategories = currentParent
    ? (childrenCache[currentParent.id] ?? [])
    : [];

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleCloseMenu}
      />

      <div className="relative z-10 flex h-full w-full max-w-[920px] flex-col overflow-hidden sm:flex-row">
        <div className="flex w-full flex-col border-b border-gray-100 bg-white shadow-xl sm:w-[360px] sm:border-r sm:border-b-0">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <div className="text-xs font-semibold tracking-[0.22em] text-gray-400 uppercase">
                Каталог
              </div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                Категории
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseMenu}
              className="text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <p className="px-6 py-6 text-base text-gray-500">Загрузка...</p>
            ) : error && !currentParent ? (
              <p className="px-6 py-6 text-base text-red-500">{error}</p>
            ) : (
              <CategoryList
                categories={rootCategories}
                activeCategoryId={selectedRootCategory?.id}
                onSelect={(category) => void handleRootCategoryClick(category)}
              />
            )}
          </div>

          <div className="border-t border-gray-100 px-6 py-5">
            <button
              type="button"
              onClick={handleResetCategories}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-base font-semibold text-gray-700 transition-colors hover:border-[#F62877] hover:text-[#F62877]"
            >
              Сбросить категории
            </button>
          </div>
        </div>

        {currentParent && (
          <div className="flex w-full min-w-0 flex-col bg-white shadow-xl sm:flex-1">
            <div className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-5">
              <button
                type="button"
                onClick={handleBackClick}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Назад</span>
              </button>

              <div className="text-sm text-gray-400">
                {categoryPath.length > 1
                  ? `${categoryPath.length - 1} уровень`
                  : "Подкатегории"}
              </div>
            </div>

            <div className="border-b border-gray-100 bg-white px-6 py-5">
              <div className="text-xs font-semibold tracking-[0.22em] text-gray-400 uppercase">
                Выбрано
              </div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {currentParent.name}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-white">
              {isLoadingChildren && !childrenCache[currentParent.id] ? (
                <p className="px-6 py-6 text-base text-gray-500">Загрузка...</p>
              ) : error ? (
                <p className="px-6 py-6 text-base text-red-500">{error}</p>
              ) : currentCategories.length === 0 ? (
                <p className="px-6 py-6 text-base text-gray-500">
                  Нет подкатегорий
                </p>
              ) : (
                <CategoryList
                  categories={currentCategories}
                  onSelect={(category) =>
                    void handleNestedCategoryClick(category)
                  }
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
