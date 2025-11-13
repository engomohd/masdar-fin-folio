import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAuthState, FinanceEntry } from "@/lib/supabase";
import { DashboardWidgets } from "@/components/DashboardWidgets";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import masdarLogo from "@/assets/masdar-logo.png";

const Analytics = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    transactionCount: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    const { getSession, onAuthChange } = getAuthState();

    getSession().then(({ session, user }) => {
      if (!session || !user) {
        navigate("/auth");
      } else {
        setUserId(user.id);
      }
    });

    const unsubscribe = onAuthChange((session, user) => {
      if (!session || !user) {
        navigate("/auth");
      } else {
        setUserId(user.id);
      }
    });

    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [userId]);

  const fetchData = async () => {
    if (!userId) return;

    // Fetch all entries
    const { data, error } = await supabase
      .from("finance_entries")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    if (error) {
      toast.error("فشل في تحميل البيانات: " + error.message);
      return;
    }

    setEntries((data as FinanceEntry[]) || []);

    // Calculate monthly stats (current month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    const monthlyData = (data as FinanceEntry[]).filter(
      (e) => e.date >= firstDayOfMonth && e.date <= lastDayOfMonth && e.status !== "غير مدفوع"
    );

    const totalIncome = monthlyData
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + Number(e.amount_net), 0);
    const totalExpense = monthlyData
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + Number(e.amount_net), 0);
    const netProfit = totalIncome - totalExpense;
    const transactionCount = monthlyData.length;

    setMonthlyStats({ totalIncome, totalExpense, netProfit, transactionCount });

    // Prepare chart data (last 6 months)
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.toLocaleDateString("ar-SA", { month: "short", year: "numeric" }),
        firstDay: new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0],
        lastDay: new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0],
      });
    }

    const monthlyChartData = months.map((m) => {
      const monthEntries = (data as FinanceEntry[]).filter(
        (e) => e.date >= m.firstDay && e.date <= m.lastDay && e.status !== "غير مدفوع"
      );

      const income = monthEntries
        .filter((e) => e.type === "income")
        .reduce((sum, e) => sum + Number(e.amount_net), 0);
      const expense = monthEntries
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + Number(e.amount_net), 0);

      return {
        month: m.month,
        إيرادات: income,
        مصروفات: expense,
        صافي: income - expense,
      };
    });

    setChartData(monthlyChartData);

    // Prepare pie chart data (all time)
    const totalIncomeAll = (data as FinanceEntry[])
      .filter((e) => e.type === "income" && e.status !== "غير مدفوع")
      .reduce((sum, e) => sum + Number(e.amount_net), 0);
    const totalExpenseAll = (data as FinanceEntry[])
      .filter((e) => e.type === "expense" && e.status !== "غير مدفوع")
      .reduce((sum, e) => sum + Number(e.amount_net), 0);

    setPieData([
      { name: "إيرادات", value: totalIncomeAll },
      { name: "مصروفات", value: totalExpenseAll },
    ]);
  };

  const COLORS = ["#22c55e", "#ef4444"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5" dir="rtl">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl space-y-6">
        <div className="flex items-center justify-between bg-card rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <img src={masdarLogo} alt="Masdar Logo" className="h-16 w-auto" />
            <h1 className="text-3xl font-bold text-primary">لوحة التحليلات والإحصائيات</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline">لوحة التحكم</Button>
            </Link>
            <Link to="/report">
              <Button variant="outline">التقارير</Button>
            </Link>
            <Link to="/deleted-log">
              <Button variant="outline">سجل المحذوفات</Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Widgets */}
        <DashboardWidgets recentEntries={entries} monthlyStats={monthlyStats} />

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart - Monthly Trends */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>تحليل الإيرادات والمصروفات (آخر 6 أشهر)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="إيرادات" fill="#22c55e" />
                  <Bar dataKey="مصروفات" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line Chart - Net Profit Trend */}
          <Card>
            <CardHeader>
              <CardTitle>اتجاه صافي الربح</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="صافي" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Income vs Expense */}
          <Card>
            <CardHeader>
              <CardTitle>نسبة الإيرادات للمصروفات (إجمالي)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${(entry.value / (pieData[0].value + pieData[1].value) * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
