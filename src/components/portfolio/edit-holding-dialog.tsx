import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiErrorMessage } from "@/lib/api-error";
import {
  portfolioService,
  type HoldingDto,
  type PortfolioDetailDto,
} from "@/services/portfolio-service";

const label = "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block";

/**
 * Corrects a holding's quantity / average price without moving cash — for fixing a typo or matching
 * the broker. Real buys and sells belong in the Trade dialog so cash and realised P/L stay right.
 */
export function EditHoldingDialog({
  holding,
  detail,
  onOpenChange,
  onSaved,
}: {
  holding: HoldingDto | null;
  detail: PortfolioDetailDto;
  onOpenChange: (open: boolean) => void;
  onSaved: (detail: PortfolioDetailDto) => void;
}) {
  const isStock = detail.type === "Stocks";
  const [quantity, setQuantity] = useState("");
  const [avg, setAvg] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!holding) return;
    setQuantity(String(holding.quantity));
    setAvg(String(holding.averageBuyPrice));
  }, [holding]);

  const qty = parseFloat(quantity);
  const price = parseFloat(avg);
  const valid = qty > 0 && price >= 0;

  const save = async () => {
    if (!holding || !valid) return;
    setSaving(true);
    try {
      const updated = await portfolioService.updateHolding(detail.id, holding.id, {
        quantity: qty,
        averageBuyPrice: price,
      });
      toast.success(`${holding.symbol} updated`);
      onOpenChange(false);
      onSaved(updated);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update holding"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={holding != null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit {holding?.symbol}</DialogTitle>
          <DialogDescription>
            Corrects the holding without moving cash. To record a real buy or sell, use Trade.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div>
            <label className={label}>Quantity</label>
            <Input
              type="number"
              step="any"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="tabular"
            />
          </div>
          <div>
            <label className={label}>
              Avg buy price ({detail.baseCurrency}){isStock ? " — trade price, before fees" : ""}
            </label>
            <Input
              type="number"
              step="any"
              min="0"
              value={avg}
              onChange={(e) => setAvg(e.target.value)}
              className="tabular"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving || !valid}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
