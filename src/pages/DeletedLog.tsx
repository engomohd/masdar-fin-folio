import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import masdarLogo from "@/assets/masdar-logo.png";

interface DeletedEntry {
  id: string;
  original_entry_id: string;
  date: string;
  project_name: string;
  type: string;
  currency: string;
  amount_net: number;
  vat_amount: number;
  amount_gross: number;
  status: string;
  location: string;
  deleted_at: string;
}

const DeletedLog = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DeletedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchDeletedEntries();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchDeletedEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("deleted_entries")
      .select("*")
      .order("deleted_at", { ascending: false });

    if (error) {
      toast.error(error.message);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  };

  const handlePermanentDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه العملية نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    
    setDeletingId(id);
    const { error } = await supabase
      .from("deleted_entries")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تم الحذف النهائي للعملية");
      fetchDeletedEntries();
    }
    setDeletingId(null);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString("ar-SA");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5" dir="rtl">
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <img src={masdarLogo} alt="Masdar Logo" className="h-16 w-auto" />
            <h1 className="text-3xl font-bold text-primary">سجل العمليات المحذوفة</h1>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline">لوحة التحكم</Button>
            </Link>
            <Link to="/report">
              <Button variant="outline">التقارير</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary/5">
                  <TableHead className="text-center font-bold text-primary">تاريخ</TableHead>
                  <TableHead className="text-center font-bold text-primary">المشروع</TableHead>
                  <TableHead className="text-center font-bold text-primary">النوع</TableHead>
                  <TableHead className="text-center font-bold text-primary">العملة</TableHead>
                  <TableHead className="text-center font-bold text-primary">الموقع</TableHead>
                  <TableHead className="text-center font-bold text-primary">المبلغ (SAR)</TableHead>
                  <TableHead className="text-center font-bold text-primary">ضريبة</TableHead>
                  <TableHead className="text-center font-bold text-primary">شامل</TableHead>
                  <TableHead className="text-center font-bold text-primary">الحالة</TableHead>
                  <TableHead className="text-center font-bold text-primary">تاريخ الحذف</TableHead>
                  <TableHead className="text-center font-bold text-primary">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      جاري التحميل...
                    </TableCell>
                  </TableRow>
                ) : entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                      لا توجد عمليات محذوفة
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-center">{entry.date}</TableCell>
                      <TableCell className="text-center">{entry.project_name}</TableCell>
                      <TableCell className="text-center">
                        <span className={entry.type === "income" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                          {entry.type === "income" ? "إيراد" : "مصروف"}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{entry.currency}</TableCell>
                      <TableCell className="text-center">{entry.location === "Saudi Arabia" ? "السعودية" : "الأردن"}</TableCell>
                      <TableCell className="text-center font-mono">{formatNumber(entry.amount_net)}</TableCell>
                      <TableCell className="text-center font-mono">{formatNumber(entry.vat_amount)}</TableCell>
                      <TableCell className="text-center font-mono">{formatNumber(entry.amount_gross)}</TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            entry.status === "مدفوع"
                              ? "bg-green-100 text-green-800"
                              : entry.status === "معلق"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-center text-sm">{formatDateTime(entry.deleted_at)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePermanentDelete(entry.id)}
                          disabled={deletingId === entry.id}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeletedLog;
