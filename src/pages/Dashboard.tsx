import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signOut, getAuthState, FinanceEntry, FinanceFilters as Filters } from "@/lib/supabase";
import { FinanceFilters } from "@/components/FinanceFilters";
import { AddEntryForm } from "@/components/AddEntryForm";
import { FinanceTable } from "@/components/FinanceTable";
import { FinanceSummary } from "@/components/FinanceSummary";
import { Pagination } from "@/components/Pagination";
import masdarLogo from "@/assets/masdar-logo.png";
import { LogOut, FileText } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [filters, setFilters] = useState<Filters>({});
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
  }, [userId, filters, currentPage]);

  const fetchData = async () => {
    if (!userId) return;

    // Build query
    let query = supabase
      .from("finance_entries")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
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
      .neq("status", "غير مدفوع");

    if (filters.date_from) summaryQuery = summaryQuery.gte("date", filters.date_from);
    if (filters.date_to) summaryQuery = summaryQuery.lte("date", filters.date_to);
    if (filters.type) summaryQuery = summaryQuery.eq("type", filters.type);
    if (filters.currency) summaryQuery = summaryQuery.eq("currency", filters.currency);
    if (filters.location) summaryQuery = summaryQuery.eq("location", filters.location);

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

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("فشل في تسجيل الخروج: " + error.message);
    } else {
      navigate("/auth");
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5" dir="rtl">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-card rounded-lg p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <img src={masdarLogo} alt="Masdar Logo" className="h-16 w-auto" />
            <h1 className="text-3xl font-bold text-primary">لوحة التحكم المالية</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/report")} className="gap-2">
              <FileText className="h-4 w-4" />
              التقارير
            </Button>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              تسجيل خروج
            </Button>
          </div>
        </div>

        {/* Filters */}
        <FinanceFilters filters={filters} onFilterChange={setFilters} onClear={handleClearFilters} />

        {/* Add Entry Form */}
        {userId && <AddEntryForm userId={userId} onSuccess={fetchData} />}

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

export default Dashboard;
