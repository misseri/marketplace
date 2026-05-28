"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CircleUser,
  Heart,
  LogIn,
  LogOut,
  Menu,
  Search,
  ShoppingBasket,
  ShoppingCart,
  Store,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { authApi } from "~/api/auth";
import type { HeaderSearchProduct } from "../model";
import GoogleIcon from "./GoogleIcon";

interface HeaderProps {
  searchQuery: string;
  searchResults: HeaderSearchProduct[];
  searchLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelectProduct: (productId: number) => void;
  onOpenMenu: () => void;
}

export default function MainPageHeader({
  searchQuery,
  searchResults,
  searchLoading,
  onSearchChange,
  onSelectProduct,
  onOpenMenu,
}: HeaderProps) {
  const [isLogged, setIsLogged] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);

  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authApi.getCurrentUser();
        setIsLogged(Boolean(user));
      } catch (error) {
        console.error("Not logged:", error);
        setIsLogged(false);
      } finally {
        setIsAuthLoading(false);
      }
    };

    void checkAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIsSearchDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      setIsLogged(false);
    }
  };

  if (isAuthLoading) {
    return <header>Проверка авторизации...</header>;
  }

  return (
    <header
      ref={headerRef}
      className="relative z-40 mx-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-gray-400 py-3 sm:mx-8 sm:gap-4 sm:py-4 md:mx-12 md:gap-4.5 md:py-4.5 lg:mx-16 xl:mx-20"
    >
      <Link
        href="/"
        className="flex flex-shrink-0 select-none items-center gap-1.5 text-lg font-bold text-[#F62877] sm:gap-2 sm:text-xl md:text-2xl"
      >
        <Store className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
        <span className="whitespace-nowrap">PickMeMarket</span>
      </Link>

      <div className="relative order-3 z-50 w-full min-w-0 rounded-2xl bg-neutral-200 px-3 py-1.5 sm:order-2 sm:w-auto sm:max-w-2xl sm:flex-1 sm:rounded-3xl sm:px-4 sm:py-2 md:px-5 lg:max-w-3xl xl:max-w-4xl">
        <div className="flex items-center gap-3 sm:gap-4 md:gap-5">
          <Search className="h-5 w-5 flex-shrink-0 text-neutral-400 sm:h-5 sm:w-5" />

          <input
            type="text"
            placeholder="Поиск товара"
            className="w-full bg-transparent text-sm text-black outline-none sm:text-base"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={() => setIsSearchDropdownOpen(true)}
            onClick={() => {
              if (searchQuery) {
                setIsSearchDropdownOpen(true);
              }
            }}
          />

          {searchQuery && (
            <button
              type="button"
              className="flex-shrink-0 text-neutral-400 hover:text-neutral-600"
              onClick={() => {
                onSearchChange("");
                setIsSearchDropdownOpen(false);
              }}
            >
              <X className="h-5 w-5 cursor-pointer" />
            </button>
          )}
        </div>

        {isSearchDropdownOpen && searchQuery && (
          <>
            {!searchLoading && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-[80] mt-1.5 w-full rounded-2xl bg-white p-2 shadow-xl">
                <ul className="max-h-60 overflow-y-auto text-sm">
                  {searchResults.map((product) => (
                    <li
                      key={product.id}
                      className="cursor-pointer px-2 py-1.5 hover:bg-neutral-100"
                      onClick={() => {
                        onSelectProduct(product.id);
                        setIsSearchDropdownOpen(false);
                      }}
                    >
                      <div className="text-lg font-semibold">{product.name}</div>
                      <div className="text-base font-semibold text-[#F62877]">
                        {(product.currentPrice ?? 0).toLocaleString()} ₽
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {searchLoading && (
              <div className="absolute left-0 top-full z-[80] mt-1.5 rounded-2xl bg-white p-2 text-xs text-neutral-500 shadow-xl">
                Загрузка...
              </div>
            )}

            {!searchLoading && searchResults.length === 0 && (
              <div className="absolute left-0 top-full z-[80] mt-1.5 rounded-2xl bg-white p-2 text-xs text-neutral-500 shadow-xl">
                Ничего не найдено
              </div>
            )}
          </>
        )}
      </div>

      <nav className="order-2 flex-shrink-0 sm:order-3">
        <ul className="flex items-center justify-between gap-4 text-[#F62877] sm:gap-6 md:gap-8 lg:gap-9.5">
          <li className="h-6 w-6 sm:h-7 sm:w-7 md:h-[30px] md:w-[30px]">
            <button
              className="flex h-full w-full cursor-pointer items-center justify-center"
              onClick={onOpenMenu}
            >
              <Menu className="h-full w-full" />
            </button>
          </li>
          <li className="h-6 w-6 sm:h-7 sm:w-7 md:h-[30px] md:w-[30px]">
            <Link
              href="/cart"
              className="flex h-full w-full cursor-pointer items-center justify-center"
            >
              <ShoppingCart className="h-full w-full" />
            </Link>
          </li>
          <li className="h-6 w-6 sm:h-7 sm:w-7 md:h-[30px] md:w-[30px]">
            {isLogged ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-full w-full cursor-pointer items-center justify-center">
                    <CircleUser className="h-full w-full" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="z-[90] w-44" align="end" alignOffset={-10}>
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <CircleUser /> Профиль
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/cart">
                        <ShoppingBasket /> Корзина
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wishlist">
                        <Heart /> Избранное
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut /> Выйти
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <button className="flex h-full w-full cursor-pointer items-center justify-center">
                    <LogIn className="h-full w-full" />
                  </button>
                </DialogTrigger>
                <DialogContent className="overflow-hidden sm:max-w-[425px]">
                  <div className="flex flex-col items-center justify-center gap-[26px] p-5">
                    <DialogHeader>
                      <DialogTitle className="text-2xl text-[#F62877]">
                        Вход
                      </DialogTitle>
                    </DialogHeader>
                    <button
                      onClick={() => authApi.loginWithGoogle()}
                      className="flex w-full max-w-[280px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-neutral-200 px-4 py-2 text-black hover:bg-neutral-300"
                    >
                      <GoogleIcon />
                      Войти с помощью Google
                    </button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </li>
        </ul>
      </nav>
    </header>
  );
}
