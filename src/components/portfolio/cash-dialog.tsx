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
import { cn } from "@/lib/utils";
import {
  portfolioService,
  type CashAction,
  type PortfolioDetailDto,
} from "@/services/portfolio-service";
import { fmt } from "./format";

const copy: Record<CashAction, { title: string; field: string; button: string; help: string }> = {
  Deposit: {
    title: "Deposit cash",
    field: "Amount to add",
    button: "Deposit",
    help: "Money paid into your broker / exchange account.",
  },
  Withdraw: {
    title: "Withdraw cash",
    field: "Amount to take out",
    button: "Withdraw",
    help: "Money moved out of the account.",
  },
  Set: {
    title: "Set cash balance",
    field: "Balance shown by your broker",
    button: "Set balance",
    help: "Corrects the balance to match your broker / exchange; the difference is logged as an adjustment.",
  },
};

/** Deposit, withdraw, or set the portfolio's uninvested cash. */
export function CashDialog({
  open,
  onOpenChange,
  detail,
  initialAction = "Deposit",
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: PortfolioDetailDto;
  initialAction?: CashAction;
  onSaved: (detail: PortfolioDetailDto) => void;
}) {
  const ccy = detail.baseCurrency;
  const [action, setAction] = useState<CashAction>(initialAction);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAction(initialAction);
    setAmount(initialAction === "Set" ? String(detail.cashBalance) : "");
    setNotes("");
  }, [open, initialAction, detail.cashBalance]);

  const value = parseFloat(amount);
  const valid = action === "Set" ? value >= 0 : value > 0;
  const tooMuch = action === "Withdraw" && value > detail.cashBalance;

  const save = async () => {
    if (!valid) {
      toast.error(action === "Set" ? "Enter a balance of 0 or more." : "Enter an amount above 0.");
      return;
    }
    setSaving(true);
    try {
      const updated = await portfolioService.changeCash(detail.id, {
        action,
        amount: value,
        notes: notes || undefined,
      });
      toast.success(`Cash balance: ${ccy} ${fmt(updated.cashBalance)}`);
      onOpenChange(false);
      onSaved(updated);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update cash"));
    } finally {
      setSaving(false);
    }
  };

  const c = copy[action];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{c.title}</DialogTitle>
          <DialogDescription>{c.help}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/40 p-1" role="tablist">
            {(Object.keys(copy) as CashAction[]).map((a) => (
              <button
                key={a}
                type="button"
                role="tab"
                aria-selected={action === a}
                onClick={() => {
                  setAction(a);
                  setAmount(a === "Set" ? String(detail.cashBalance) : "");
                }}
                className={cn(
                  "rounded-md py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  action === a
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {a === "Set" ? "Set balance" : a}
              </button>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Current balance:{" "}
            <span className="font-semibold text-foreground tabular">
              {ccy} {fmt(detail.cashBalance)}
            </span>
          </p>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              {c.field} ({ccy})
            </label>
            <Input
              type="number"
              step="any"
              min="0"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="tabular"
            />
            {tooMuch && (
              <p className="mt-1 text-xs text-destructive">
                Only {ccy} {fmt(detail.cashBalance)} is available.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">
              Notes (optional)
            </label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving || !valid || tooMuch}>
            {saving ? "Saving..." : c.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
