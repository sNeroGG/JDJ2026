const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_ID_RE = /^[a-z0-9][a-z0-9_-]{1,79}$/i;
const ORDER_ID_RE = /^JDJ-[A-Z0-9]{4,24}$/;

export function isUuid(value: string) {
  return UUID_RE.test(value);
}

export function isSafeId(value: string) {
  return SAFE_ID_RE.test(value);
}

export function isOrderId(value: string) {
  return ORDER_ID_RE.test(value);
}
