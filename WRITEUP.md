# QA Automation Assessment – Write-up

## 1. Test Strategy and Prioritization

I prioritized the assessment based on business risk and the impact of failures.

The main priorities were:

1. Access control and authorization
2. Catalogue lifecycle rules
3. Data integrity and API validation
4. Critical buyer enquiry journey
5. Regression coverage for important business logic

### Task 1 – Findings

I focused on security and business-rule gaps such as:

- Staff users being able to perform admin-only catalogue actions
- Draft catalogues accepting enquiries
- Expired catalogues accepting enquiries
- Draft and expired catalogue products being exposed through the public search API
- Cross-catalogue listing modification through a listing ID
- Staff users being able to perform listing updates that should require admin access

These were prioritized because authorization and catalogue lifecycle failures can directly affect data integrity and business operations.

### Task 2 – Unit and API Coverage

I added focused automated tests around:

- Pricing calculations
- Import mapping and validation
- Catalogue lifecycle queries
- Enquiry request validation

The tests cover both valid and invalid inputs, including boundary and validation cases.

### Task 4 – End-to-End Coverage

For the browser journey, I automated one complete buyer flow instead of creating several smaller UI tests:

1. Open the published catalogue
2. Open a product
3. Open the enquiry form
4. Enter buyer details
5. Submit the enquiry
6. Verify the successful submission
7. Log in as an administrator
8. Open the Leads page
9. Search for the enquiry
10. Verify that the submitted buyer appears in the Leads inbox

The test uses unique buyer data for every run so that repeated executions do not depend on previously created test data.

--
## 2. Riskiest Area

The riskiest area I identified was authorization and catalogue lifecycle handling.

The application contains different user roles, including administrative and staff users. Several server-side operations rely on authentication but do not consistently enforce the required role.

I also found that catalogue lifecycle rules were not consistently enforced on the public enquiry and search APIs. Draft and expired catalogues could still accept enquiries or expose products through the public search API.

These areas were considered high risk because the problems are not limited to UI behavior. They can be triggered through API requests, which means client-side restrictions alone would not provide sufficient protection.

The main improvements I would recommend are:

- Enforce role authorization on every admin-only API and server action.
- Verify catalogue status and expiry before allowing enquiries.
- Prevent draft and expired catalogues from being exposed through public APIs.
- Verify that a listing belongs to the catalogue identified in the request before updating or deleting it.
- Add automated authorization and lifecycle regression tests so these rules remain protected.
--
## 3. What I Intentionally Left Out

Given the assessment time limit, I focused on high-risk business flows and core validation rather than attempting broad UI coverage.

I intentionally did not automate every page, button, filter, or administrative workflow.

I also did not create a large number of end-to-end tests that would duplicate the same buyer journey. Instead, I created one complete buyer journey that covers the main catalogue-to-enquiry-to-admin-leads flow.

For areas not covered by automation, I would extend coverage in a production project based on risk and usage, particularly:

- Additional catalogue management workflows
- More admin Leads workflows
- Additional product and catalogue combinations
- Negative UI scenarios
- Cross-browser coverage
- Parallel execution and CI-specific configuration
- Additional API authorization scenarios

These were left out to keep the submitted automation focused, readable, and maintainable within the assessment time limit.

--
## 4. How AI Was Used

AI was used as a development and review assistant during the assessment.

I used AI to:

- Help understand the existing project structure and application flow.
- Suggest test scenarios based on the assessment requirements.
- Help identify potential authorization, lifecycle, validation, and data-integrity risks.
- Assist with Playwright test implementation and locator selection.
- Troubleshoot test failures and application setup issues.
- Review the reliability of the automated buyer journey.
- Improve test data handling so repeated test executions use unique buyer data.
- Help structure this write-up.

I reviewed and executed the suggested code rather than treating AI-generated code as automatically correct. Test results, application behavior, and identified findings were verified against the running application.

The final automated test was executed multiple times to confirm that the buyer journey remained reliable with unique test data.

--
## 5. One Quality Problem and How I Would Improve It

One quality problem I identified was inconsistent enforcement of catalogue lifecycle rules across the application.

The public enquiry and search APIs did not consistently prevent actions against draft or expired catalogues.

For example, the enquiry API could accept an enquiry for a catalogue that was not currently published, and the public search API could expose products from draft or expired catalogues.

### Improvement

I would centralize catalogue availability validation and reuse it across the relevant API and server-side operations.

The validation should verify:

1. The catalogue exists.
2. The catalogue is published.
3. The catalogue has not expired.
4. The requested catalogue is the one associated with the requested listing or product.

I would then add regression tests for each lifecycle state:

- Published and active catalogue
- Draft catalogue
- Published but expired catalogue

This would reduce the risk of different endpoints implementing the same business rule differently.

I would also keep these checks server-side because API requests can bypass restrictions implemented only in the UI.