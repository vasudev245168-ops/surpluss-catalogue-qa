import { describe, expect, it } from "vitest";
import {
  autoMap,
  validateRows,
  type ParsedFile,
} from "./import-mapping";

describe("autoMap", () => {
  it("should automatically map common spreadsheet headers", () => {
    const headers = [
      "SKU",
      "Product Name",
      "Brand",
      "MRP",
      "Offer Price",
      "Available Quantity",
    ];

    const result = autoMap(headers);

    expect(result).toEqual({
      SKU: "sku",
      "Product Name": "name",
      Brand: "brand",
      MRP: "mrp",
      "Offer Price": "offerPrice",
      "Available Quantity": "quantity",
    });
  });
});

describe("validateRows", () => {
  it("should reject a row when SKU is missing", () => {
    const file: ParsedFile = {
      name: "products.csv",
      sizeKB: 1,
      headers: ["SKU", "Product Name", "Available Quantity"],
      rows: [
        {
          SKU: "",
          "Product Name": "Test Product",
          "Available Quantity": "10",
        },
      ],
    };

    const mapping = {
      SKU: "sku" as const,
      "Product Name": "name" as const,
      "Available Quantity": "quantity" as const,
    };

    const result = validateRows(file, mapping);

    expect(result.rows).toHaveLength(0);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].message).toBe("The SKU is missing");
    expect(result.issues[0].blocking).toBe(true);
  });

  it("should reject duplicate SKUs", () => {
    const file: ParsedFile = {
      name: "products.csv",
      sizeKB: 1,
      headers: ["SKU", "Product Name", "Available Quantity"],
      rows: [
        {
          SKU: "SKU-001",
          "Product Name": "Product One",
          "Available Quantity": "10",
        },
        {
          SKU: "SKU-001",
          "Product Name": "Product Two",
          "Available Quantity": "20",
        },
      ],
    };

    const mapping = {
      SKU: "sku" as const,
      "Product Name": "name" as const,
      "Available Quantity": "quantity" as const,
    };

    const result = validateRows(file, mapping);

    expect(result.rows).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].message).toContain(
      "SKU SKU-001 appears more than once in the sheet",
    );
    expect(result.issues[0].blocking).toBe(true);
  });

  it("should reject a quantity that is not a whole number", () => {
    const file: ParsedFile = {
      name: "products.csv",
      sizeKB: 1,
      headers: ["SKU", "Product Name", "Available Quantity"],
      rows: [
        {
          SKU: "SKU-001",
          "Product Name": "Test Product",
          "Available Quantity": "10.5",
        },
      ],
    };

    const mapping = {
      SKU: "sku" as const,
      "Product Name": "name" as const,
      "Available Quantity": "quantity" as const,
    };

    const result = validateRows(file, mapping);

    expect(result.rows).toHaveLength(0);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].message).toContain(
      "available quantity is not a whole number",
    );
    expect(result.issues[0].blocking).toBe(true);
  });

  it("should convert a valid spreadsheet row into an import row", () => {
    const file: ParsedFile = {
      name: "products.csv",
      sizeKB: 1,
      headers: [
        "SKU",
        "Product Name",
        "Brand",
        "MRP",
        "Offer Price",
        "Available Quantity",
        "MOQ",
      ],
      rows: [
        {
          SKU: "SKU-001",
          "Product Name": "Test Product",
          Brand: "Test Brand",
          MRP: "1000",
          "Offer Price": "800",
          "Available Quantity": "50",
          MOQ: "5",
        },
      ],
    };

    const mapping = {
      SKU: "sku" as const,
      "Product Name": "name" as const,
      Brand: "brand" as const,
      MRP: "mrp" as const,
      "Offer Price": "offerPrice" as const,
      "Available Quantity": "quantity" as const,
      MOQ: "moq" as const,
    };

    const result = validateRows(file, mapping);

    expect(result.issues).toHaveLength(0);
    expect(result.rows).toHaveLength(1);

    expect(result.rows[0]).toMatchObject({
      sku: "SKU-001",
      name: "Test Product",
      brand: "Test Brand",
      mrp: 1000,
      offerPrice: 800,
      quantity: 50,
      moq: 5,
    });

    expect(result.missingPrices).toBe(0);
  });

  it("should warn and skip an image URL that is not HTTPS", () => {
    const file: ParsedFile = {
      name: "products.csv",
      sizeKB: 1,
      headers: [
        "SKU",
        "Product Name",
        "Available Quantity",
        "Image URL",
      ],
      rows: [
        {
          SKU: "SKU-001",
          "Product Name": "Test Product",
          "Available Quantity": "10",
          "Image URL": "http://example.com/product.jpg",
        },
      ],
    };

    const mapping = {
      SKU: "sku" as const,
      "Product Name": "name" as const,
      "Available Quantity": "quantity" as const,
      "Image URL": "imageUrl" as const,
    };

    const result = validateRows(file, mapping);

    expect(result.rows).toHaveLength(1);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].blocking).toBe(false);
    expect(result.issues[0].message).toContain(
      "image link was skipped because it must start with https://",
    );
    expect(result.warnings).toBe(1);
    expect(result.rows[0].imageUrl).toBeUndefined();
  });
});