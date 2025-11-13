import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getAuthState, FinanceEntry, FinanceFilters as Filters } from "@/lib/supabase";
import { FinanceFilters } from "@/components/FinanceFilters";
import { FinanceTable } from "@/components/FinanceTable";
import { FinanceSummary } from "@/components/FinanceSummary";
import { Pagination } from "@/components/Pagination";
import masdarLogo from "@/assets/masdar-logo.png";

type Period = "current_month" | "last_month" | "last_3_months" | "last_6_months" | "current_year" | "last_year";

const Report = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [period, setPeriod] = useState<Period>("current_month");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({
    incomeNet: 0,
    incomeVat: 0,
    expenseNet: 0,
    expenseVat: 0,
  });
  const itemsPerPage = 10;

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
  }, [userId, filters, currentPage, period]);

  const fetchData = async () => {
    if (!userId) return;

    // Calculate date range based on period
    const now = new Date();
    let dateFrom = "";
    let dateTo = "";

    switch (period) {
      case "current_month":
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case "last_month":
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case "last_3_months":
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case "last_6_months":
        dateFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case "current_year":
        dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      case "last_year":
        dateFrom = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        dateTo = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
    }

    // Build query
    let query = supabase
      .from("finance_entries")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .order("date", { ascending: false });

    if (filters.date_from) {
      query = query.gte("date", filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte("date", filters.date_to);
    }
    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.currency) {
      query = query.eq("currency", filters.currency);
    }
    if (filters.location) {
      query = query.eq("location", filters.location);
    }
    if (filters.search) {
      query = query.or(`project_name.ilike.%${filters.search}%,amount_net.eq.${parseFloat(filters.search) || 0},amount_gross.eq.${parseFloat(filters.search) || 0}`);
    }

    // Fetch paginated data
    const { data, count, error } = await query.range(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage - 1
    );

    if (error) {
      toast.error("فشل في تحميل البيانات: " + error.message);
    } else {
      setEntries((data as FinanceEntry[]) || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    }

    // Fetch summary (without pagination)
    let summaryQuery = supabase
      .from("finance_entries")
      .select("type, amount_net, vat_amount, status")
      .eq("user_id", userId)
      .gte("date", dateFrom)
      .lte("date", dateTo)
      .neq("status", "غير مدفوع");

    if (filters.date_from) summaryQuery = summaryQuery.gte("date", filters.date_from);
    if (filters.date_to) summaryQuery = summaryQuery.lte("date", filters.date_to);
    if (filters.type) summaryQuery = summaryQuery.eq("type", filters.type);
    if (filters.currency) summaryQuery = summaryQuery.eq("currency", filters.currency);
    if (filters.location) summaryQuery = summaryQuery.eq("location", filters.location);
    if (filters.search) {
      summaryQuery = summaryQuery.or(`project_name.ilike.%${filters.search}%,amount_net.eq.${parseFloat(filters.search) || 0},amount_gross.eq.${parseFloat(filters.search) || 0}`);
    }

    const { data: summaryData } = await summaryQuery;

    if (summaryData) {
      const incomeNet = summaryData
        .filter((e) => e.type === "income")
        .reduce((sum, e) => sum + Number(e.amount_net), 0);
      const incomeVat = summaryData
        .filter((e) => e.type === "income")
        .reduce((sum, e) => sum + Number(e.vat_amount), 0);
      const expenseNet = summaryData
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + Number(e.amount_net), 0);
      const expenseVat = summaryData
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + Number(e.vat_amount), 0);

      setSummary({ incomeNet, incomeVat, expenseNet, expenseVat });
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5" dir="rtl">
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between bg-card rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <img src={masdarLogo} alt="Masdar Logo" className="h-16 w-auto" />
            <h1 className="text-3xl font-bold text-primary">تقرير الإيرادات والمصروفات</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/analytics">
              <Button variant="outline">التحليلات</Button>
            </Link>
            <Link to="/">
              <Button variant="outline">لوحة التحكم</Button>
            </Link>
            <Link to="/deleted-log">
              <Button variant="outline">سجل المحذوفات</Button>
            </Link>
          </div>
        </div>

        {/* Period Selector */}
        <div className="bg-card rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">الفترة الزمنية:</label>
            <Select value={period} onValueChange={(value) => { setPeriod(value as Period); setCurrentPage(1); }}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_month">الشهر الحالي</SelectItem>
                <SelectItem value="last_month">الشهر الماضي</SelectItem>
                <SelectItem value="last_3_months">آخر 3 أشهر</SelectItem>
                <SelectItem value="last_6_months">آخر 6 أشهر</SelectItem>
                <SelectItem value="current_year">السنة الحالية</SelectItem>
                <SelectItem value="last_year">السنة الماضية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filters */}
        <FinanceFilters filters={filters} onFilterChange={setFilters} onClear={handleClearFilters} />

        {/* Table */}
        <FinanceTable entries={entries} />

        {/* Pagination */}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

        {/* Summary */}
        <FinanceSummary
          incomeNet={summary.incomeNet}
          incomeVat={summary.incomeVat}
          expenseNet={summary.expenseNet}
          expenseVat={summary.expenseVat}
        />
      </div>
    </div>
  );
};

export default Report;
