import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceEntry } from "@/lib/supabase";
import { TrendingUp, TrendingDown, DollarSign, Calendar } from "lucide-react";

interface DashboardWidgetsProps {
  recentEntries: FinanceEntry[];
  monthlyStats: {
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
    transactionCount: number;
  };
  period: string;
}

export const DashboardWidgets = ({ recentEntries, monthlyStats, period }: DashboardWidgetsProps) => {
  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      current_month: "هذا الشهر",
      last_month: "الشهر الماضي",
      last_3_months: "آخر 3 أشهر",
      last_6_months: "آخر 6 أشهر",
      current_year: "هذه السنة",
      last_year: "السنة الماضية",
    };
    return labels[period] || "هذا الشهر";
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" dir="rtl">
      {/* Monthly Quick Stats */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            إحصائيات {getPeriodLabel(period)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">الإيرادات</p>
              <p className="text-2xl font-bold text-green-600">{formatNumber(monthlyStats.totalIncome)}</p>
              <p className="text-xs text-muted-foreground">ريال</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">المصروفات</p>
              <p className="text-2xl font-bold text-red-600">{formatNumber(monthlyStats.totalExpense)}</p>
              <p className="text-xs text-muted-foreground">ريال</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">الصافي</p>
              <p className={`text-2xl font-bold ${monthlyStats.netProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                {formatNumber(monthlyStats.netProfit)}
              </p>
              <p className="text-xs text-muted-foreground">ريال</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">العمليات</p>
              <p className="text-2xl font-bold text-primary">{monthlyStats.transactionCount}</p>
              <p className="text-xs text-muted-foreground">عملية</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            آخر العمليات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد عمليات</p>
            ) : (
              recentEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    {entry.type === "income" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{entry.project_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(entry.date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${entry.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {entry.type === "income" ? "+" : "-"}{formatNumber(entry.amount_gross)}
                    </p>
                    <p className="text-xs text-muted-foreground">{entry.currency}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
