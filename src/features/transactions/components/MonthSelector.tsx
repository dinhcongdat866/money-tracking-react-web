
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MonthSelectorProps = {
  months: string[]; // format YYYY-MM
  selectedMonth: string;
  onChange: (month: string) => void;
};

function formatMonthLabelFromKey(key: string) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, 1);
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function MonthSelector({
  months,
  selectedMonth,
  onChange,
}: MonthSelectorProps) {
  if (!months || months.length === 0) {
    return null;
  }

  return (
    <Tabs
      value={selectedMonth}
      onValueChange={onChange}
      className="w-full overflow-x-auto"
    >
      <TabsList className="justify-start">
        {months.map((m) => (
          <TabsTrigger key={m} value={m}>
            {formatMonthLabelFromKey(m)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}


