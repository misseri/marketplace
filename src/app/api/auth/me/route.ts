import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// API endpoint для получения текущего пользователя (мок)
// Читает данные из cookie или возвращает null
export async function GET() {
  // В реальном приложении здесь была бы проверка сессии/токена
  // Для мока проверяем cookie с данными пользователя
  const cookieStore = await cookies();
  const userCookie = cookieStore.get("marketplace_user");

  if (!userCookie) {
    return NextResponse.json({
      success: false,
      user: null,
    });
  }

  try {
    const user = JSON.parse(userCookie.value);
    return NextResponse.json({
      success: true,
      user,
    });
  } catch {
    return NextResponse.json({
      success: false,
      user: null,
    });
  }
}
