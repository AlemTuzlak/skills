import { test } from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "./transcribe.mjs";

test("defaults: word-ts on, port 9111, task transcribe", () => {
  const o = parseArgs(["video.mp4"]);
  assert.equal(o.input, "video.mp4");
  assert.equal(o.wordTs, true);
  assert.equal(o.port, 9111);
  assert.equal(o.task, "transcribe");
  assert.equal(o.stop, false);
});

test("flags override defaults", () => {
  const o = parseArgs(["clip.wav", "--port", "9222", "--language", "en", "--no-word-ts", "--out", "C:/tmp"]);
  assert.equal(o.input, "clip.wav");
  assert.equal(o.port, 9222);
  assert.equal(o.language, "en");
  assert.equal(o.wordTs, false);
  assert.equal(o.out, "C:/tmp");
});

test("--stop needs no input", () => {
  const o = parseArgs(["--stop"]);
  assert.equal(o.stop, true);
  assert.equal(o.input, undefined);
});
