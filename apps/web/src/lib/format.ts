export function formatUsd(minorUnits: number): string {
  return (minorUnits / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}
