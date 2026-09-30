import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    catalogue: {
      findUnique: mockFindUnique,
    },
  }),
}));

import { getPublishedCatalogue } from "./catalogue-queries";

describe("getPublishedCatalogue", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFindUnique.mockResolvedValue({
      id: "catalogue-1",
      slug: "test-catalogue",
      name: "Test Catalogue",
      description: "Test catalogue description",
      category: "Electronics",
      banners: [],
      status: "published",
      publishedAt: new Date("2026-09-01"),
      createdAt: new Date("2026-08-01"),
      expiresAt: new Date("2026-12-31"),
      listings: [
        {
          productId: "product-1",
          displayOrder: 1,
          badges: [],
          product: {
            id: "product-1",
            sku: "SKU-001",
            name: "Test Product",
            brand: "Test Brand",
            category: "Electronics",
            offerPrice: 800,
            mrp: 1000,
            priceOnRequest: false,
            quantity: 50,
            moq: 5,
            imageUrls: [],
            description: "Test product description",
            attributes: {},
          },
        },
      ],
    });
  });

  it("should not return a draft catalogue", async () => {
    mockFindUnique.mockResolvedValue({
      id: "catalogue-1",
      slug: "draft-catalogue",
      name: "Draft Catalogue",
      status: "draft",
      listings: [],
    });

    const result = await getPublishedCatalogue("draft-catalogue");

    expect(result).toBeNull();
  });

  it("should return a published and active catalogue", async () => {
    const result = await getPublishedCatalogue("test-catalogue");

    expect(result).not.toBeNull();

    if (!result || "expired" in result) {
      throw new Error("Expected an active catalogue");
    }

    expect(result.catalogue.slug).toBe("test-catalogue");
    expect(result.catalogue.title).toBe("Test Catalogue");
    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({
      id: "product-1",
      sku: "SKU-001",
      name: "Test Product",
      price: 800,
      mrp: 1000,
      quantity: 50,
      moq: 5,
    });
  });

  it("should return expired information for an expired published catalogue", async () => {
    mockFindUnique.mockResolvedValue({
      id: "catalogue-1",
      slug: "expired-catalogue",
      name: "Expired Catalogue",
      status: "published",
      expiresAt: new Date("2020-01-01"),
      listings: [],
    });

    const result = await getPublishedCatalogue("expired-catalogue");

    expect(result).toEqual({
      expired: true,
      title: "Expired Catalogue",
      whatsappNumber: null,
    });
  });
});