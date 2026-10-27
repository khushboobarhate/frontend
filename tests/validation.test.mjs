import test from "node:test";
import assert from "node:assert/strict";
import {
  validMobile,
  registrationError,
  decimal,
  validEmail,
} from "../src/lib/validation.ts";
const form = {
  full_name: "Sample Farmer",
  email: "farmer@example.com",
  mobile_number: "9876543210",
  state: "Maharashtra",
  city: "Pune",
  full_address: "12 Market Road, Pune",
  land_location: "Village Plot 4",
  preferred_language: "en",
  age: "35",
  nationality: "",
  taluka: "",
};
test("registration checks trimmed required fields, exact mobile digits, ages and address boundaries", () => {
  assert.equal(registrationError(form, "farmer", 2), "");
  for (const phone of [
    "123",
    "+919876543210",
    "98765 43210",
    "12345678901",
    "987654321x",
  ])
    assert.equal(validMobile(phone), false);
  for (const changes of [
    { full_name: " " },
    { full_address: "123" },
    { land_location: "" },
    { age: "18.5" },
    { age: "121" },
    { preferred_language: "invalid" },
  ])
    assert.notEqual(
      registrationError({ ...form, ...changes }, "farmer", 2),
      "",
    );
  assert.equal(
    registrationError({ ...form, land_location: "" }, "buyer", 2),
    "",
  );
});
test("crop decimals are finite, bounded, and do not accept partial numeric strings", () => {
  assert.equal(decimal("32.50"), 32.5);
  assert.equal(decimal("0.001", 0.001, 3), 0.001);
  for (const value of [
    "12kg",
    "Infinity",
    "NaN",
    "-1",
    "1.234",
    "1000000001",
    "1e3",
    "",
  ])
    assert.equal(decimal(value), null);
});
test("mailbox validation rejects header injection, multiple addresses and empty domain labels", () => {
  assert.equal(validEmail("farmer@example.com"), true);
  for (const email of [
    "a,b@example.com",
    "a@example.com\r\nBcc:evil@example.com",
    ".a@example.com",
    "a..b@example.com",
    "a@-example.com",
    "a@example",
  ])
    assert.equal(validEmail(email), false);
});
