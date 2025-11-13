import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FinanceSummaryProps {
  incomeNet: number;
  incomeVat: number;
  expenseNet: number;
  expenseVat: number;
}

export const FinanceSummary = ({ incomeNet, incomeVat, expenseNet, expenseVat }: FinanceSummaryProps) => {
  const netProfit = incomeNet - expenseNet;
  const convertToJOD = (amountSAR: number) => amountSAR / 5.4;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const summaryItems = [
    { title: "إجمالي الإيرادات (بدون ضريبة)", value: incomeNet, valueJOD: convertToJOD(incomeNet), color: "text-green-600" },
    { title: "إجمالي ضريبة الإيرادات", value: incomeVat, valueJOD: convertToJOD(incomeVat), color: "text-green-500" },
    { title: "إجمالي المصروفات (بدون ضريبة)", value: expenseNet, valueJOD: convertToJOD(expenseNet), color: "text-red-600" },
    { title: "إجمالي ضريبة المصروفات", value: expenseVat, valueJOD: convertToJOD(expenseVat), color: "text-red-500" },
    { title: "صافي الربح", value: netProfit, valueJOD: convertToJOD(netProfit), color: netProfit >= 0 ? "text-primary" : "text-destructive" },
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
            <p className={`text-lg font-semibold ${item.color} mt-2`}>{formatNumber(item.valueJOD)}</p>
            <p className="text-xs text-muted-foreground">دينار</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
