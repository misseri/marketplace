import { NextResponse } from "next/server";
import { products } from "~/app/components/Card/data";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    return NextResponse.json(
      { success: false, error: "Product not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: product,
  });
}
