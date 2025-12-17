import { NextResponse } from "next/server";
import { products } from "~/app/components/Card/data";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: products,
  });
}
