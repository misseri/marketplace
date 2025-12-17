import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Настройка MSW для сервера (Node.js)
export const server = setupServer(...handlers);
