const DIOCESE_TERM =
  /(^|[^\p{L}\p{N}_])(arquidi[oó]cesis|arquidiocesan[oa]s?|di[oó]cesis|diocesan[oa]s?)(?![\p{L}\p{N}_])/giu;

const CANONICAL: Record<string, string> = {
  arquidiocesis: "Arquidiócesis",
  arquidiócesis: "Arquidiócesis",
  diocesis: "Diócesis",
  diócesis: "Diócesis",
};

const SKIP_KEYS = new Set([
  "id",
  "href",
  "src",
  "url",
  "logoUrl",
  "ogImage",
  "fileName",
  "coverUrl",
  "ctaHref",
  "permalink",
]);

/** Primera letra en mayúscula: Arquidiócesis, Diócesis y adjetivos (Diocesana, Arquidiocesana). */
export function capitalizeDioceseTerms(value: string) {
  return value.replace(DIOCESE_TERM, (_full, prefix: string, term: string) => {
    const key = term.toLocaleLowerCase("es-SV");
    return `${prefix}${CANONICAL[key] ?? capitalizeWord(term)}`;
  });
}

function capitalizeWord(value: string) {
  return (
    value.charAt(0).toLocaleUpperCase("es-SV") +
    value.slice(1).toLocaleLowerCase("es-SV")
  );
}

/** Recorre el contenido del sitio y capitaliza esos términos en textos visibles. */
export function capitalizeDioceseTermsIn<T>(value: T, key?: string): T {
  if (typeof value === "string") {
    if (key && SKIP_KEYS.has(key)) return value;
    return capitalizeDioceseTerms(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => capitalizeDioceseTermsIn(item, key)) as T;
  }
  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [nextKey, nextValue] of Object.entries(value)) {
      next[nextKey] = capitalizeDioceseTermsIn(nextValue, nextKey);
    }
    return next as T;
  }
  return value;
}
