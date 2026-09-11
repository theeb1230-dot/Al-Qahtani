const FALLBACK = "al-qahtani-media";
const MAX_FILENAME_CHARS = 120;

export function sanitizeDownloadFilename(value, fallback = FALLBACK) {
  const rawFallback = String(fallback || FALLBACK).normalize("NFKC");
  const clean = (input) => String(input || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, " ")
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^\.+|\.+$/g, "")
    .trim()
    .slice(0, MAX_FILENAME_CHARS)
    .trim()
    .replace(/\.+$/g, "")
    .trim();

  const candidate = clean(value);
  if (candidate) return candidate;
  return clean(rawFallback) || FALLBACK;
}

export function buildDownloadContentDisposition(value) {
  const filename = sanitizeDownloadFilename(value);
  const ascii = filename
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/[\\";]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || FALLBACK;
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export const DOWNLOAD_FILENAME_LIMIT = MAX_FILENAME_CHARS;
