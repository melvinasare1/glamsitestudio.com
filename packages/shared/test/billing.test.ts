// Unit tests for hosting-tier / platform-fee rules. Run with `npm run test:unit`.
import { strict as assert } from "node:assert";
import { afterEach, test } from "node:test";
import { platformFeeCents } from "../src/billing.ts";

afterEach(() => {
  delete process.env.PLATFORM_FEE_BPS;
});

test("platformFeeCents defaults to 1% when PLATFORM_FEE_BPS is unset", () => {
  delete process.env.PLATFORM_FEE_BPS;
  assert.equal(platformFeeCents(10000), 100);
});

test("platformFeeCents rounds to the nearest cent", () => {
  delete process.env.PLATFORM_FEE_BPS;
  assert.equal(platformFeeCents(2550), 26); // 25.5 rounds up
  assert.equal(platformFeeCents(2549), 25); // 25.49 rounds down
});

test("platformFeeCents reads the rate from the environment without a redeploy", () => {
  process.env.PLATFORM_FEE_BPS = "250"; // 2.5%
  assert.equal(platformFeeCents(10000), 250);
});

test("platformFeeCents is zero for a zero amount", () => {
  delete process.env.PLATFORM_FEE_BPS;
  assert.equal(platformFeeCents(0), 0);
});
