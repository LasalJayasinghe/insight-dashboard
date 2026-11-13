// Price formatting shared by the CSE stock components.

export function fmtPrice(price: number) {
  return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtChange(change: number) {
  return (
    (change > 0 ? "+" : "") +
    change.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}
