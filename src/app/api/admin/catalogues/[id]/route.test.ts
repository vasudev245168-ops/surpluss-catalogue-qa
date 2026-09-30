import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockFindUnique,
  mockUpdate,
  mockFindIncompleteProducts,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockFindIncompleteProducts: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    catalogue: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  }),
}));

vi.mock("@/lib/incomplete", () => ({
  findIncompleteProducts: mockFindIncompleteProducts,
  incompleteMessage: (count: number) => `${count} incomplete products.`,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("../helpers", () => ({
  CATALOGUE_INCLUDE: {},
  toCatalogueDto: (catalogue: unknown) => catalogue,
  validUntilToExpiresAt: () => null,
}));

import { GET, PATCH } from "./route";

describe("/api/admin/catalogues/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth.mockResolvedValue({
      user: {
        id: "staff-user-id",
        email: "staff@catalogue.test",
        role: "staff",
      },
    });

    mockFindUnique.mockResolvedValue({
      slug: "live-catalogue",
      status: "draft",
    });

    mockFindIncompleteProducts.mockResolvedValue([]);

    mockUpdate.mockResolvedValue({
      id: "catalogue-id",
      slug: "live-catalogue",
      name: "Live Catalogue",
      description: "Test catalogue",
      category: null,
      notifyNumber: null,
      status: "published",
      banners: [],
      expiresAt: null,
      publishedAt: new Date(),
    });
  });

  it("should reject a staff user from publishing a catalogue", async () => {
    const request = new Request(
      "http://localhost/api/admin/catalogues/550e8400-e29b-41d4-a716-446655440000",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Live Catalogue",
          slug: "live-catalogue",
          description: "Test catalogue",
          category: "",
          notifyNumber: "",
          status: "published",
          validUntil: null,
          banners: [],
        }),
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    });

    expect(response.status).toBe(403);
  });

  it("should reject a signed-out user from updating a catalogue", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request(
      "http://localhost/api/admin/catalogues/550e8400-e29b-41d4-a716-446655440000",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Updated Catalogue",
          slug: "updated-catalogue",
          description: "Updated description",
          category: "",
          notifyNumber: "",
          status: "draft",
          validUntil: null,
          banners: [],
        }),
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    });

    expect(response.status).toBe(401);
  });

  it("should reject a signed-out user from viewing a catalogue", async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request(
      "http://localhost/api/admin/catalogues/550e8400-e29b-41d4-a716-446655440000",
    );

    const response = await GET(request, {
      params: Promise.resolve({
        id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    });

    expect(response.status).toBe(401);
  });

  it("should allow an admin user to publish a catalogue", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "admin-user-id",
        email: "admin@catalogue.test",
        role: "admin",
      },
    });

    const request = new Request(
      "http://localhost/api/admin/catalogues/550e8400-e29b-41d4-a716-446655440000",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Live Catalogue",
          slug: "live-catalogue",
          description: "Test catalogue",
          category: "",
          notifyNumber: "",
          status: "published",
          validUntil: null,
          banners: [],
        }),
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        id: "550e8400-e29b-41d4-a716-446655440000",
      }),
    });

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalled();
  });
});