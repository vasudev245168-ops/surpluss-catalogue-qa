import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockFindMany, mockFindUnique, mockEnquiryCreate } = vi.hoisted(() => ({
  mockFindMany: vi.fn(),
  mockFindUnique: vi.fn(),
  mockEnquiryCreate: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    catalogueListing: {
      findMany: mockFindMany,
    },
    catalogue: {
      findUnique: mockFindUnique,
    },
    enquiry: {
      create: mockEnquiryCreate,
    },
  }),
}));

vi.mock("@/lib/notifications", () => ({
  notifyTeam: vi.fn(),
}));

vi.mock("next/server", async () => {
  const actual =
    await vi.importActual<typeof import("next/server")>("next/server");

  return {
    ...actual,
    after: vi.fn(),
  };
});

import { POST } from "./route";

describe("POST /api/enquiries", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFindMany.mockResolvedValue([
      {
        id: "listing-1",
        productId: "550e8400-e29b-41d4-a716-446655440001",
        product: {
          name: "Test Product",
          sku: "TEST-001",
          brand: "Test Brand",
          offerPrice: "800.00",
          priceOnRequest: false,
          moq: 1,
          quantity: 100,
        },
      },
    ]);

    mockFindUnique.mockResolvedValue({
      notifyNumber: null,
      status: "published",
      expiresAt: null,
    });

    mockEnquiryCreate.mockResolvedValue({
      reference: "ENQ-1234567",
    });
  });

  it("should reject an enquiry for an expired catalogue", async () => {
    mockFindUnique.mockResolvedValue({
      notifyNumber: null,
      status: "published",
      expiresAt: new Date("2020-01-01"),
    });

    const request = new Request("http://localhost/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        catalogueId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Buyer",
        company: "Test Company",
        countryCode: "+91",
        phone: "9876543210",
        email: "",
        location: "Hyderabad",
        message: "Interested in this product",
        items: [
          {
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 5,
          },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
  });

  it("should reject an enquiry for a draft catalogue", async () => {
    mockFindUnique.mockResolvedValue({
      notifyNumber: null,
      status: "draft",
      expiresAt: null,
    });

    const request = new Request("http://localhost/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        catalogueId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Buyer",
        company: "Test Company",
        countryCode: "+91",
        phone: "9876543210",
        email: "",
        location: "Hyderabad",
        message: "Interested in this product",
        items: [
          {
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 5,
          },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(409);
  });

  it("should reject an enquiry when both phone and email are missing", async () => {
    const request = new Request("http://localhost/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        catalogueId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Buyer",
        company: "Test Company",
        countryCode: "+91",
        phone: "",
        email: "",
        location: "Hyderabad",
        message: "Interested in this product",
        items: [
          {
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 5,
          },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should reject an enquiry with an invalid email", async () => {
    const request = new Request("http://localhost/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        catalogueId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Buyer",
        company: "Test Company",
        countryCode: "+91",
        phone: "",
        email: "invalid-email",
        location: "Hyderabad",
        message: "Interested in this product",
        items: [
          {
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 5,
          },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should reject an enquiry with an invalid phone number", async () => {
    const request = new Request("http://localhost/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        catalogueId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Buyer",
        company: "Test Company",
        countryCode: "+91",
        phone: "123",
        email: "",
        location: "Hyderabad",
        message: "Interested in this product",
        items: [
          {
            productId: "550e8400-e29b-41d4-a716-446655440001",
            quantity: 5,
          },
        ],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should reject an enquiry with no items", async () => {
    const request = new Request("http://localhost/api/enquiries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        catalogueId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Buyer",
        company: "Test Company",
        countryCode: "+91",
        phone: "9876543210",
        email: "",
        location: "Hyderabad",
        message: "Interested in this product",
        items: [],
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});