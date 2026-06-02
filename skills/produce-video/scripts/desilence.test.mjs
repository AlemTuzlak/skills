import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "./desilence.mjs";

test("defaults margin 0.3s", () => {
  const o = parseArgs(["in.mp4", "--out", "out.mp4"]);
  assert.equal(o.input, "in.mp4");
  assert.equal(o.out, "out.mp4");
  assert.equal(o.margin, "0.3s");
});

test("margin override", () => {
  const o = parseArgs(["in.mp4", "--out", "o.mp4", "--margin", "0.5s"]);
  assert.equal(o.margin, "0.5s");
});
