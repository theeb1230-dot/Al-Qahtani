const CATEGORY_ROWS = [
  ["series-foreign", "series", "أجنبية", "https://akwam.ss/series?section=30"],
  ["series-arabic", "series", "عربية", "https://akwam.ss/series?section=29"],
  ["series-turkish", "series", "تركية", "https://akwam.ss/series?section=32"],
  ["series-asian", "series", "آسيوية", "https://akwam.ss/series?section=33"],
  ["series-anime", "series", "أنمي", "https://akwam.ss/series?category=30"],
  ["series-ramadan", "series", "رمضان", "https://akwam.ss/series?category=87"],
  ["movie-foreign", "movie", "أجنبية", "https://akwam.ss/movies?section=30"],
  ["movie-arabic", "movie", "عربية", "https://akwam.ss/movies?section=29"],
  ["movie-indian", "movie", "هندية", "https://akwam.ss/movies?section=31"],
  ["movie-asian", "movie", "آسيوية", "https://akwam.ss/movies?section=33"],
  ["movie-turkish", "movie", "تركية", "https://akwam.ss/movies?section=32"],
  ["movie-anime", "movie", "أنمي", "https://akwam.ss/movies?category=30"],
];

const CATEGORY_MAP = new Map(CATEGORY_ROWS.map(([id, type, title, sourceUrl]) => [id, Object.freeze({ id, type, title, sourceUrl })]));

export const CatalogCategories = Object.freeze(CATEGORY_ROWS.map(([id, type, title]) => Object.freeze({ id, type, title })));

export function resolveCatalogCategory(ref) {
  const value = String(ref || "").trim();
  if (!value) return null;
  const mapped = CATEGORY_MAP.get(value);
  if (mapped) return mapped;

  // Transitional compatibility for already-deployed callers. New UI must use IDs.
  const legacy = CATEGORY_ROWS.find(([, , , sourceUrl]) => sourceUrl === value);
  if (!legacy) return null;
  const [id, type, title, sourceUrl] = legacy;
  return { id, type, title, sourceUrl };
}

export function isCatalogCategoryId(value) {
  return CATEGORY_MAP.has(String(value || "").trim());
}
