import { test, expect } from "@playwright/test";

test("buyer can submit an enquiry and it appears in admin leads", async ({ page }) => {

  // Create unique buyer name for every test run
  const buyerName = `Playwright Buyer ${Date.now()}`;

  // Open published catalogue
  await page.goto(
    "http://localhost:3001/catalogue/premium-corporate-essentials"
  );

  // Verify catalogue page
  await expect(
    page.getByRole("heading", {
      name: "Premium corporate essentials",
    })
  ).toBeVisible();

  // Open product
  await page.getByRole("link", {
    name: "Atlas cabin trolley",
  }).click();

  // Verify product page
  await expect(
    page.getByRole("heading", {
      name: "Atlas cabin trolley",
    })
  ).toBeVisible();

  // Open enquiry form
  await page.getByRole("button", {
    name: "Contact Us",
  }).click();

  // Verify enquiry form
  await expect(
    page.getByRole("heading", {
      name: "Contact supplier",
      level: 2,
    })
  ).toBeVisible();

  // Fill buyer details
  await page.getByLabel("Your name").fill(buyerName);

  await page.getByLabel("WhatsApp number").fill("7483920000");

  // Submit enquiry
  await page.getByRole("button", {
    name: "Send enquiry",
  }).click();

  // Verify successful submission
  await expect(
    page.getByText("Enquiry sent", {
      exact: true,
    })
  ).toBeVisible();

  // Open admin login
  await page.goto("http://localhost:3001/login");

  // Login as admin
  await page.getByLabel("Email").fill("admin@catalogue.test");

  await page.getByLabel("Password").fill("Admin#2026");

  await page.getByRole("button", {
    name: /sign in|login/i,
  }).click();

  // Open Leads
  await page.getByRole("link", {
    name: "Leads",
  }).click();

  // Verify Leads page
  await expect(
    page.getByRole("heading", {
      name: "Leads",
    })
  ).toBeVisible();

  // Search submitted enquiry using unique buyer name
  await page.getByPlaceholder(
    "Search buyer, reference or contact"
  ).fill(buyerName);

  // Verify enquiry appears in Leads
  await expect(
    page.getByText(buyerName, {
      exact: true,
    })
  ).toBeVisible();
});