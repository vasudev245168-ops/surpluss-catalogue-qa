import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCatalogueFindUnique,
  mockListingFindMany,
} = vi.hoisted(() => ({
  mockCatalogueFindUnique: vi.fn(),
  mockListingFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    catalogue: {
      findUnique: mockCatalogueFindUnique,
    },
    catalogueListing: {
      findMany: mockListingFindMany,
    },
  }),
}));

import { GET } from "./route";

describe("GET /api/catalogues/[slug]/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCatalogueFindUnique.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "draft",
      expiresAt: null,
    });

    mockListingFindMany.mockResolvedValue([
      {
        productId: "650e8400-e29b-41d4-a716-446655440000",
        product: {
          name: "Draft Product",
          sku: "DRAFT-001",
          offerPrice: 500,
        },
      },
    ]);
  });

  it("should not expose products from a draft catalogue", async () => {
    const request = new Request(
      "http://localhost/api/catalogues/draft-catalogue/search?q=Draft",
    );

    const response = await GET(request, {
      params: Promise.resolve({
        slug: "draft-catalogue",
      }),
    });

    expect(response.status).toBe(404);
  });
});
it("should not expose products from an expired catalogue", async () => {
  mockCatalogueFindUnique.mockResolvedValue({
    id: "550e8400-e29b-41d4-a716-446655440000",
    status: "published",
    expiresAt: new Date("2020-01-01"),
  });

  mockListingFindMany.mockResolvedValue([
    {
      productId: "650e8400-e29b-41d4-a716-446655440000",
      product: {
        name: "Expired Product",
        sku: "EXPIRED-001",
        offerPrice: 500,
      },
    },
  ]);

  const request = new Request(
    "http://localhost/api/catalogues/expired-catalogue/search?q=Expired",
  );

  const response = await GET(request, {
    params: Promise.resolve({
      slug: "expired-catalogue",
    }),
  });

  expect(response.status).toBe(404);
});