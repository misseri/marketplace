import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// API endpoint для выхода (мок)
export async function POST() {
  // В реальном приложении здесь была бы очистка сессии/токена
  const cookieStore = await cookies();
  cookieStore.delete("marketplace_user");

  return NextResponse.json({
    success: true,
  });
}
