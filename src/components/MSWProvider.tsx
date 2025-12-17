"use client";

import { useEffect } from "react";

export function MSWProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    async function initMsw() {
      if (
        typeof window !== "undefined" &&
        process.env.NODE_ENV === "development"
      ) {
        const { worker } = await import("~/mocks/browser");

        // Настраиваем MSW так, чтобы он перехватывал только API запросы
        await worker.start({
          onUnhandledRequest: "bypass",
          serviceWorker: {
            url: "/mockServiceWorker.js",
          },
          quiet: true, // Не показывать предупреждения в консоли
        });
      }
    }

    void initMsw();
  }, []);

  return <>{children}</>;
}
