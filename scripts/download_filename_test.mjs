#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  sanitizeDownloadFilename,
  buildDownloadContentDisposition,
  DOWNLOAD_FILENAME_LIMIT,
} from "../server/download-filename.mjs";

const cases = [
  ["فيلم الذئب الوحيد", "فيلم الذئب الوحيد"],
  ["The Odyssey", "The Odyssey"],
  ["../فيلم\\اختبار:نسخة?.mp4", "فيلم اختبار نسخة .mp4"],
  ["  اسم\n\r\tنظيف  ", "اسم نظيف"],
  ["\u0000\u0001\u007f", "al-qahtani-media"],
  ["....", "al-qahtani-media"],
  ["a".repeat(300), "a".repeat(DOWNLOAD_FILENAME_LIMIT)],
];

for (const [input, expected] of cases) {
  assert.equal(sanitizeDownloadFilename(input), expected, `sanitize mismatch for ${JSON.stringify(input)}`);
}

for (const input of [
  "فيلم / اختبار \"خاص\"",
  "../../evil\\path\r\nInjected: header",
  "a".repeat(300),
]) {
  const safe = sanitizeDownloadFilename(input);
  assert.ok(safe.length > 0 && safe.length <= DOWNLOAD_FILENAME_LIMIT);
  assert.ok(!/[\\/:*?"<>|\u0000-\u001f\u007f-\u009f]/.test(safe), `unsafe filename: ${safe}`);
  const header = buildDownloadContentDisposition(input);
  assert.ok(header.startsWith("attachment; filename=\""));
  assert.ok(header.includes("filename*=UTF-8''"));
  assert.ok(!/[\r\n]/.test(header), "content-disposition must not contain CR/LF");
}

const arabicHeader = buildDownloadContentDisposition("فيلم الذئب الوحيد");
assert.ok(arabicHeader.includes(encodeURIComponent("فيلم الذئب الوحيد")), "UTF-8 filename must preserve trusted Arabic title");

console.log("PASS trusted download filename sanitization", { cases: cases.length, limit: DOWNLOAD_FILENAME_LIMIT });
