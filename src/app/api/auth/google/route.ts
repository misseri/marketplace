import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// API endpoint для авторизации через Google (мок)
export async function POST() {
  // В реальном приложении здесь была бы логика авторизации через Google OAuth
  // Для мока просто возвращаем данные пользователя и сохраняем в cookie
  const mockUser = {
    id: `mock-user-${Date.now()}`,
    name: "Mock User",
    email: "mock.user@example.com",
    image: "https://via.placeholder.com/150",
  };

  // Сохраняем пользователя в cookie для серверных запросов
  const cookieStore = await cookies();
  cookieStore.set("marketplace_user", JSON.stringify(mockUser), {
    httpOnly: false, // Чтобы можно было читать из клиента
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 дней
  });

  return NextResponse.json({
    success: true,
    user: mockUser,
  });
}
