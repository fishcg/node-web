import assert from "node:assert/strict";
import { test } from "node:test";
import { formatMetric, formatViews, safeNextPath, toPositiveInt } from "../lib/utils";

test("formatViews keeps the card-friendly zero state", () => {
  assert.equal(formatViews(0), "新上架");
  assert.equal(formatViews(12), "12");
  assert.equal(formatViews(12_345), "1.2 万");
});

test("formatMetric never renders an empty count in detail metadata", () => {
  assert.equal(formatMetric(0), "0");
  assert.equal(formatMetric(12), "12");
  assert.equal(formatMetric(12_345), "1.2 万");
});

test("safeNextPath only allows same-origin absolute paths", () => {
  assert.equal(safeNextPath("/me"), "/me");
  assert.equal(safeNextPath("/category/asmr?page=2"), "/category/asmr?page=2");
  assert.equal(safeNextPath("https://evil.example"), "/");
  assert.equal(safeNextPath("//evil.example"), "/");
  assert.equal(safeNextPath("/\\evil.example"), "/");
  assert.equal(safeNextPath("/\tevil"), "/");
  assert.equal(safeNextPath(undefined), "/");
});

test("toPositiveInt rejects unsafe page values", () => {
  assert.equal(toPositiveInt("3"), 3);
  assert.equal(toPositiveInt("0"), null);
  assert.equal(toPositiveInt("-2"), null);
  assert.equal(toPositiveInt("abc"), null);
});
