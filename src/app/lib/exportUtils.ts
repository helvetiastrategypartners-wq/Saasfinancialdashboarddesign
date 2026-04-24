export function formatExportRange(from: Date, to: Date): string {
  const fromLabel = from.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" });
  const toEnd = new Date(to.getTime() - 86400000);
  const toLabel = toEnd.toLocaleDateString("fr-CH", { month: "short", year: "2-digit" });
  return fromLabel === toLabel ? fromLabel : `${fromLabel} - ${toLabel}`;
}

export function formatDeltaPercent(current: number, previous: number | null | undefined): string {
  if (previous == null || previous === 0) {
    return "-";
  }

  return `${(((current - previous) / Math.abs(previous)) * 100).toFixed(1)}%`;
}

export function escapeCsvCell(value: string | number | null | undefined): string {
  const stringValue = String(value ?? "");
  return stringValue.includes(";") || stringValue.includes('"') || stringValue.includes("\n")
    ? `"${stringValue.replace(/"/g, '""')}"`
    : stringValue;
}

export function createCsvRow(columns: Array<string | number | null | undefined>): string {
  return columns.map(escapeCsvCell).join(";");
}

export function formatCompactNumber(value: number | null | undefined): string {
  const numericValue = Number(value ?? 0);
  const sign = numericValue < 0 ? "-" : "";
  const absoluteValue = Math.abs(numericValue);
  const hasCents = Math.round(absoluteValue * 100) % 100 !== 0;
  const [integerPart, decimalPart] = absoluteValue.toFixed(hasCents ? 2 : 0).split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  return sign + (hasCents ? `${formattedInteger}.${decimalPart}` : formattedInteger);
}

export function formatChfValue(value: number | null | undefined): string {
  return `CHF ${formatCompactNumber(value)}`;
}

export function appendPdfPageNumbers(doc: {
  internal: any;
  setPage: (page: number) => void;
  setFontSize: (size: number) => void;
  setTextColor: (r: number, g: number, b: number) => void;
  text: (text: string, x: number, y: number, options?: { align?: string }) => void;
}, pageWidth: number): void {
  const internal = doc.internal as any;
  const pages = internal.getNumberOfPages ? internal.getNumberOfPages() : internal.pages.length - 1;

  for (let index = 1; index <= pages; index += 1) {
    doc.setPage(index);
    doc.setFontSize(7.5);
    doc.setTextColor(160, 160, 160);
    doc.text(`Page ${index} / ${pages}`, pageWidth / 2, 290, { align: "center" });
  }
}
