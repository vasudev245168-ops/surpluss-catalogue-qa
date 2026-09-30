import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockAuth,
  mockCatalogueFindUnique,
  mockListingUpdateMany,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCatalogueFindUnique: vi.fn(),
  mockListingUpdateMany: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    catalogue: {
      findUnique: mockCatalogueFindUnique,
    },
    catalogueListing: {
      updateMany: mockListingUpdateMany,
    },
  }),
}));

vi.mock("../helpers", () => ({
  revalidateCatalogue: vi.fn(),
}));

import { PATCH } from "./route";

describe("PATCH /api/admin/catalogues/[id]/listings/[listingId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockAuth.mockResolvedValue({
      user: {
        id: "admin-user-id",
        email: "admin@catalogue.test",
        role: "admin",
      },
    });

    mockCatalogueFindUnique.mockResolvedValue({
      slug: "catalogue-a",
    });

    mockListingUpdateMany.mockResolvedValue({
      count: 1,
    });
  });

  it("should reject a listing that belongs to a different catalogue", async () => {
    const catalogueAId = "550e8400-e29b-41d4-a716-446655440000";
    const listingFromCatalogueBId =
      "650e8400-e29b-41d4-a716-446655440000";

    const request = new Request(
      `http://localhost/api/admin/catalogues/${catalogueAId}/listings/${listingFromCatalogueBId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isVisible: false,
        }),
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        id: catalogueAId,
        listingId: listingFromCatalogueBId,
      }),
    });

    expect(response.status).toBe(404);
    expect(mockListingUpdateMany).not.toHaveBeenCalled();
  });

  it("should handle a tampered payload with an unsupported field", async () => {
    const catalogueId = "550e8400-e29b-41d4-a716-446655440000";
    const listingId = "650e8400-e29b-41d4-a716-446655440000";

    const request = new Request(
      `http://localhost/api/admin/catalogues/${catalogueId}/listings/${listingId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isVisible: false,
          price: 1,
        }),
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        id: catalogueId,
        listingId,
      }),
    });

    expect(response.status).toBe(200);

    expect(mockListingUpdateMany).toHaveBeenCalledWith({
      where: {
        id: listingId,
      },
      data: {
        isVisible: false,
      },
    });
  });

  it("should reject a signed-out user from updating a listing", async () => {
    mockAuth.mockResolvedValue(null);

    const catalogueId = "550e8400-e29b-41d4-a716-446655440000";
    const listingId = "650e8400-e29b-41d4-a716-446655440000";

    const request = new Request(
      `http://localhost/api/admin/catalogues/${catalogueId}/listings/${listingId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isVisible: false,
        }),
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        id: catalogueId,
        listingId,
      }),
    });

    expect(response.status).toBe(401);
    expect(mockListingUpdateMany).not.toHaveBeenCalled();
  });

  it("should reject a staff user from updating a listing", async () => {
    mockAuth.mockResolvedValue({
      user: {
        id: "staff-user-id",
        email: "staff@catalogue.test",
        role: "staff",
      },
    });

    const catalogueId = "550e8400-e29b-41d4-a716-446655440000";
    const listingId = "650e8400-e29b-41d4-a716-446655440000";

    const request = new Request(
      `http://localhost/api/admin/catalogues/${catalogueId}/listings/${listingId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isVisible: false,
        }),
      },
    );

    const response = await PATCH(request, {
      params: Promise.resolve({
        id: catalogueId,
        listingId,
      }),
    });

    expect(response.status).toBe(403);
    expect(mockListingUpdateMany).not.toHaveBeenCalled();
  });
});