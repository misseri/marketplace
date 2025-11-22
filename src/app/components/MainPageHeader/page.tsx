"use client";

import {
  Search,
  LogIn,
  Menu,
  CircleUser,
  ShoppingCart,
  ShoppingBasket,
  Store,
  Heart,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import GoogleSVG from "./img/GoogleSVG";
import { useState } from "react";

export default function Header() {
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  const handleLogging = () => {
    setIsLogged(true);
    setIsDialogOpen(false);
  };

  const handleLogout = () => {
    setIsLogged(false);
  };

  return (
    <header className="mx-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-gray-400 py-3 sm:mx-8 sm:gap-4 sm:py-4 md:mx-12 md:gap-4.5 md:py-4.5 lg:mx-16 xl:mx-20">
      <div className="flex flex-shrink-0 gap-1.5 text-lg font-bold text-[#F62877] select-none sm:gap-2 sm:text-xl md:text-2xl">
        <Store className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8" />
        <span className="whitespace-nowrap">PickMeMarket</span>
      </div>

      <div className="order-3 w-full min-w-0 rounded-2xl bg-neutral-200 px-3 py-1.5 sm:order-2 sm:w-auto sm:max-w-2xl sm:flex-1 sm:rounded-3xl sm:px-4 sm:py-2 md:px-5 lg:max-w-3xl xl:max-w-4xl">
        <div className="flex items-center justify-between gap-3 sm:gap-4 md:gap-5">
          <Search className="h-5 w-5 flex-shrink-0 text-neutral-400 sm:h-5 sm:w-5" />
          <input
            type="text"
            placeholder="Поиск товара"
            className="w-full bg-transparent text-sm text-black outline-none sm:text-base"
          />
        </div>
      </div>
      <nav className="order-2 flex-shrink-0 sm:order-3">
        <ul className="flex items-center justify-between gap-4 text-[#F62877] sm:gap-6 md:gap-8 lg:gap-9.5">
          <li className="h-6 w-6 sm:h-7 sm:w-7 md:h-[30px] md:w-[30px]">
            <button className="flex h-full w-full cursor-pointer items-center justify-center">
              <Menu className="h-full w-full" />
            </button>
          </li>
          <li className="h-6 w-6 sm:h-7 sm:w-7 md:h-[30px] md:w-[30px]">
            <Link
              href="/CartPage"
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
                <DropdownMenuContent
                  className="w-40"
                  align="end"
                  alignOffset={-10}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <CircleUser />
                      Профиль
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ShoppingBasket />
                      Корзина
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Heart />
                      Желаемое
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings />
                      Настройки
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut />
                      Выйти
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
                      onClick={handleLogging}
                      className="flex w-full max-w-[280px] cursor-pointer items-center justify-center gap-2 rounded-2xl bg-neutral-200 px-4 py-2 text-black hover:bg-neutral-300"
                    >
                      <GoogleSVG />
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
