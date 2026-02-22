/**
 * Formatiranje iznosa (prema docs/ui-rules.md — uvek formatCurrency za prikaz)
 */
export function formatCurrency(iznos: number): string {
  return (
    iznos.toLocaleString("sr-RS", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " RSD"
  )
}
