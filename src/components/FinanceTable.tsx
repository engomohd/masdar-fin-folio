import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinanceEntry } from "@/lib/supabase";

interface FinanceTableProps {
  entries: FinanceEntry[];
}

export const FinanceTable = ({ entries }: FinanceTableProps) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="rounded-lg border bg-card shadow-sm overflow-hidden" dir="rtl">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  لا توجد عمليات مسجلة
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
