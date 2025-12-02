
import { Button } from "@/components/ui/button";
import type { MonthlySummary } from "../types";

type MonthlySummaryReportProps = {
  summary: MonthlySummary;
};

export function MonthlySummaryReport({ summary }: MonthlySummaryReportProps) {
  const { month, totalBefore, totalAfter, difference } = summary;
  const isPositive = difference >= 0;

  return (
    <section className="flex flex-col gap-4 rounded-lg border bg-card p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            Monthly Summary
          </p>
          <p className="text-lg font-semibold">{month}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          type="button"
          // scaffold: real app có thể mở modal hoặc navigate tới /transactions/report
          onClick={() => {
            // placeholder action
          }}
        >
          View Report
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Before</p>
          <p className="text-base font-semibold">
            ${totalBefore.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">After</p>
          <p className="text-base font-semibold">
            ${totalAfter.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Difference</p>
          <p
            className={`text-base font-semibold ${
              isPositive ? "text-emerald-500" : "text-rose-500"
            }`}
          >
            {isPositive ? "+" : "-"}$
            {Math.abs(difference).toLocaleString()}
          </p>
        </div>
      </div>
    </section>
  );
}


