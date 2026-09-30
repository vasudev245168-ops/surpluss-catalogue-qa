# Findings

One section per bug. Add or remove sections as needed — the headings are only a

starting point, not a form you have to fill in exactly.

---

## 1. Staff user can publish a catalogue

**What happens**

A staff user can publish a catalogue through the admin catalogue API. The API checks that the user is authenticated, but it does not verify that the user has the required admin role.

**Steps to reproduce**

1. Authenticate as a staff user.
2. Send a `PATCH` request to `/api/admin/catalogues/{catalogueId}`.
3. Send a request body with `"status": "published"`.
4. Observe the response.

**What should happen instead**

The API should reject the request because publishing a catalogue is an admin-only action.

The response should be `403 Forbidden`, and the catalogue status should remain unchanged.

**Impact — how bad is this, and why?**

High severity. A staff user can perform an admin-only action and publish a catalogue without the required permission. This can cause a catalogue to become publicly available before it has been approved for publication.

**Failing test**

`src/app/api/admin/catalogues/[id]/route.test.ts` — `should reject a staff user from publishing a catalogue`

---

---

## 2. Enquiry can be submitted for a draft catalogue

**What happens**

The enquiry API allows an enquiry to be created for a catalogue that is still in draft status. The API validates the products and quantities but does not verify that the catalogue is published before creating the enquiry.

**Steps to reproduce**

1. Use a catalogue with `status = "draft"`.
2. Send a `POST` request to `/api/enquiries`.
3. Include the draft catalogue ID and a valid visible product in the request body.
4. Observe the response.

**What should happen instead**

The API should reject the enquiry because the catalogue has not been published.

The response should be `409 Conflict`, and no enquiry should be created.

**Impact — how bad is this, and why?**

High severity. A draft catalogue is not intended to accept buyer enquiries. A direct API request can bypass the public catalogue restriction and create an enquiry against catalogue data that is not yet published.

**Failing test**

`src/app/api/enquiries/route.test.ts` — `should reject an enquiry for a draft catalogue`

Current result:

`Expected: 409, Received: 201`

---

---

## 3. Enquiry can be submitted for an expired catalogue

**What happens**

The enquiry API allows an enquiry to be created for a catalogue that has already expired. The API does not verify the catalogue expiry date before creating the enquiry.

**Steps to reproduce**

1. Use a published catalogue whose expiry date is in the past.
2. Send a `POST` request to `/api/enquiries`.
3. Include the expired catalogue ID and a valid visible product in the request body.
4. Observe the response.

**What should happen instead**

The API should reject the enquiry because the catalogue has expired.

The response should be `409 Conflict`, and no enquiry should be created.

**Impact — how bad is this, and why?**

High severity. Buyers can submit enquiries against catalogues that are no longer active. This can result in enquiries being created for expired catalogue offers and can cause incorrect or stale business leads.

**Failing test**

`src/app/api/enquiries/route.test.ts` — `should reject an enquiry for an expired catalogue`

Current result:

`Expected: 409, Received: 201`

---

## 4. Staff user can delete a catalogue

**What happens**

A staff user can delete a catalogue through the admin server action. The action checks that the user is signed in, but it does not verify that the user has the required admin role.

**Steps to reproduce**

1. Authenticate as a staff user.
2. Call the `deleteCatalogue` server action with a valid catalogue ID.
3. Observe the response.

**What should happen instead**

The action should reject the request because deleting a catalogue is an admin-only action.

The response should indicate that only an admin can delete a catalogue, and the catalogue should remain unchanged.

**Impact — how bad is this, and why?**

High severity. A staff user can perform an admin-only destructive action and delete a catalogue without the required permission. This can result in loss of catalogue data and can affect catalogue history.

**Failing test**

`src/app/admin/actions.test.ts` — `should reject a staff user from deleting a catalogue`

Current result:

`Expected: { error: "Only an admin can delete a catalogue." }, Received: { ok: true, name: "Test Catalogue" }`

--
## 5. Draft catalogue products are exposed through the public search API

**What happens**

The public catalogue search API returns products from a draft catalogue without requiring authentication.

The endpoint looks up the catalogue by slug but does not verify that the catalogue is published before returning its listings.

**Steps to reproduce**

1. Use the slug of a draft catalogue.
2. Send a `GET` request to `/api/catalogues/{slug}/search?q={searchTerm}` without signing in.
3. Observe the response.

**What should happen instead**

A draft catalogue should not expose its products through the public search API.

The endpoint should reject the request or behave as if the catalogue does not exist.

**Impact — how bad is this, and why?**

High severity. Products belonging to a draft catalogue can be exposed to an unauthenticated user before the catalogue is approved for publication. Depending on the product data, this can expose catalogue information and pricing prematurely.

**Failing test**

`src/app/api/catalogues/[slug]/search/route.test.ts` — `should not expose products from a draft catalogue`

Current result:

`Expected: 404, Received: 200`

--
## 6. Expired catalogue products are exposed through the public search API

**What happens**

The public catalogue search API returns products from an expired catalogue without requiring authentication.

The endpoint retrieves the catalogue's expiry date but does not check whether the validity date has passed before returning its listings.

**Steps to reproduce**

1. Use the slug of an expired catalogue.
2. Send a `GET` request to `/api/catalogues/{slug}/search?q={searchTerm}` without signing in.
3. Observe the response.

**What should happen instead**

An expired catalogue should not expose its products through the public search API.

The endpoint should reject the request or behave as if the catalogue is no longer available.

**Impact — how bad is this, and why?**

High severity. Products from an expired catalogue can continue to be exposed to unauthenticated users after the catalogue's validity period has ended. This can expose catalogue information and pricing that should no longer be publicly available.

**Failing test**

`src/app/api/catalogues/[slug]/search/route.test.ts` — `should not expose products from an expired catalogue`

Current result:

`Expected: 404, Received: 200`

--
## 7. Catalogue listing can be modified using a listing ID from another catalogue

**What happens**

An authenticated user can modify a catalogue listing by supplying a valid listing ID belonging to a different catalogue in the URL.

The API verifies that the catalogue ID exists, but it does not verify that the listing ID belongs to that catalogue before updating the listing.

**Steps to reproduce**

1. Authenticate as a valid admin user.
2. Identify a listing belonging to Catalogue B.
3. Send a `PATCH` request using Catalogue A's ID but Catalogue B's listing ID.
4. Send a valid update such as `"isVisible": false`.
5. Observe the response.

**What should happen instead**

The API should verify that the listing belongs to the catalogue specified in the URL.

If the listing does not belong to that catalogue, the request should be rejected with `404 Not Found`, and the listing should not be modified.

**Impact — how bad is this, and why?**

High severity. A user with access to the endpoint can potentially modify listings belonging to another catalogue by changing the catalogue or listing identifier in the URL. This breaks object-level authorization between catalogue records.

**Failing test**

`src/app/api/admin/catalogues/[id]/listings/[listingId]/route.test.ts` — `should reject a listing that belongs to a different catalogue`

Current result:

`Expected: 404, Received: 200`

--
## 8. Staff user can modify catalogue listings

**What happens**

A staff user can modify a catalogue listing through the admin listing API.

The API checks that the user is authenticated, but it does not verify that the user has the required admin role.

**Steps to reproduce**

1. Authenticate as a staff user.
2. Identify a valid catalogue ID and listing ID.
3. Send a `PATCH` request to `/api/admin/catalogues/{catalogueId}/listings/{listingId}`.
4. Send a valid update such as `"isVisible": false`.
5. Observe the response.

**What should happen instead**

The API should reject the request because modifying catalogue listings should require the appropriate admin permission.

The response should be `403 Forbidden`, and the listing should remain unchanged.

**Impact — how bad is this, and why?**

High severity. A staff user can modify catalogue listings without the required permission. This could allow catalogue content or visibility to be changed without the intended administrative authorization.

**Failing test**

`src/app/api/admin/catalogues/[id]/listings/[listingId]/route.test.ts` — `should reject a staff user from updating a listing`

Current result:

`Expected: 403, Received: 200`