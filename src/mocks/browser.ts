import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// Настройка MSW для браузера
export const worker = setupWorker(...handlers);
