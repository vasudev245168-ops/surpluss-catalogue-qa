import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockCurrentActor,
  mockDelete,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockCurrentActor: vi.fn(),
  mockDelete: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("@/auth-guards", () => ({
  currentActor: mockCurrentActor,
  isAdmin: (actor: { role: string } | null) => actor?.role === "admin",
}));

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => ({
    catalogue: {
      delete: mockDelete,
    },
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

vi.mock("@/auth", () => ({
  signOut: vi.fn(),
}));

import { deleteCatalogue } from "./actions";

describe("deleteCatalogue", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCurrentActor.mockResolvedValue({
      id: "staff-user-id",
      email: "staff@catalogue.test",
      role: "staff",
    });

    mockDelete.mockResolvedValue({
      slug: "test-catalogue",
      name: "Test Catalogue",
    });
  });

  it("should reject a staff user from deleting a catalogue", async () => {
    const result = await deleteCatalogue(
      "550e8400-e29b-41d4-a716-446655440000",
    );

    expect(result).toEqual({
      error: "Only an admin can delete a catalogue.",
    });

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("should allow an admin user to delete a catalogue", async () => {
    mockCurrentActor.mockResolvedValue({
      id: "admin-user-id",
      email: "admin@catalogue.test",
      role: "admin",
    });

    const result = await deleteCatalogue(
      "550e8400-e29b-41d4-a716-446655440000",
    );

    expect(result).toEqual({
      ok: true,
      name: "Test Catalogue",
    });

    expect(mockDelete).toHaveBeenCalledWith({
      where: {
        id: "550e8400-e29b-41d4-a716-446655440000",
      },
      select: {
        slug: true,
        name: true,
      },
    });
  });
});