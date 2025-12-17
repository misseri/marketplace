import { http, HttpResponse } from "msw";
import { products } from "~/app/components/Card/data";

export const handlers = [
  http.get("/api/products", () => {
    return HttpResponse.json({
      success: true,
      data: products,
    });
  }),

  http.get("/api/products/:id", async ({ params }) => {
    const { id } = await params;
    const product = products.find((p) => p.id === id);

    if (!product) {
      return HttpResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json({
      success: true,
      data: product,
    });
  }),

  // Мок для авторизации через Google
  http.post("/api/auth/google", async () => {
    const mockUser = {
      id: `mock-user-${Date.now()}`,
      name: "Mock User",
      email: "mock.user@example.com",
      image: "https://via.placeholder.com/150",
    };

    return HttpResponse.json({
      success: true,
      user: mockUser,
    });
  }),

  http.get("/api/auth/me", async () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: "mock-user-id",
        name: "Mock User",
        email: "mock.user@example.com",
        image: "https://via.placeholder.com/150",
      },
    });
  }),

  http.post("/api/auth/logout", () => {
    return HttpResponse.json({
      success: true,
    });
  }),
];
