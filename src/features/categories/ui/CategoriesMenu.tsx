"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { categoriesApi, type Category } from "~/api/categories";

interface CategoriesMenuProps {
  isOpen: boolean;
  onClose: () => void;
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
  const [childrenCache, setChildrenCache] = useState<Record<number, Category[]>>(
    {},
  );
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

  const handleCategoryClick = async (category: Category) => {
    if (!category.hasChildren) {
      openCategoryProducts(category.id);
      return;
    }

    setCategoryPath((prev) => [...prev, category]);
    await loadChildren(category.id);
  };

  const handleBackClick = () => {
    setCategoryPath((prev) => prev.slice(0, -1));
    setError(null);
  };

  const currentParent = categoryPath[categoryPath.length - 1] ?? null;
  const currentCategories = currentParent
    ? (childrenCache[currentParent.id] ?? [])
    : rootCategories;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleCloseMenu}
      />

      <div className="relative z-10 flex h-full w-80 flex-col overflow-y-auto bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-4">
          {currentParent ? (
            <button
              onClick={handleBackClick}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
              <ChevronLeft className="h-5 w-5" />
              <span>Назад</span>
            </button>
          ) : (
            <div className="text-sm font-medium text-gray-800">Категории</div>
          )}

          <button
            onClick={handleCloseMenu}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {currentParent && (
          <div className="px-6 pt-4 text-sm text-gray-500">
            {currentParent.name}
          </div>
        )}

        <div className="flex-1 py-2">
          {isLoading && !currentParent ? (
            <p className="px-6 py-4 text-gray-500">Загрузка...</p>
          ) : isLoadingChildren && currentParent && !childrenCache[currentParent.id] ? (
            <p className="px-6 py-4 text-gray-500">Загрузка...</p>
          ) : error ? (
            <p className="px-6 py-4 text-red-500">{error}</p>
          ) : currentCategories.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-500">
              Нет подкатегорий
            </p>
          ) : (
            <ul>
              {currentCategories.map((category) => (
                <li
                  key={category.id}
                  onClick={() => void handleCategoryClick(category)}
                  className="flex cursor-pointer items-center justify-between px-6 py-3 text-[15px] text-gray-800 hover:bg-gray-50 hover:text-[#F62877]"
                >
                  <span>{category.name}</span>
                  {category.hasChildren && (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
