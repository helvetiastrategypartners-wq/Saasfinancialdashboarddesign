export const EMPTY_DATA_LABEL = "Donnees vides";

export function hasAnyData(...collections: Array<unknown[] | null | undefined>) {
  return collections.some((collection) => (collection?.length ?? 0) > 0);
}

export function formatMonthsOrEmpty(value: number, hasData: boolean) {
  if (!hasData || !Number.isFinite(value) || value >= 999) {
    return EMPTY_DATA_LABEL;
  }

  return `${value.toFixed(1)} mois`;
}

export function formatRatioOrEmpty(value: number, hasData: boolean) {
  if (!hasData || !Number.isFinite(value) || value <= 0) {
    return EMPTY_DATA_LABEL;
  }

  return `${value.toFixed(1)}x`;
}

export function formatPercentOrEmpty(value: number | null | undefined, hasData: boolean) {
  if (!hasData || value == null || !Number.isFinite(value)) {
    return EMPTY_DATA_LABEL;
  }

  return `${value.toFixed(1)}%`;
}
