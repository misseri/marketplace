/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    screens: {
      "max-sm": { max: "375px" },
      sm: "640px", // Планшеты (портретная ориентация)
      md: "768px", // Планшеты (альбомная ориентация)
      lg: "1024px", // Небольшие ноутбуки
      xl: "1280px", // Десктопы
      "2xl": "1536px", // Большие десктопы
    },
  },
};
