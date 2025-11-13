import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinanceSummaryProps {
  incomeNet: number;
  incomeVat: number;
  expenseNet: number;
  expenseVat: number;
}

export const FinanceSummary = ({ incomeNet, incomeVat, expenseNet, expenseVat }: FinanceSummaryProps) => {
  const netProfit = incomeNet - expenseNet;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const summaryItems = [
    { title: "إجمالي الإيرادات (بدون ضريبة)", value: incomeNet, color: "text-green-600" },
    { title: "إجمالي ضريبة الإيرادات", value: incomeVat, color: "text-green-500" },
    { title: "إجمالي المصروفات (بدون ضريبة)", value: expenseNet, color: "text-red-600" },
    { title: "إجمالي ضريبة المصروفات", value: expenseVat, color: "text-red-500" },
    { title: "صافي الربح", value: netProfit, color: netProfit >= 0 ? "text-primary" : "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4" dir="rtl">
      {summaryItems.map((item, index) => (
        <Card key={index} className="shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${item.color}`}>{formatNumber(item.value)}</p>
            <p className="text-xs text-muted-foreground mt-1">ريال</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
